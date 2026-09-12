import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Setting database and user client_encoding to UTF8...");
    await prisma.$executeRawUnsafe("ALTER DATABASE brandoffice SET client_encoding TO 'UTF8';");
    await prisma.$executeRawUnsafe("ALTER USER postgres SET client_encoding TO 'UTF8';");
    console.log("Database encoding configuration updated successfully!");
  } catch (err) {
    console.error("Error setting encoding:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
