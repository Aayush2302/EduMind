import { Worker } from "bullmq";
import { redis } from "./config/redis.js";
import { connectDB } from "./config/db.js";
import { Message } from "./models/Message.js";
import { groq } from "./llm/groq.js";
import { buildPrompt } from "./prompt/basic.prompt.js";

async function startWorker() {
  await connectDB();
  console.log("🚀 LLM Worker started");

  const worker = new Worker(
    "llm-jobs",
    async job => {
      const {
        userMessageId,
        assistantMessageId
      } = job.data;

      console.log("🧠 Job received:", job.data);

      // 1️⃣ Fetch user message
      const userMessage = await Message.findById(userMessageId);
      if (!userMessage) {
        throw new Error("User message not found");
      }

      // 2️⃣ Build prompt
      if (!userMessage.content) {
        throw new Error("User message content is empty");
      }
      const messages = buildPrompt(userMessage.content);

      // 3️⃣ Call GROQ with streaming
      const stream = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages : messages as any,
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
    console.error("❌ Job failed", err.message);

    if (job?.data?.assistantMessageId) {
      await Message.findByIdAndUpdate(job.data.assistantMessageId, {
        status: "failed",
        content: "AI failed to generate response"
      });
    }
  });
}

startWorker();
