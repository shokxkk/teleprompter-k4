import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";

export async function GET() {
  try {
    const { workspace } = await requireAuth();

    const items = await prisma.contentItem.findMany({
      where: {
        workspaceId: workspace.id,
      },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ items });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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
    const body = await req.json();
    const { title, text } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: "Текст обязателен" }, { status: 400 });
    }

    const scriptTitle = sanitizeDbString(title?.trim() || "Новый сценарий");
    const scriptText = sanitizeDbString(text.trim());

    const item = await prisma.contentItem.create({
      data: {
        workspaceId: workspace.id,
        title: scriptTitle,
        type: "reel",
        editorialStatus: "approved",
        productionStatus: "ready_to_shoot",
        versions: {
          create: {
            versionNumber: 1,
            payload: {
              title: scriptTitle,
              spokenText: scriptText,
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

    return NextResponse.json({ item });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { workspace } = await requireAuth();
    const body = await req.json();
    const { id, title, text } = body;

    if (!id) {
      return NextResponse.json({ error: "ID обязателен" }, { status: 400 });
    }

    const scriptTitle = sanitizeDbString(title?.trim() || "Сценарий");
    const scriptText = sanitizeDbString(text?.trim() || "");

    const updated = await prisma.contentItem.update({
      where: { id, workspaceId: workspace.id },
      data: {
        title: scriptTitle,
        versions: {
          create: {
            versionNumber: Date.now(),
            payload: {
              title: scriptTitle,
              spokenText: scriptText,
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

    return NextResponse.json({ item: updated });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { workspace } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID обязателен" }, { status: 400 });
    }

    try {
      await prisma.contentItem.delete({
        where: { id, workspaceId: workspace.id },
      });
    } catch (e) {
      // Ignore if item was local-only or already deleted
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

