import { Metadata } from "next";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { ContentClient } from "./ContentClient";

export const metadata: Metadata = { title: "Контент" };

export default async function ContentPage() {
  const session = await auth();
  const workspace = await prisma.workspace.findUnique({
    where: { ownerId: session!.user!.id! },
  });
  if (!workspace) return null;

  const items = await prisma.contentItem.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        select: { versionNumber: true, payload: true, createdAt: true },
      },
      publications: { orderBy: { publishedAt: "desc" }, take: 1 },
      planItems: {
        select: { scheduledDate: true },
        take: 1,
      },
    },
  });

  return <ContentClient items={items} />;
}
