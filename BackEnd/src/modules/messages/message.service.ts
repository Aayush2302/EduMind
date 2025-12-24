import { Message } from "../../models/Message.js";
import { Chat } from "../../models/Chat.js";
import { SubjectFolder } from "../../models/Folder.js";
import { AppError } from "../../utils/AppError.js";
import { enqueueLLMJob } from "../llm/llm.service.js";
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
  userId : string,
  chatId : string,
  content : string
) {
  const chat = await Chat.findById(chatId);

  if(!chat) {
    throw new AppError("Chat not found", 404);
  }

  const folder = await SubjectFolder.findOne({
    _id : chat.folderId,
    ownerId : userId,
    isDeleted : false
  });

  if(!folder) {
    throw new AppError("Folder not found", 404);
  }

  const userMessage = await Message.create({
    chatId,
    sender : "user",
    content,
    status : "completed"
  });

  const assistantMessage = await Message.create({
    chatId,
    sender: "assistant",
    content: "",
    status : "processing",
    parentMessageId : userMessage._id  //linking assistant message to user message
  });

  await enqueueLLMJob({
    chatId,
    userMessageId : userMessage._id.toString(),
    assistantMessageId : assistantMessage._id.toString(),
    studyMode : chat.studyMode,
    constraintMode: chat.constraintMode
  });

  return { userMessage, assistantMessage };
}
