import { Message } from "../../models/Message.js";
import { Chat } from "../../models/Chat.js";
import { SubjectFolder } from "../../models/Folder.js";
import { DocumentModel } from "../../models/Document.js";
import { AppError } from "../../utils/AppError.js";
import { enqueueLLMJob } from "../llm/llm.service.js";
import { retrieveRelevantChunks, formatContextForLLM } from "../../rag/retrieval.service.js";

/**
 * Fetch messages of a chat (ordered)
 */
export async function getMessages(
  userId: string,
  chatId: string
) {
  // Verify chat belongs to user via folder
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new AppError("Chat not found", 404);
  }

  const folder = await SubjectFolder.findOne({
    _id: chat.folderId,
    ownerId: userId,
    isDeleted: false
  });

  if (!folder) {
    throw new AppError("Access denied", 403);
  }

  return Message.find({ chatId })
    .sort({ createdAt: 1 });
}

/**
 * Add a user message
 */
export async function createUserMessage(
  userId: string,
  chatId: string,
  content: string
) {
  // Ownership check (same as above)
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new AppError("Chat not found", 404);
  }

  const folder = await SubjectFolder.findOne({
    _id: chat.folderId,
    ownerId: userId,
    isDeleted: false
  });

  if (!folder) {
    throw new AppError("Access denied", 403);
  }

  return Message.create({
    chatId,
    sender: "user",
    content,
    status: "completed"
  });
}

export async function createUserMessageAndEnqueue(
  userId: string,
  chatId: string,
  content: string
) {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new AppError("Chat not found", 404);
  }

  const folder = await SubjectFolder.findOne({
    _id: chat.folderId,
    ownerId: userId,
    isDeleted: false
  });

  if (!folder) {
    throw new AppError("Folder not found", 404);
  }

  // ✅ NEW: Check if chat has processed documents
  const hasDocuments = await DocumentModel.exists({
    chatId,
    status: "processed"
  });

  let ragContext: string | null = null;

  if (hasDocuments) {
    console.log("📚 [Message] Chat has documents, retrieving context...");
    
    try {
      // Retrieve relevant chunks
      const chunks = await retrieveRelevantChunks(chatId, content, 5);
      
      if (chunks.length > 0) {
        ragContext = formatContextForLLM(chunks);
        console.log(`✅ [Message] Retrieved ${chunks.length} relevant chunks`);
      }
    } catch (error) {
      console.error("❌ [Message] RAG retrieval failed:", error);
      // Continue without RAG context on error
    }
  }

  const userMessage = await Message.create({
    chatId,
    sender: "user",
    content,
    status: "completed"
  });

  const assistantMessage = await Message.create({
    chatId,
    sender: "assistant",
    content: "",
    status: "processing",
    parentMessageId: userMessage._id
  });

  // ✅ Pass RAG context to LLM worker
  await enqueueLLMJob({
    chatId,
    userMessageId: userMessage._id.toString(),
    assistantMessageId: assistantMessage._id.toString(),
    studyMode: chat.studyMode,
    constraintMode: chat.constraintMode,
    ragContext // ← NEW: Pass context to worker
  });

  return { userMessage, assistantMessage };
}