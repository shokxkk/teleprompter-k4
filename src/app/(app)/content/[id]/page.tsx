import { Metadata } from "next";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { ContentEditorClient } from "./ContentEditorClient";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Редактор сценария" };

export default async function ContentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const workspace = await prisma.workspace.findUnique({
    where: { ownerId: session!.user!.id! },
  });
  if (!workspace) return null;

  const item = await prisma.contentItem.findFirst({
    where: { id, workspaceId: workspace.id },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { issues: true },
          },
          approvals: { orderBy: { approvedAt: "desc" }, take: 1 },
        },
      },
      publications: { orderBy: { publishedAt: "desc" }, take: 1 },
    },
  });

  if (!item) notFound();

  const facts = await prisma.fact.findMany({
    where: { workspaceId: workspace.id },
    select: { id: true, claim: true, publicationPermission: true },
  });

  const brandVersion = await prisma.brandVersion.findFirst({
    where: { brandProfile: { workspaceId: workspace.id }, status: "active" },
    select: { publicName: true, startYear: true },
  });

  return (
    <ContentEditorClient
      item={item}
      facts={facts}
      brandProfile={brandVersion}
    />
  );
}
