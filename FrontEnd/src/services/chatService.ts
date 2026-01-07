// chatService.ts
// ✅ Connected to apiFetch (auth + correct base URL)

import { apiFetch } from "@/lib/api";

export interface Chat {
  _id: string;
  folderId: string;
  title: string;
  studyMode?: "simple" | "interview" | "step-by-step";
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}



/* ================================
   GET ALL CHATS IN A FOLDER
================================ */
export const getChats = async (folderId: string): Promise<Chat[]> => {
  const res = await apiFetch(`/api/folders/${folderId}/chats`, {
    method: "GET",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to fetch chats");
  }

  const data = await res.json();
  return data.chats;
};

/* ================================
   CREATE NEW CHAT
================================ */
export const createChat = async (
  folderId: string,
  payload: { title: string; studyMode?: "simple" | "interview" | "step-by-step", constraintMode?: "allowed" | "strict" }
) => {
  const res = await apiFetch(`/api/folders/${folderId}/chats`, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      folderId, // 👈 backend expects this in body
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to create chat");
  }

  const data = await res.json();
  return data.chat;
};


/* ================================
   ARCHIVE CHAT
================================ */
export const archiveChat = async (chatId: string): Promise<Chat> => {
  const res = await apiFetch(`/api/chats/${chatId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to archive chat");
  }

  const data = await res.json();
  return data.chat;
};

/* ================================
   GET CHAT BY ID
================================ */
export const getChatById = async (chatId: string): Promise<Chat> => {
  const res = await apiFetch(`/api/chats/${chatId}`, {
    method: "GET",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to fetch chat");
  }

  const data = await res.json();
  return data.chat;
};

/* ================================
   UPDATE CHAT TITLE
================================ */
export const updateChatTitle = async (
  chatId: string,
  title: string
): Promise<Chat> => {
  const res = await apiFetch(`/api/chats/${chatId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to update chat");
  }

  const data = await res.json();
  return data.chat;
};

// get all chats for user 
export const getAllChatsForUser = async() => {
  const res = await apiFetch(`/api/chats`, {
    method: "GET",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to fetch chats");
  }
  const data = await res.json();
  return data.chats;
}