import { SubjectFolder } from "../../models/Folder.js";
import { AppError } from "../../utils/AppError.js";

/**
 * Create a folder for a specific user
 */
export async function createFolder(
  ownerId: string,
  name: string,
  description?: string
) {
  console.log("[SERVICE] createFolder called", {
    ownerId,
    name
  });

  // Prevent duplicate folder names for the same user
  const existing = await SubjectFolder.findOne({
    ownerId,
    name,
    isDeleted: false
  });

  if (existing) {
    console.error("[SERVICE] Folder name already exists", {
      ownerId,
      name
    });
    throw new AppError("Folder with this name already exists", 409);
  }

  const folder = await SubjectFolder.create({
    ownerId,
    name,
    description
  });

  console.log("[SERVICE] Folder document created", {
    folderId: folder._id
  });

  return folder;
}

/**
 * Fetch all active folders of a user
 */
export async function getFolders(ownerId: string) {
  console.log("[SERVICE] getFolders called", {
    ownerId
  });

  const folders = await SubjectFolder
    .find({
      ownerId,
      isDeleted: false
    })
    .populate('chatCount')
    .sort({ updatedAt: -1 })
    .lean();

  console.log("[SERVICE] Folders retrieved", {
    count: folders.length
  });

  return folders;
}

/**
 * Soft delete a folder (ownership enforced)
 */
export async function deletionFolder(
  ownerId: string,
  folderId: string
) {
  console.log("[SERVICE] deletionFolder called", {
    ownerId,
    folderId
  });

  const folder = await SubjectFolder.findOneAndUpdate(
    {
      _id: folderId,
      ownerId
    },
    {
      isDeleted: true
    },
    {
      new: true
    }
  );

  if (!folder) {
    console.error("[SERVICE] Folder not found or unauthorized", {
      ownerId,
      folderId
    });
    throw new AppError("Folder not found", 404);
  }

  return folder;
}
