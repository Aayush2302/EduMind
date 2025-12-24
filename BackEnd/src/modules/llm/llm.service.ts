import { llmQueue } from "./llm.queue.js";

export async function enqueueLLMJob(payload: {
    chatId: string;
    userMessageId: string;
    assistantMessageId: string;
    studyMode: string;
    constraintMode: string;
}) {
    await llmQueue.add("generate-response", payload, {
        attempts : 3,
        backoff : {
            type : "exponential",
            delay: 2000
        }
    })
}
