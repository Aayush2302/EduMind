import { Request, Response } from "express";
import { createFolderSchema } from "./folder.schema.js";
import {
  createFolder,
  getFolders,
  deletionFolder
} from "./folder.service.js";
import { AppError } from "../../utils/AppError.js";
import mongoose from "mongoose";

export async function createFolderHandler(req: Request, res: Response) {
  const { name, description } = createFolderSchema.parse(req.body);
  const userId = req.userContext!.userId; // string

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const folder = await createFolder(
    userId,
    name,
    description
  );

  res.status(201).json({
    success: true,
    message: "Folder created successfully",
    folder
  });
}

export async function getFoldersHandler(req: Request, res: Response) {
  const userId = req.userContext!.userId;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const folders = await getFolders(userId);

  res.json({
    success: true,
    message: "Folders retrieved successfully",
    folders
  });
}

export async function deleteFolderHandler(req: Request, res: Response) {
  const userId = req.userContext!.userId;
  const folderId = req.params.folderId;

  if (!folderId) {
    throw new AppError("Folder id is required", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(folderId)) {
    throw new AppError("Invalid folder id", 400);
  }

  await deletionFolder(userId, folderId);

  res.json({
    success: true,
    message: "Folder deleted successfully"
  });
}
