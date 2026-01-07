import { Request, Response } from "express";
import { createChatSchema } from "./chat.schema.js";
import mongoose from "mongoose";

import {
  createChat,
  getChats,
  archiveChat,
  getAllchatsForUser,
} from "./chat.service.js";
import { AppError } from "../../utils/AppError.js";
import { settings } from "node:cluster";
// import { success } from "zod";

/**
 * Create a new chat inside a folder
 */
export async function createChatHandler(req: Request, res: Response) {
  const userId = req.userContext!.userId;
  const folderId = req.params.folderId;

  console.log("[CREATE CHAT] Request received", {
    userId,
    folderId,
    body: req.body,
  });

  // Validate folder id presence
  if (!folderId) {
    throw new AppError("Folder id is required", 400);
  }

  // Validate MongoDB ObjectIds
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(folderId)
  ) {
    throw new AppError("Invalid user id or folder id", 400);
  }

  // Validate request body using Zod schema
  const { title, studyMode, constraintMode } = createChatSchema.parse(req.body);

  console.log("[CREATE CHAT] Creating chat with data", {
    title,
    studyMode,
    constraintMode,
  });

  const chat = await createChat(userId, folderId, title, studyMode, constraintMode);

  console.log("[CREATE CHAT] Chat created successfully", {
    chatId: chat._id,
  });

  res.status(201).json({
    success: true,
    message: "Chat created successfully",
    chat,
  });
}

/**
 * Get all active chats for a folder
 */
export async function getChatsHandler(req: Request, res: Response) {
  const userId = req.userContext!.userId;
  const folderId = req.params.folderId;

  console.log("[GET CHATS] Request received", {
    userId,
    folderId,
  });

  if (!folderId) {
    throw new AppError("Folder id is required", 400);
  }

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(folderId)
  ) {
    throw new AppError("Invalid user id or folder id", 400);
  }

  const chats = await getChats(userId, folderId);

  console.log("[GET CHATS] Chats retrieved", {
    count: chats.length,
  });

  res.json({
    success: true,
    message: "Chats retrieved successfully",
    chats,
  });
}

/**
 * Archive (soft delete) a chat
 */
export async function archiveChatHandler(req: Request, res: Response) {
  const userId = req.userContext!.userId;
  const chatId = req.params.chatId;

  console.log("[ARCHIVE CHAT] Request received", {
    userId,
    chatId,
  });

  if (!chatId) {
    throw new AppError("Chat id is required", 400);
  }

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(chatId)
  ) {
    throw new AppError("Invalid user id or chat id", 400);
  }

  const chat = await archiveChat(userId, chatId);

  console.log("[ARCHIVE CHAT] Chat archived successfully", {
    chatId: chat._id,
  });

  res.json({
    success: true,
    message: "Chat archived successfully",
    chat,
  });
}

export async function getAllChatsHandler(req: Request, res: Response) {
  {
    const userId = req.userContext!.userId;

    const chats = await getAllchatsForUser(userId);

    res.json({
      success: true,
      chats,
    });
  }
}
