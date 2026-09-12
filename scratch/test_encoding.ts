import { PrismaClient } from "@prisma/client";

const dbUrl = "postgresql://postgres:postgres@localhost:5432/brandoffice?schema=public&options=-c%20client_encoding%3DUTF8";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function main() {
  try {
    const ws = await prisma.workspace.findFirst();
    if (!ws) {
      console.log("No workspace found");
      return;
    }

    const testText = "Shoxjaxon 50 Reels 30 kun — Bu yoshlar uchun a'lo imkoniyat: ç, ğ, ş, →, 🚀";

    const item = await prisma.contentItem.create({
      data: {
        workspaceId: ws.id,
        title: "Test Word File UTF8",
        type: "text",
        editorialStatus: "approved",
        productionStatus: "ready_to_shoot",
        versions: {
          create: {
            versionNumber: 1,
            payload: {
              title: "Test Word File UTF8",
              spokenText: testText,
              fileType: "text",
            },
          },
        },
      },
    });

    console.log("SUCCESS! Created item ID with special chars:", item.id);
  } catch (err) {
    console.error("FAILED INSERTION ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
