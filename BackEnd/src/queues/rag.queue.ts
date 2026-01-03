// backend/src/queues/rag.queue.ts
import { Queue } from "bullmq";
import { Redis } from "ioredis";

export interface RagJobData {
  documentId: string;
  userId: string;
  chatId: string;
  storagePath: string;
  fileName: string;
}

let ragQueue: Queue<RagJobData> | null = null;

export function getRagQueue(): Queue<RagJobData> {
  if (!ragQueue) {
    // Check if Redis URL is configured
    if (!process.env.REDIS_URL) {
      console.warn("⚠️ UPSTASH_REDIS_URL not set. RAG queue disabled.");
      throw new Error("RAG queue not configured");
    }

    // Only connect when first used
    const redis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 10000,
      tls: {
        rejectUnauthorized: false
      }
    });

    ragQueue = new Queue<RagJobData>("rag-processing", {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000
        },
        removeOnComplete: {
          count: 100,
          age: 24 * 3600
        },
        removeOnFail: {
          count: 500
        }
      }
    });

    console.log("✅ RAG Queue initialized (backend)");
  }

  return ragQueue;
}