import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace } = await requireAuth();
    const { id } = await params;

    const job = await prisma.workflowRun.findFirst({
      where: { id, workspaceId: workspace.id },
      include: {
        agentRuns: {
          orderBy: { createdAt: "asc" },
          select: {
            agentRole: true,
            status: true,
            resultSource: true,
            inputTokens: true,
            outputTokens: true,
            createdAt: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get partial result if available
    let partialContent = null;
    if (job.resultId) {
      partialContent = await prisma.contentItem.findUnique({
        where: { id: job.resultId },
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
          },
        },
      });
    }

    return NextResponse.json({
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        errorMessage: job.errorMessage,
        totalLlmCalls: job.totalLlmCalls,
        resultId: job.resultId,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
      agentRuns: job.agentRuns,
      partialContent,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspace } = await requireAuth();
    const { id } = await params;

    const job = await prisma.workflowRun.findFirst({
      where: { id, workspaceId: workspace.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!["queued", "running", "waiting_for_user"].includes(job.status)) {
      return NextResponse.json(
        { error: "Can only cancel active jobs" },
        { status: 400 }
      );
    }

    await prisma.workflowRun.update({
      where: { id },
      data: { status: "cancelled", completedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
