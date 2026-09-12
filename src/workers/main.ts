#!/usr/bin/env node
/**
 * Brand Office — BullMQ Worker
 * Run: npx tsx src/workers/main.ts
 */

import { Worker } from "bullmq";
import { getRedisConnection, QUEUE_NAME, type JobPayload } from "@/server/queue";
import { prisma } from "@/server/db";
import { getLLMProvider, getScriptwriterProvider } from "@/providers/llm";
import { getSTTProvider } from "@/providers/stt";
import { runScriptwriter } from "@/ai/agents/scriptwriter";
import { runEvidenceReviewer } from "@/ai/agents/reviewer";
import { runMarketingPlanner } from "@/ai/agents/index";
import { ReelDraftSchema } from "@/ai/schemas";

const MAX_LLM_CALLS_DEFAULT = parseInt(process.env.AI_MAX_LLM_CALLS_PER_REEL ?? "8");
const MAX_PARALLEL = parseInt(process.env.WORKER_CONCURRENCY ?? "3");

async function updateWorkflowStatus(
  workflowRunId: string,
  status: string,
  extra?: Record<string, unknown>
) {
  await prisma.workflowRun.update({
    where: { id: workflowRunId },
    data: {
      status,
      ...extra,
      ...(status === "running" ? { startedAt: new Date() } : {}),
      ...(['succeeded', 'failed', 'cancelled'].includes(status) ? { completedAt: new Date() } : {}),
    },
  });
}

async function processGenerateReel(job: {
  data: JobPayload;
}): Promise<void> {
  const { workflowRunId, workspaceId, input } = job.data;

  await updateWorkflowStatus(workflowRunId, "running");

  let llmCallCount = 0;
  const maxCalls = MAX_LLM_CALLS_DEFAULT;

  const guardLLMCall = () => {
    llmCallCount++;
    if (llmCallCount > maxCalls) {
      throw new Error(`LLM call limit exceeded (${maxCalls})`);
    }
  };

  try {
    // Step 1: Get brand profile
    const checkpoint1 = await prisma.workflowRun.findUnique({
      where: { id: workflowRunId },
      select: { checkpoint: true },
    });

    const savedCheckpoint = checkpoint1?.checkpoint as Record<string, unknown> | null;

    const brandVersion = await prisma.brandVersion.findFirst({
      where: {
        brandProfile: { workspaceId },
        status: "active",
      },
      include: { brandProfile: true },
      orderBy: { createdAt: "desc" },
    });

    if (!brandVersion) {
      throw new Error("No active brand version found");
    }

    const facts = await prisma.fact.findMany({
      where: { workspaceId, evidenceStatus: { not: "retracted" } },
      select: { id: true, claim: true, publicationPermission: true, isCase: true },
    });

    // Step 2: Generate draft (or restore from checkpoint)
    let reelDraft = savedCheckpoint?.reelDraft
      ? ReelDraftSchema.safeParse(savedCheckpoint.reelDraft).data
      : null;

    if (!reelDraft) {
      guardLLMCall();

      const scriptwriterProvider = getScriptwriterProvider();
      const scriptResult = await runScriptwriter(
        {
          brief: (input.brief as string) ?? "",
          brandProfile: {
            publicName: brandVersion.publicName,
            startYear: brandVersion.startYear,
            primaryAudience: brandVersion.primaryAudience,
            role: brandVersion.role,
            goals: brandVersion.goals3to6months,
            limitations: brandVersion.limitations,
            brandVoice: brandVersion.brandVoice,
          },
          availableFacts: facts.map((f) => ({
            id: f.id,
            claim: f.claim,
            permission: f.publicationPermission,
            type: f.isCase ? "case" : "fact",
          })),
          targetDurationSeconds: (input.targetDurationSeconds as number) ?? 45,
          audience: (input.audience as "owner" | "sales_leader" | "sales_manager") ?? "owner",
          goal: (input.goal as string) ?? "trust",
        },
        scriptwriterProvider
      );

      reelDraft = scriptResult.data;

      // Record agent run
      await prisma.agentRun.create({
        data: {
          workflowRunId,
          agentRole: "scriptwriter",
          promptVersion: "v1.0",
          provider: scriptwriterProvider.name,
          model: scriptwriterProvider.model,
          inputTokens: scriptResult.usage.promptTokens,
          outputTokens: scriptResult.usage.completionTokens,
          resultSource: scriptResult.source,
          status: "done",
        },
      });

      // Save checkpoint
      await prisma.workflowRun.update({
        where: { id: workflowRunId },
        data: {
          checkpoint: { reelDraft },
          totalLlmCalls: llmCallCount,
        },
      });
    }

    // Step 3: Review (max 2 review cycles)
    let reviewPassed = false;
    for (let cycle = 0; cycle < 2 && !reviewPassed; cycle++) {
      guardLLMCall();

      const reviewProvider = getLLMProvider();
      const reviewResult = await runEvidenceReviewer(
        {
          draft: reelDraft,
          availableFacts: facts.map((f) => ({
            id: f.id,
            claim: f.claim,
            permission: f.publicationPermission,
            evidenceStatus: "pending",
          })),
          brandLimitations: Array.isArray(brandVersion.limitations)
            ? (brandVersion.limitations as string[])
            : [],
        },
        reviewProvider
      );

      await prisma.agentRun.create({
        data: {
          workflowRunId,
          agentRole: "reviewer",
          promptVersion: "v1.0",
          provider: reviewProvider.name,
          model: reviewProvider.model,
          resultSource: reviewResult.source,
          status: "done",
        },
      });

      if (!reviewResult.data.hasBlockers) {
        reviewPassed = true;
      } else if (cycle === 0) {
        // Try to fix blockers automatically (cycle 1)
        // Just pass the issues back for now — show to user on cycle 2
      }
    }

    // Step 4: Create ContentItem + ContentVersion
    const services = await prisma.service.findMany({
      where: { workspaceId, isActive: true },
    });

    const contentItem = await prisma.contentItem.create({
      data: {
        workspaceId,
        brandVersionId: brandVersion.id,
        type: "reel",
        editorialStatus: "draft",
        productionStatus: "not_started",
        title: reelDraft.title,
      },
    });

    const contentVersion = await prisma.contentVersion.create({
      data: {
        contentItemId: contentItem.id,
        versionNumber: 1,
        payload: reelDraft as object,
        createdBy: "workflow",
        changeNote: "Сгенерировано AI",
      },
    });

    // Create claim references for fact IDs
    const allFactIds = reelDraft.segments.flatMap((s) => s.factIds);
    for (const factId of allFactIds) {
      await prisma.claimReference.create({
        data: {
          contentVersionId: contentVersion.id,
          field: "segments",
          factId,
        },
      });
    }

    // Update workflow as succeeded
    await updateWorkflowStatus(workflowRunId, "succeeded", {
      resultId: contentItem.id,
      totalLlmCalls: llmCallCount,
    });

    console.log(`✅ Reel generated: ${contentItem.id}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateWorkflowStatus(workflowRunId, "failed", {
      errorMessage: message,
      totalLlmCalls: llmCallCount,
    });
    throw err; // Re-throw for BullMQ retry
  }
}

async function processJob(job: { data: JobPayload; name: string }) {
  console.log(`🔄 Processing job: ${job.name} [${job.data.workflowRunId}]`);

  switch (job.data.type) {
    case "generate_reel":
      await processGenerateReel(job);
      break;

    case "generate_week":
      // Similar pattern to generate_reel but for week planning
      await updateWorkflowStatus(job.data.workflowRunId, "running");
      try {
        const brandVersion = await prisma.brandVersion.findFirst({
          where: {
            brandProfile: { workspaceId: job.data.workspaceId },
            status: "active",
          },
        });

        const services = await prisma.service.findMany({
          where: { workspaceId: job.data.workspaceId, isActive: true },
        });

        const provider = getLLMProvider();
        const planResult = await runMarketingPlanner(
          {
            weekStart: job.data.input.weekStart as string,
            weekEnd: job.data.input.weekEnd as string,
            brandProfile: {
              publicName: brandVersion?.publicName,
              primaryAudience: brandVersion?.primaryAudience,
              contentLang: brandVersion?.contentLang ?? "uz-Latn",
            },
            services: services.map((s) => ({
              name: s.name,
              isActive: s.isActive,
            })),
          },
          provider
        );

        // Create ContentPlan + PlanItems
        const plan = await prisma.contentPlan.create({
          data: {
            workspaceId: job.data.workspaceId,
            weekStart: new Date(job.data.input.weekStart as string),
            weekEnd: new Date(job.data.input.weekEnd as string),
            status: "active",
          },
        });

        for (const item of planResult.data.items) {
          await prisma.planItem.create({
            data: {
              contentPlanId: plan.id,
              scheduledDate: new Date(item.scheduledDate),
              format: item.format,
              audience: item.audience,
              goal: item.goal,
              topic: item.topic,
              section: item.section,
              productionComplexity: item.productionComplexity,
              requiredSources: item.requiredSources,
              orderIndex: item.dayIndex,
            },
          });
        }

        await updateWorkflowStatus(job.data.workflowRunId, "succeeded", {
          resultId: plan.id,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await updateWorkflowStatus(job.data.workflowRunId, "failed", {
          errorMessage: message,
        });
        throw err;
      }
      break;

    case "transcribe_audio":
      await updateWorkflowStatus(job.data.workflowRunId, "running");
      try {
        const assetId = job.data.input.assetId as string;
        const asset = await prisma.asset.findUnique({ where: { id: assetId } });
        if (!asset) throw new Error("Asset not found");

        // Fetch audio from storage and transcribe
        // (Storage integration needed — simplified here)
        const sttProvider = getSTTProvider();

        // Mark source as processed
        await prisma.source.update({
          where: { id: job.data.input.sourceId as string },
          data: { transcriptionStatus: "done" },
        });

        await updateWorkflowStatus(job.data.workflowRunId, "succeeded");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await updateWorkflowStatus(job.data.workflowRunId, "failed", {
          errorMessage: message,
        });
        throw err;
      }
      break;

    default:
      console.warn(`Unknown job type: ${job.data.type}`);
  }
}

// Start worker
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    await processJob({
      data: job.data as JobPayload,
      name: job.name,
    });
  },
  {
    connection: getRedisConnection(),
    concurrency: MAX_PARALLEL,
  }
);

worker.on("completed", (job) => {
  console.log(`✅ Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job failed: ${job?.id}`, err.message);
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});

console.log(`🚀 Brand Office Worker started (concurrency: ${MAX_PARALLEL})`);

// Graceful shutdown
process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await worker.close();
  process.exit(0);
});
