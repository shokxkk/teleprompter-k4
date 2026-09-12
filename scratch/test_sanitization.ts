import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function sanitizeForWin1251(str: string): string {
  if (!str) return "";
  return str
    // Common unicode symbols & quotes
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/↑/g, "^")
    .replace(/↓/g, "v")
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’`ʼʻ]/g, "'")
    .replace(/…/g, "...")
    // Common non-WIN1251 Latin diacritics / letters
    .replace(/ç/g, "c").replace(/Ç/g, "C")
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/ð/g, "d").replace(/Ð/g, "D")
    .replace(/þ/g, "th").replace(/Þ/g, "TH")
    .replace(/æ/g, "ae").replace(/Æ/g, "AE")
    // Remove emojis and surrogate pairs outside BMP / non-WIN1251 range
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")
    // Remove any character not supported in WIN1251 (keep ASCII + Russian/Uzbek Cyrillic + basic Latin)
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u0400-\u045F\u0490\u0491\u04A0\u04A1\u04B0\u04B1\u04E8\u04E9]/g, "");
}

async function main() {
  try {
    const ws = await prisma.workspace.findFirst();
    if (!ws) {
      console.log("No workspace found");
      return;
    }

    const testText = "Shoxjaxon 50 Reels 30 kun — Bu yoshlar uchun a'lo imkoniyat: ç, ğ, ş, →, 🚀, «Привет, мир!», O'zbekiston, Har bir kun yangi imkoniyat!";

    const cleanText = sanitizeForWin1251(testText);
    console.log("Cleaned text:", cleanText);

    const item = await prisma.contentItem.create({
      data: {
        workspaceId: ws.id,
        title: sanitizeForWin1251("Test Word File Sanitized"),
        type: "text",
        editorialStatus: "approved",
        productionStatus: "ready_to_shoot",
        versions: {
          create: {
            versionNumber: 1,
            payload: {
              title: sanitizeForWin1251("Test Word File Sanitized"),
              spokenText: cleanText,
              fileType: "text",
            },
          },
        },
      },
    });

    console.log("SUCCESS! Created item ID:", item.id);
  } catch (err) {
    console.error("FAILED INSERTION ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
