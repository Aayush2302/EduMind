import { Request, Response } from "express";
import mongoose from "mongoose";
import { createMessageSchema } from "./message.schema.js";
import {
  getMessages,
  createUserMessage
} from "./message.service.js";
import { AppError } from "../../utils/AppError.js";

export async function getMessagesHandler(req: Request, res: Response) {
  const userId = req.userContext!.userId;
  const chatId = req.params.chatId;

  if (!chatId) {
    throw new AppError("Chat id is required", 400);
  }

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(chatId)
  ) {
    throw new AppError("Invalid id", 400);
  }

  const messages = await getMessages(userId, chatId);

  res.json({
    success: true,
    messages
  });
}

export async function createMessageHandler(req: Request, res: Response) {
  const userId = req.userContext!.userId;
  const chatId = req.params.chatId;

  if (!chatId) {
    throw new AppError("Chat id is required", 400);
  }

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(chatId)
  ) {
    throw new AppError("Invalid id", 400);
  }

  const { content } = createMessageSchema.parse(req.body);

  const message = await createUserMessage(
    userId,
    chatId,
    content
  );

  res.status(201).json({
    success: true,
    message
  });
}
