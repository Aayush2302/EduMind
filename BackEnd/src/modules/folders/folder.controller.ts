import { Request, Response } from "express";
import { createFolderSchema } from "./folder.schema.js";
import {
  createFolder,
  getFolders,
  deletionFolder
} from "./folder.service.js";
import { AppError } from "../../utils/AppError.js";
import mongoose from "mongoose";

/**
 * Create a new subject folder for the user
 */
export async function createFolderHandler(req: Request, res: Response) {
  console.log("[CREATE FOLDER] Incoming request", {
    body: req.body
  });

  // Validate request body using Zod
  const { name, description } = createFolderSchema.parse(req.body);

  const userId = req.userContext!.userId;

  console.log("[CREATE FOLDER] User identified", {
    userId
  });

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const folder = await createFolder(
    userId,
    name,
    description
  );

  console.log("[CREATE FOLDER] Folder created successfully", {
    folderId: folder._id
  });

  res.status(201).json({
    success: true,
    message: "Folder created successfully",
    folder
  });
}

/**
 * Get all non-deleted folders of the user
 */
export async function getFoldersHandler(req: Request, res: Response) {
  const userId = req.userContext!.userId;

  console.log("[GET FOLDERS] Request received", {
    userId
  });

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const folders = await getFolders(userId);

  console.log("[GET FOLDERS] Folders fetched", {
    count: folders.length
  });

  res.json({
    success: true,
    message: "Folders retrieved successfully",
    folders
  });
}

/**
 * Soft delete a folder (mark as isDeleted = true)
 */
export async function deleteFolderHandler(req: Request, res: Response) {
  const userId = req.userContext!.userId;
  const folderId = req.params.folderId;

  console.log("[DELETE FOLDER] Request received", {
    userId,
    folderId
  });

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

  console.log("[DELETE FOLDER] Folder deleted successfully", {
    folderId
  });

  res.json({
    success: true,
    message: "Folder deleted successfully"
  });
}
