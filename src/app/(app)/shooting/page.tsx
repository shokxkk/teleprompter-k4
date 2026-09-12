import { Metadata } from "next";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { ShootingPageClient } from "./ShootingPageClient";

export const metadata: Metadata = { title: "Телесуфлёр / Съёмка" };

export default async function ShootingPage() {
  let readyItems: any[] = [];
  try {
    const { workspace } = await requireAuth();
    if (workspace?.id) {
      readyItems = await prisma.contentItem.findMany({
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
    }
  } catch (err) {
    console.warn("Could not load items from database, fallback to client state:", err);
  }

  return <ShootingPageClient readyItems={readyItems} />;
}
