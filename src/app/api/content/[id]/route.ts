import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import { ReelDraftSchema, CarouselDraftSchema, StoryDraftSchema } from "@/ai/schemas";
import { z } from "zod";

const PAYLOAD_SCHEMAS = {
  reel: ReelDraftSchema,
  carousel: CarouselDraftSchema,
  story: StoryDraftSchema,
};

// GET /api/content/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace } = await requireAuth();
    const { id } = await params;

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
        publications: { orderBy: { publishedAt: "desc" } },
        metrics: { orderBy: { measuredAt: "desc" } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/content/[id] — create new version (manual edit)
const patchSchema = z.object({
  payload: z.record(z.string(), z.unknown()),
  lockedSections: z.array(z.string()).optional(),
  expectedVersion: z.number().int().optional(),
  changeNote: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace } = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const item = await prisma.contentItem.findFirst({
      where: { id, workspaceId: workspace.id },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const currentVersion = item.versions[0];

    // Optimistic concurrency check
    if (
      parsed.data.expectedVersion !== undefined &&
      currentVersion?.versionNumber !== parsed.data.expectedVersion
    ) {
      return NextResponse.json(
        {
          error: "Version conflict",
          currentVersion: currentVersion?.versionNumber,
          code: "VERSION_CONFLICT",
        },
        { status: 409 }
      );
    }

    // Validate payload schema
    const schemaKey = item.type as keyof typeof PAYLOAD_SCHEMAS;
    if (PAYLOAD_SCHEMAS[schemaKey]) {
      const validation = PAYLOAD_SCHEMAS[schemaKey].safeParse(parsed.data.payload);
      if (!validation.success) {
        return NextResponse.json(
          { error: `Invalid ${item.type} payload: ${validation.error.issues[0]?.message}` },
          { status: 400 }
        );
      }
    }

    const newVersionNumber = (currentVersion?.versionNumber ?? 0) + 1;

    // Create new version
    const newVersion = await prisma.contentVersion.create({
      data: {
        contentItemId: item.id,
        versionNumber: newVersionNumber,
        payload: parsed.data.payload as Prisma.InputJsonValue,
        lockedSections: (parsed.data.lockedSections ?? currentVersion?.lockedSections ?? []) as Prisma.InputJsonValue,
        createdBy: "user",
        changeNote: parsed.data.changeNote ?? "Ручная правка",
      },
    });

    // Update editorial status — manual edit resets approval
    await prisma.contentItem.update({
      where: { id },
      data: {
        editorialStatus: "draft",
        updatedAt: new Date(),
      },
    });

    await prisma.auditEvent.create({
      data: {
        action: "content_version_created",
        entityType: "ContentVersion",
        entityId: newVersion.id,
        after: { versionNumber: newVersionNumber, source: "user_edit" },
      },
    });

    return NextResponse.json({ version: newVersion });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
