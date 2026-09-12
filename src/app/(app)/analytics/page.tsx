import { Metadata } from "next";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { AnalyticsPageClient } from "./AnalyticsPageClient";

export const metadata: Metadata = { title: "Аналитика и Обращения" };

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const workspace = await prisma.workspace.findUnique({
    where: { ownerId: session.user.id },
  });
  if (!workspace) return null;

  const snapshots = await prisma.metricSnapshot.findMany({
    where: { workspaceId: workspace.id },
    include: { contentItem: true },
    orderBy: { measuredAt: "desc" },
  });

  const inquiries = await prisma.inquiry.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
  });

  const weeklyReports = await prisma.weeklyReport.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
  });

  const contentItems = await prisma.contentItem.findMany({
    where: { workspaceId: workspace.id },
    select: { id: true, title: true, type: true },
  });

  return (
    <AnalyticsPageClient
      snapshots={snapshots}
      inquiries={inquiries}
      weeklyReports={weeklyReports}
      contentItems={contentItems}
    />
  );
}
