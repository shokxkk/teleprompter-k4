import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { nanoid } from "nanoid";
import { z } from "zod";

const approveSchema = z.object({
  contentVersionId: z.string(),
  brandVersionId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace, userId } = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const { contentVersionId, brandVersionId, idempotencyKey } = parsed.data;
    const ikey = idempotencyKey ?? nanoid();

    // Idempotency: check if already approved
    const existingApproval = await prisma.contentApproval.findUnique({
      where: { idempotencyKey: ikey },
    });

    if (existingApproval) {
      return NextResponse.json({ approval: existingApproval });
    }

    // Verify content belongs to workspace
    const item = await prisma.contentItem.findFirst({
      where: { id, workspaceId: workspace.id },
    });

    if (!item) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Verify version exists
    const version = await prisma.contentVersion.findFirst({
      where: { id: contentVersionId, contentItemId: id },
    });

    if (!version) {
      return NextResponse.json(
        { error: "Content version not found" },
        { status: 404 }
      );
    }

    // Check there are no active reviews with blockers
    const activeReview = await prisma.review.findFirst({
      where: {
        contentVersionId,
        status: "done",
      },
      include: {
        issues: {
          where: { severity: "blocker", resolution: null },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (activeReview && activeReview.issues.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot approve: unresolved blocker issues",
          blockers: activeReview.issues.map((i) => ({
            field: i.field,
            reason: i.reason,
          })),
        },
        { status: 422 }
      );
    }

    // Create approval
    const approval = await prisma.contentApproval.create({
      data: {
        contentVersionId,
        brandVersionId,
        approvedBy: userId,
        idempotencyKey: ikey,
      },
    });

    // Update editorial status
    await prisma.contentItem.update({
      where: { id },
      data: {
        editorialStatus: "approved",
        productionStatus: "ready_to_shoot",
        updatedAt: new Date(),
      },
    });

    await prisma.auditEvent.create({
      data: {
        action: "content_approved",
        entityType: "ContentApproval",
        entityId: approval.id,
        after: { contentVersionId, approvedBy: userId },
      },
    });

    return NextResponse.json({ approval });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Approve error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
