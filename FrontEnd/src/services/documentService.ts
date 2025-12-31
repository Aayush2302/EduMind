// src/services/documentService.ts
import { apiFetch } from "@/lib/api";

export interface Document {
  id: string;
  fileName: string;
  size: number;
  status: "uploaded" | "processing" | "processed" | "failed";
  downloadUrl?: string;
  createdAt: string;
}

export interface UploadDocumentResponse {
  success: boolean;
  document: Document;
}

export interface ListDocumentsResponse {
  success: boolean;
  documents: Document[];
}

/**
 * Get auth headers by copying what apiFetch does
 * This ensures we use the EXACT same authentication as other services
 */
const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  
  // Try all common token storage locations
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
 * 
 * IMPORTANT: This uses raw fetch with FormData instead of apiFetch
 * because apiFetch is designed for JSON, not multipart/form-data
 */
export const uploadDocument = async (
  chatId: string,
  file: File
): Promise<Document> => {
  const formData = new FormData();
  formData.append("pdf", file);
  formData.append("chatId", chatId);

  const authHeaders = getAuthHeaders();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  
  console.log("📤 Upload attempt:", {
    url: `${apiUrl}/api/documents/upload`,
    fileName: file.name,
    fileSize: file.size,
    chatId,
    authHeaders: Object.keys(authHeaders),
    hasToken: Object.keys(authHeaders).length > 0,
  });

  const response = await fetch(`${apiUrl}/api/documents/upload`, {
    method: "POST",
    headers: {
      ...authHeaders,
      // IMPORTANT: Do NOT set Content-Type header
      // Browser will automatically set it with proper boundary for multipart/form-data
    },
    credentials: "include", // Include cookies
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
 * Download PDF document
 */
export const downloadDocument = async (documentId: string): Promise<Blob> => {
  const authHeaders = getAuthHeaders();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  
  const response = await fetch(
    `${apiUrl}/api/documents/${documentId}/download`,
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
 * Delete PDF document
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