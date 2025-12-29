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

/**
 * Build prompt based on study mode + constraint mode
 */
function buildPrompt({
  content,
  studyMode,
  constraintMode
}: {
  content: string;
  studyMode: "simple" | "interview" | "step-by-step";
  constraintMode: "allowed" | "strict";
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

  return applyRagConstraint(messages, constraintMode);
}

async function startWorker() {
  await connectDB();
  
  // ✅ Create health check server for Render.com
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

  console.log("🚀 LLM Worker started");

  const worker = new Worker(
    "llm-jobs",
    async job => {
      const {
        userMessageId,
        assistantMessageId,
        studyMode,
        constraintMode
      } = job.data;

      console.log("🧠 Job received:", job.data);

      // 1️⃣ Fetch user message (ONLY for content)
      const userMessage = await Message.findById(userMessageId);
      if (!userMessage || !userMessage.content) {
        throw new Error("Invalid or empty user message");
      }

      // 2️⃣ Build prompt using JOB DATA (not Message)
      const messages = buildPrompt({
        content: userMessage.content,
        studyMode,
        constraintMode
      });

      // 3️⃣ Call GROQ with streaming
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

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content;
        if (token) {
          fullResponse += token;
        }
      }

      // 4️⃣ Save final AI response
      await Message.findByIdAndUpdate(assistantMessageId, {
        content: fullResponse,
        status: "completed"
      });

      console.log("✅ AI response saved");
    },
    {
      connection: redis
    }
  );

  worker.on("failed", async (job, err) => {
    console.error("❌ Job failed:", err.message);

    if (job?.data?.assistantMessageId) {
      await Message.findByIdAndUpdate(job.data.assistantMessageId, {
        status: "failed",
        content: "AI failed to generate response"
      });
    }
  });
}

startWorker();