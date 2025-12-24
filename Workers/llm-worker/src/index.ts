import { Worker } from "bullmq";
import { redis } from "./config/redis.js";
import { connectDB } from "./config/db.js";
import { Message } from "./models/Message.js";
import { log } from "node:console";
import { loadavg } from "node:os";
import { start } from "node:repl";

async function startWorker(){
    await connectDB();

    const worker = new Worker(
  "llm-jobs",
  async job => {
    console.log("🧠 Job received:", job.data);

    const { assistantMessageId } = job.data;

    await new Promise(res => setTimeout(res, 2000));

    await Message.findByIdAndUpdate(assistantMessageId, {
      content: "This is a dummy AI response",
      status: "completed"
    });

    console.log("✅ Job completed");
  },
  { connection: redis }
);

    worker.on("failed", (job,err) => {
        console.log("Job Failed", job?.id, err);
    });

    console.log("LLM Worker Started");
    
}

startWorker();