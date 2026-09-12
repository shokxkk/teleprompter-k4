import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import mammoth from "mammoth";

function sanitizeDbString(str: string): string {
  if (!str) return "";
  return str
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/↑/g, "^")
    .replace(/↓/g, "v")
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’`ʼʻ]/g, "'")
    .replace(/…/g, "...")
    .replace(/ç/g, "c").replace(/Ç/g, "C")
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/ð/g, "d").replace(/Ð/g, "D")
    .replace(/þ/g, "th").replace(/Þ/g, "TH")
    .replace(/æ/g, "ae").replace(/Æ/g, "AE")
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u0400-\u045F\u0490\u0491\u04A0\u04A1\u04B0\u04B1\u04E8\u04E9]/g, "");
}

export async function POST(req: Request) {
  try {
    const { workspace } = await requireAuth();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const directText = formData.get("text") as string | null;
    const titleInput = formData.get("title") as string | null;

    let scriptText = "";
    let scriptTitle = titleInput ?? "Сценарий";
    let fileType = "text"; // "text" | "image"
    let imageUrl: string | null = null;

    if (file) {
      scriptTitle = file.name.replace(/\.[^/.]+$/, "");
      const ext = file.name.toLowerCase().split(".").pop();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext ?? "")) {
        // Image Teleprompter Mode
        fileType = "image";
        const mime = file.type || `image/${ext}`;
        imageUrl = `data:${mime};base64,${buffer.toString("base64")}`;
        scriptText = `[Изображение: ${file.name}]`;
      } else {
        // Try Mammoth first for any Word / Docx / Office document
        try {
          const result = await mammoth.extractRawText({ buffer });
          if (result.value && result.value.trim().length > 0) {
            scriptText = result.value.trim();
          }
        } catch (mErr) {
          console.warn("Mammoth extraction skipped/failed:", mErr);
        }

        // If mammoth didn't produce text (e.g. pptx, txt, pdf or legacy doc), extract XML/text strings
        if (!scriptText) {
          const raw = buffer.toString("utf-8");
          const matches = raw.match(/<a:t[^>]*>(.*?)<\/a:t>|<w:t[^>]*>(.*?)<\/w:t>/g);
          if (matches) {
            scriptText = matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ").trim();
          } else {
            scriptText = raw
              .replace(/[^\x20-\x7E\u0400-\u04FF\u0100-\u017F\n\r\t]/g, " ")
              .replace(/\s+/g, " ")
              .trim();
          }
        }
      }
    } else if (directText) {
      scriptText = directText.trim();
    }

    if (!scriptText && !imageUrl) {
      return NextResponse.json({ error: "Не удалось прочитать файл или файл пустой" }, { status: 400 });
    }

    const cleanTitle = sanitizeDbString(scriptTitle);
    const cleanText = sanitizeDbString(scriptText);

    // Save to Database
    const contentItem = await prisma.contentItem.create({
      data: {
        workspaceId: workspace.id,
        title: cleanTitle,
        type: fileType,
        editorialStatus: "approved",
        productionStatus: "ready_to_shoot",
        versions: {
          create: {
            versionNumber: 1,
            payload: {
              title: cleanTitle,
              spokenText: cleanText,
              fileType,
              imageUrl,
            },
          },
        },
      },
      include: {
        versions: {
          take: 1,
          orderBy: { versionNumber: "desc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      item: contentItem,
    });
  } catch (err: any) {
    console.error("Upload route error:", err);
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err?.message || "Ошибка обработки файла" },
      { status: 500 }
    );
  }
}
