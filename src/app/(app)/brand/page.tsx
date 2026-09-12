import { Metadata } from "next";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { BrandPageClient } from "./BrandPageClient";

export const metadata: Metadata = { title: "Мой бренд" };

export default async function BrandPage() {
  const session = await auth();
  const workspace = await prisma.workspace.findUnique({
    where: { ownerId: session!.user!.id! },
    include: { settings: true },
  });
  if (!workspace) return null;

  const brandProfile = await prisma.brandProfile.findFirst({
    where: { workspaceId: workspace.id, isCurrent: true },
    include: {
      versions: {
        where: { status: "active" },
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: {
          positionings: { orderBy: { createdAt: "desc" }, take: 3 },
        },
      },
    },
  });

  const services = await prisma.service.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "asc" },
  });

  const interview = await prisma.interviewQuestion.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { orderIndex: "asc" },
    take: 20,
  });

  const activeVersion = brandProfile?.versions[0];

  return (
    <BrandPageClient
      brandVersion={activeVersion ? {
        ...activeVersion,
        positionings: activeVersion.positionings.map((pos) => ({
          id: pos.id,
          textUz: pos.textUz,
          explanationRu: pos.explanationRu,
          isSelected: pos.status === "selected",
        })),
      } : null}
      services={services}
      interview={interview}
      isDemoMode={workspace.settings?.demoMode ?? !process.env.OPENAI_API_KEY}
    />
  );
}
