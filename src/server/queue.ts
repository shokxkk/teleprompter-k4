import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

let _connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (_connection) return _connection;

  _connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
  });

  return _connection;
}

export const QUEUE_NAME = "brand-office-jobs";

let _queue: Queue | null = null;

export function getJobQueue(): Queue {
  if (_queue) return _queue;
  _queue = new Queue(QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    },
  });
  return _queue;
}

export interface JobPayload {
  type:
    | "generate_reel"
    | "generate_week"
    | "generate_carousel"
    | "generate_stories"
    | "review_content"
    | "transcribe_audio"
    | "weekly_analysis";
  workspaceId: string;
  workflowRunId: string;
  input: Record<string, unknown>;
}

/**
 * Enqueue a workflow job (idempotent by idempotencyKey)
 */
export async function enqueueJob(
  payload: JobPayload,
  idempotencyKey?: string
): Promise<string> {
  const queue = getJobQueue();

  const jobId = idempotencyKey ?? `${payload.type}-${payload.workflowRunId}`;

  // Check if job already exists
  const existing = await queue.getJob(jobId);
  if (existing) {
    return existing.id ?? jobId;
  }

  const job = await queue.add(payload.type, payload, {
    jobId,
  });

  return job.id ?? jobId;
}

export type { Job };
