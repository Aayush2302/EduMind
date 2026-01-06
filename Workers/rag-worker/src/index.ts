// rag-worker/src/index.ts
import { Worker } from "bullmq";
import { redis } from "./config/redis.js";
import { connectDB } from "./config/db.js";
import { DocumentModel } from "./models/Document.js";
import { processDocumentRAG } from "./pipeline/rag.pipeline.js";

interface RagJobData {
  documentId: string;
  userId: string;
  chatId: string;
  storagePath: string;
  fileName: string;
}

async function startWorker() {
  await connectDB();
  console.log("✅ MongoDB connected to RAG worker");
  console.log("🚀 RAG Worker started and listening for jobs...");

  const worker = new Worker<RagJobData>(
    "rag-processing",
    async job => {
      console.log("=".repeat(50));
      console.log("📄 Job received:", JSON.stringify(job.data, null, 2));

      const { documentId, userId, chatId, storagePath, fileName } = job.data;

      try {
        // Update status to processing
        await DocumentModel.findByIdAndUpdate(documentId, {
          status: "processing"
        });

        console.log(`📥 Processing document: ${fileName}`);

        // Run RAG pipeline
        const result = await processDocumentRAG(
          documentId,
          userId,
          chatId,
          storagePath
        );

        if (!result.success) {
          throw new Error(result.error || "RAG processing failed");
        }

        // Update to processed
        await DocumentModel.findByIdAndUpdate(documentId, {
          status: "processed",
          pageCount: result.pageCount
        });

        console.log(`✅ Document processed:`, {
          pages: result.pageCount,
          chunks: result.totalChunks
        });
        console.log("=".repeat(50));

        return {
          success: true,
          pageCount: result.pageCount,
          totalChunks: result.totalChunks
        };
      } catch (error: any) {
        console.error("❌ Error in job processing:");
        console.error(error);
        throw error;
      }
    },
    {
      connection: redis,
      concurrency: 1 // Process one document at a time
    }
  );

  worker.on("completed", job => {
    console.log(`✅ Job ${job.id} completed successfully`);
  });

  worker.on("failed", async (job, err) => {
    console.error("=".repeat(50));
    console.error(`❌ Job ${job?.id} failed:`, err.message);
    console.error("=".repeat(50));

    if (job?.data?.documentId) {
      try {
        await DocumentModel.findByIdAndUpdate(job.data.documentId, {
          status: "failed"
        });
        console.log(`💾 Updated document status to 'failed'`);
      } catch (updateError) {
        console.error("❌ Failed to update status:", updateError);
      }
    }
  });

  worker.on("error", err => {
    console.error("❌ Worker error:", err);
  });

  // Keep the process alive
  process.on("SIGTERM", async () => {
    console.log("🛑 SIGTERM received, shutting down gracefully...");
    await worker.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("🛑 SIGINT received, shutting down gracefully...");
    await worker.close();
    process.exit(0);
  });
}

startWorker().catch(err => {
  console.error("❌ Failed to start worker:", err);
  process.exit(1);
});