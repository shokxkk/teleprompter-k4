import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { getLLMProvider } from "@/providers/llm";
import { runProducer } from "@/ai/agents/producer";
import { enqueueJob } from "@/server/queue";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const { workspace, userId } = await requireAuth();
    const body = await req.json();

    const { message, conversationId } = body as {
      message: string;
      conversationId?: string;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Get or create conversation
    let conversation = conversationId
      ? await prisma.conversation.findFirst({
          where: { id: conversationId, workspaceId: workspace.id },
        })
      : null;

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          workspaceId: workspace.id,
          type: "producer",
          lang: workspace.uiLang ?? "ru",
        },
      });
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    // Get recent history
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 12,
    });

    // Get brand profile
    const brandVersion = await prisma.brandVersion.findFirst({
      where: {
        brandProfile: { workspaceId: workspace.id },
        status: "active",
      },
      orderBy: { createdAt: "desc" },
    });

    // Get active workflow runs for context
    const activeRuns = await prisma.workflowRun.findMany({
      where: {
        workspaceId: workspace.id,
        status: { in: ["queued", "running", "waiting_for_user"] },
      },
      select: { type: true, status: true },
    });

    const isDemoMode =
      !process.env.OPENAI_API_KEY ||
      process.env.FORCE_DEMO_MODE === "true" ||
      workspace.settings?.demoMode;

    const provider = getLLMProvider({ forceDemo: isDemoMode });

    // Run producer
    const producerOutput = await runProducer(
      {
        userMessage: message,
        brandProfile: {
          publicName: brandVersion?.publicName,
          role: brandVersion?.role,
          startYear: brandVersion?.startYear ?? 2020,
          primaryAudience: brandVersion?.primaryAudience,
          goals: brandVersion?.goals3to6months,
          contentLang: brandVersion?.contentLang ?? "uz-Latn",
          limitations: brandVersion?.limitations,
        },
        currentTasks: activeRuns.map((r) => `${r.type} (${r.status})`),
        conversationHistory: history.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        interfaceLang: workspace.uiLang ?? "ru",
      },
      provider
    );

    // Handle task routing
    let workflowRunId: string | null = null;

    if (
      producerOutput.routeTo === "scriptwriter" &&
      producerOutput.taskType === "generate_reel"
    ) {
      const idempotencyKey = nanoid();

      const workflowRun = await prisma.workflowRun.create({
        data: {
          workspaceId: workspace.id,
          conversationId: conversation.id,
          type: "generate_reel",
          status: "queued",
          idempotencyKey,
          input: {
            brief: message,
            audience: "owner",
            goal: "trust",
            targetDurationSeconds: 45,
          },
        },
      });

      workflowRunId = workflowRun.id;

      await enqueueJob(
        {
          type: "generate_reel",
          workspaceId: workspace.id,
          workflowRunId: workflowRun.id,
          input: {
            brief: message,
            audience: "owner",
            goal: "trust",
            targetDurationSeconds: 45,
          },
        },
        idempotencyKey
      );
    }

    // Save assistant response
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: producerOutput.response,
        workflowRunId,
      },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      message: assistantMessage,
      producerOutput,
      workflowRunId,
      isDemoMode,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/producer/messages error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { workspace } = await requireAuth();
    const url = new URL(req.url);
    const conversationId = url.searchParams.get("conversationId");

    const where = conversationId
      ? { id: conversationId, workspaceId: workspace.id }
      : { workspaceId: workspace.id, type: "producer" };

    const conversation = await prisma.conversation.findFirst({
      where,
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ conversation });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
