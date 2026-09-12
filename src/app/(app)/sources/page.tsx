import { Metadata } from "next";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { SourcesPageClient } from "./SourcesPageClient";

export const metadata: Metadata = { title: "Источники и факты" };

export default async function SourcesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const workspace = await prisma.workspace.findUnique({
    where: { ownerId: session.user.id },
  });
  if (!workspace) return null;

  const sources = await prisma.source.findMany({
    where: { workspaceId: workspace.id },
    include: { facts: true },
    orderBy: { createdAt: "desc" },
  });

  const facts = await prisma.fact.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
  });

  return <SourcesPageClient sources={sources} facts={facts} />;
}
