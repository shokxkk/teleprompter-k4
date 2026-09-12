import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`SHOW client_encoding;`;
  console.log("Current client_encoding:", result);
  
  const dbEncoding = await prisma.$queryRaw`SELECT datname, pg_encoding_to_char(encoding) FROM pg_database WHERE datname = 'brandoffice';`;
  console.log("Database encoding:", dbEncoding);
}

main().finally(() => prisma.$disconnect());
