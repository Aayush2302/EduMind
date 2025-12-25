import { apiFetch } from '@/lib/api';

export interface Folder {
  _id: string;
  ownerId: string;
  name: string;
  description?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
}

export interface CreateFolderResponse {
  success: boolean;
  message: string;
  folder: Folder;
}

export interface GetFoldersResponse {
  success: boolean;
  message: string;
  folders: Folder[];
}

export interface DeleteFolderResponse {
  success: boolean;
  message: string;
}

/**
 * Create a new folder
 */
export async function createFolder(data: CreateFolderRequest): Promise<Folder> {
  const response = await apiFetch('/api/folders/createFolder', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create folder' }));
    throw new Error(error.message || 'Failed to create folder');
  }

  const result: CreateFolderResponse = await response.json();
  return result.folder;
}

/**
 * Get all folders for the current user
 */
export async function getFolders(): Promise<Folder[]> {
  const response = await apiFetch('/api/folders/getFolders', {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch folders' }));
    throw new Error(error.message || 'Failed to fetch folders');
  }

  const result: GetFoldersResponse = await response.json();
  return result.folders;
}

/**
 * Delete a folder (soft delete)
 */
export async function deleteFolder(folderId: string): Promise<void> {
  const response = await apiFetch(`/api/folders/${folderId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete folder' }));
    throw new Error(error.message || 'Failed to delete folder');
  }

  await response.json();
}