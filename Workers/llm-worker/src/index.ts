import { Worker } from "bullmq";
import express, { Request, Response } from "express";
import { redis } from "./config/redis.js";
import { connectDB } from "./config/db.js";
import { Message } from "./models/Message.js";
import { groq } from "./llm/groq.js";

import { simplePrompt } from "./prompt/simple.prompt.js";
import { interviewPrompt } from "./prompt/interview.prompt.js";
import { stepByStepPrompt } from "./prompt/stepBystep.prompt.js";
import { applyRagConstraint } from "./prompt/rag.guard.js";

function buildPrompt({
  content,
  studyMode,
  constraintMode,
  ragContext
}: {
  content: string;
  studyMode: "simple" | "interview" | "step-by-step";
  constraintMode: "allowed" | "strict";
  ragContext?: string | null; // ← NEW
}) {
  let messages;

  switch (studyMode) {
    case "simple":
      messages = simplePrompt(content);
      break;

    case "interview":
      messages = interviewPrompt(content);
      break;

    case "step-by-step":
      messages = stepByStepPrompt(content);
      break;

    default:
      throw new Error(`Unsupported study mode: ${studyMode}`);
  }

  // ✅ NEW: Inject RAG context BEFORE constraint mode
  if (ragContext) {
    messages.unshift({
      role: "system",
      content: ragContext
    });
  }

  return applyRagConstraint(messages, constraintMode);
}

async function startWorker() {
  await connectDB();
  console.log("✅ MongoDB connected to worker");
  
  // Health check server
  const app = express();
  const PORT = process.env.PORT || 3001;

  app.get("/", (_req: Request, res: Response) => {
    res.status(200).json({ 
      status: "ok", 
      service: "LLM Worker",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ 
      status: "healthy", 
      service: "LLM Worker"
    });
  });

  app.listen(PORT, () => {
    console.log(`✅ Health check server running on port ${PORT}`);
  });

  console.log("🚀 LLM Worker started and listening for jobs...");

  const worker = new Worker(
    "llm-jobs",
    async job => {
      console.log("=".repeat(50));
      console.log("🧠 Job received:", JSON.stringify(job.data, null, 2));

      const {
        userMessageId,
        assistantMessageId,
        studyMode,
        constraintMode,
        ragContext // ← NEW
      } = job.data;

      try {
        // 1️⃣ Fetch user message
        console.log(`📥 Fetching user message: ${userMessageId}`);
        const userMessage = await Message.findById(userMessageId);
        
        if (!userMessage) {
          throw new Error(`User message not found: ${userMessageId}`);
        }
        
        if (!userMessage.content) {
          throw new Error("User message content is empty");
        }

        console.log(`✅ User message found: "${userMessage.content.substring(0, 50)}..."`);

        // ✅ NEW: Log RAG context status
        if (ragContext) {
          console.log("📚 RAG context available, using document knowledge");
        } else {
          console.log("💭 No RAG context, using general knowledge");
        }

        // 2️⃣ Build prompt with RAG context
        console.log(`🔨 Building prompt with mode: ${studyMode}, constraint: ${constraintMode}`);
        const messages = buildPrompt({
          content: userMessage.content,
          studyMode,
          constraintMode,
          ragContext // ← NEW
        });

        // 3️⃣ Call GROQ
        console.log("🤖 Calling GROQ API...");
        const stream = await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: messages as any,
          temperature: 1,
          max_completion_tokens: 8192,
          top_p: 1,
          stream: true,
          reasoning_effort: "medium"
        });

        let fullResponse = "";
        let tokenCount = 0;

        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content;
          if (token) {
            fullResponse += token;
            tokenCount++;
            
            // Log progress every 50 tokens
            if (tokenCount % 50 === 0) {
              console.log(`📝 Generated ${tokenCount} tokens...`);
            }
          }
        }

        console.log(`✅ GROQ completed. Total tokens: ${tokenCount}`);
        console.log(`📄 Response preview: "${fullResponse.substring(0, 100)}..."`);

        // 4️⃣ Save to database
        console.log(`💾 Saving response to assistant message: ${assistantMessageId}`);
        
        const updatedMessage = await Message.findByIdAndUpdate(
          assistantMessageId,
          {
            content: fullResponse,
            status: "completed"
          },
          { new: true }
        );

        if (!updatedMessage) {
          throw new Error(`Failed to update assistant message: ${assistantMessageId}`);
        }

        console.log("✅ Response saved successfully!");
        console.log(`✅ Message status: ${updatedMessage.status}`);
        console.log("=".repeat(50));

      } catch (error: any) {
        console.error("❌ Error in job processing:");
        console.error(error);
        throw error;
      }
    },
    {
      connection: redis,
      concurrency: 1
    }
  );

  worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed successfully`);
  });

  worker.on("failed", async (job, err) => {
    console.error("=".repeat(50));
    console.error(`❌ Job ${job?.id} failed:`, err.message);
    console.error("Stack trace:", err.stack);
    console.error("=".repeat(50));

    if (job?.data?.assistantMessageId) {
      try {
        await Message.findByIdAndUpdate(job.data.assistantMessageId, {
          status: "failed",
          content: "AI failed to generate response. Please try again."
        });
        console.log(`💾 Updated message status to 'failed'`);
      } catch (updateError) {
        console.error("❌ Failed to update message status:", updateError);
      }
    }
  });

  worker.on("error", (err) => {
    console.error("❌ Worker error:", err);
  });
}

startWorker().catch(err => {
  console.error("❌ Failed to start worker:", err);
  process.exit(1);
});