import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export async function GET() {
  try {
    const { workspace } = await requireAuth();

    const brandProfile = await prisma.brandProfile.findFirst({
      where: { workspaceId: workspace.id, isCurrent: true },
      include: {
        versions: {
          where: { status: "active" },
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: {
            positionings: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    const isDemoMode =
      !process.env.OPENAI_API_KEY ||
      process.env.FORCE_DEMO_MODE === "true" ||
      workspace.settings?.demoMode;

    return NextResponse.json({
      brandProfile,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        timezone: workspace.timezone,
        uiLang: workspace.uiLang,
        settings: workspace.settings,
      },
      isDemoMode,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/brand error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const brandUpdateSchema = z.object({
  publicName: z.string().optional(),
  publicNameUz: z.string().optional(),
  role: z.string().optional(),
  geography: z.string().optional(),
  bio: z.string().optional(),
  bioUz: z.string().optional(),
  primaryAudience: z.string().optional(),
  secondaryAudience: z.string().optional(),
  audienceProblems: z.array(z.string()).optional(),
  brandVoice: z.string().optional(),
  goals3to6months: z.string().optional(),
  followerTarget: z.number().int().optional(),
  contentLang: z.enum(["uz-Latn", "ru"]).optional(),
  limitations: z.array(z.string()).optional(),
  notes: z.string().optional(),
  changeNote: z.string().optional(),
});

export async function PATCH(req: Request) {
  try {
    const { workspace } = await requireAuth();
    const body = await req.json();
    const parsed = brandUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const brandProfile = await prisma.brandProfile.findFirst({
      where: { workspaceId: workspace.id, isCurrent: true },
      include: {
        versions: {
          where: { status: "active" },
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }

    const currentVersion = brandProfile.versions[0];
    const nextVersionNumber = (currentVersion?.versionNumber ?? 0) + 1;

    // Archive current version
    if (currentVersion) {
      await prisma.brandVersion.update({
        where: { id: currentVersion.id },
        data: { status: "archived" },
      });
    }

    // Create new version with merged data
    const { changeNote, audienceProblems, limitations, ...updateData } = parsed.data;
    const newVersion = await prisma.brandVersion.create({
      data: {
        brandProfileId: brandProfile.id,
        versionNumber: nextVersionNumber,
        status: "active",
        // Carry forward existing data
        ...(currentVersion
          ? {
              publicName: currentVersion.publicName,
              publicNameUz: currentVersion.publicNameUz,
              role: currentVersion.role,
              geography: currentVersion.geography,
              bio: currentVersion.bio,
              bioUz: currentVersion.bioUz,
              startYear: currentVersion.startYear,
              primaryAudience: currentVersion.primaryAudience,
              secondaryAudience: currentVersion.secondaryAudience,
              audienceProblems: currentVersion.audienceProblems ?? Prisma.JsonNull,
              brandVoice: currentVersion.brandVoice,
              goals3to6months: currentVersion.goals3to6months,
              followerTarget: currentVersion.followerTarget,
              contentLang: currentVersion.contentLang,
              limitations: currentVersion.limitations ?? Prisma.JsonNull,
              notes: currentVersion.notes,
            }
          : {}),
        // Apply updates
        ...updateData,
        notes: changeNote
          ? `${updateData.notes ?? currentVersion?.notes ?? ""}\n[${new Date().toISOString()}] ${changeNote}`
          : updateData.notes ?? currentVersion?.notes ?? null,
        ...(audienceProblems ? { audienceProblems: audienceProblems as unknown as Prisma.InputJsonValue } : {}),
        ...(limitations ? { limitations: limitations as unknown as Prisma.InputJsonValue } : {}),
      },
    });

    await prisma.auditEvent.create({
      data: {
        action: "brand_version_created",
        entityType: "BrandVersion",
        entityId: newVersion.id,
        after: updateData,
      },
    });

    return NextResponse.json({ brandVersion: newVersion });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/brand error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
