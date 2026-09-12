import { Metadata } from "next";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { ShootingPageClient } from "./ShootingPageClient";

export const metadata: Metadata = { title: "Телесуфлёр / Съёмка" };

export default async function ShootingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const workspace = await prisma.workspace.findUnique({
    where: { ownerId: session.user.id },
  });
  if (!workspace) return null;

  const readyItems = await prisma.contentItem.findMany({
    where: {
      workspaceId: workspace.id,
      editorialStatus: "approved",
      productionStatus: { in: ["ready_to_shoot", "not_started"] },
    },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return <ShootingPageClient readyItems={readyItems} />;
}
