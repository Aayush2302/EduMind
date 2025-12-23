import { SubjectFolder } from "../../models/Folder.js";
import { AppError } from "../../utils/AppError.js";

export async function createFolder(
  ownerId: string,
  name: string,
  description?: string
) {
  const existing = await SubjectFolder.findOne({
    ownerId,
    name,
    isDeleted: false
  });

  if (existing) {
    throw new AppError("Folder with this name already exists", 409);
  }

  return SubjectFolder.create({
    ownerId,
    name,
    description
  });
}

export async function getFolders(ownerId: string) {
  return SubjectFolder.find({
    ownerId,
    isDeleted: false
  }).sort({ updatedAt: -1 });
}

export async function deletionFolder(
  ownerId: string,
  folderId: string
) {
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
    throw new AppError("Folder not found", 404);
  }

  return folder;
}
