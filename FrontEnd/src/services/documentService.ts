// src/services/documentService.ts
import { apiFetch } from "@/lib/api";

export interface Document {
  id: string;
  fileName: string;
  size: number;
  status: "uploaded" | "processing" | "processed" | "failed";
  downloadUrl?: string;
  createdAt: string;
  chatId: string;
  chatTitle?: string;
  folderName?: string;
}

export interface UploadDocumentResponse {
  success: boolean;
  document: Document;
}

export interface ListDocumentsResponse {
  success: boolean;
  documents: Document[];
  total?: number;
  limit?: number;
  remaining?: number;
}

// Import the same API_BASE_URL used by apiFetch to ensure consistency
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Get auth headers by copying what apiFetch does
 */
const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  
  const possibleTokens = [
    { key: 'token', headerName: 'Authorization', format: (t: string) => `Bearer ${t}` },
    { key: 'authToken', headerName: 'Authorization', format: (t: string) => `Bearer ${t}` },
    { key: 'accessToken', headerName: 'Authorization', format: (t: string) => `Bearer ${t}` },
    { key: 'x-google-id-token', headerName: 'x-google-id-token', format: (t: string) => t },
    { key: 'googleIdToken', headerName: 'x-google-id-token', format: (t: string) => t },
    { key: 'idToken', headerName: 'Authorization', format: (t: string) => `Bearer ${t}` },
  ];
  
  for (const { key, headerName, format } of possibleTokens) {
    const token = localStorage.getItem(key);
    if (token) {
      headers[headerName] = format(token);
    }
  }
  
  return headers;
};

/**
 * Upload PDF document to a chat
 */
export const uploadDocument = async (
  chatId: string,
  file: File
): Promise<Document> => {
  const formData = new FormData();
  formData.append("pdf", file);
  formData.append("chatId", chatId);

  const authHeaders = getAuthHeaders();
  
  console.log("📤 Upload attempt:", {
    url: `${API_BASE_URL}/api/documents/upload`,
    fileName: file.name,
    fileSize: file.size,
    chatId,
    authHeaders: Object.keys(authHeaders),
    hasToken: Object.keys(authHeaders).length > 0,
  });

  const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
    method: "POST",
    headers: {
      ...authHeaders,
    },
    credentials: "include",
    body: formData,
  });

  console.log("📡 Upload response:", {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  });

  if (!response.ok) {
    let errorMessage = "Upload failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      console.error("❌ Error details:", errorData);
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data: UploadDocumentResponse = await response.json();
  console.log("✅ Upload successful:", data.document);
  return data.document;
};

/**
 * Get all documents for the authenticated user
 */
export const getAllUserDocuments = async (): Promise<ListDocumentsResponse> => {
  const response = await apiFetch("/api/documents/all", {
    method: "GET",
  });

  return await response.json();
};

/**
 * Download PDF document
 */
export const downloadDocument = async (documentId: string): Promise<Blob> => {
  const authHeaders = getAuthHeaders();
  
  const response = await fetch(
    `${API_BASE_URL}/api/documents/${documentId}/download`,
    {
      method: "GET",
      headers: authHeaders,
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to download document");
  }

  return await response.blob();
};

/**
 * Delete PDF document (from both Supabase and MongoDB)
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
  await apiFetch(`/api/documents/${documentId}`, {
    method: "DELETE",
  });
};

/**
 * List all documents for a chat
 */
export const listChatDocuments = async (chatId: string): Promise<Document[]> => {
  const response = await apiFetch(`/api/chats/${chatId}/documents`, {
    method: "GET",
  });

  const data: ListDocumentsResponse = await response.json();
  return data.documents;
};

/**
 * Helper: Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Get document processing status
 */
export const getDocumentStatus = async (documentId: string): Promise<{
  status: "uploaded" | "processing" | "processed" | "failed";
  pageCount?: number;
  fileName: string;
}> => {
  const response = await apiFetch(`/api/documents/${documentId}/status`, {
    method: "GET",
  });

  const data = await response.json();
  return data;
};

/**
 * Get all documents status for a chat
 */
export const getChatDocumentsStatus = async (chatId: string): Promise<Document[]> => {
  const response = await apiFetch(`/api/chats/${chatId}/documents/status`, {
    method: "GET",
  });

  const data = await response.json();
  return data.documents;
};

/**
 * Poll document status until processed or failed
 */
export const pollDocumentStatus = async (
  documentId: string,
  onProgress: (status: string, pageCount?: number) => void,
  intervalMs: number = 2000,
  maxAttempts: number = 60 // 2 minutes max
): Promise<void> => {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        attempts++;

        const { status, pageCount, fileName } = await getDocumentStatus(documentId);

        onProgress(status, pageCount);

        if (status === "processed") {
          clearInterval(interval);
          console.log(`✅ Document ${fileName} processed successfully`);
          resolve();
        } else if (status === "failed") {
          clearInterval(interval);
          reject(new Error("Document processing failed"));
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error("Polling timeout - document still processing"));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, intervalMs);
  });
};

/**
 * Helper: Trigger download in browser
 */
export const triggerDownload = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};