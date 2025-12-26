// messageService.ts
import { apiFetch } from "@/lib/api";

export interface Message {
  _id: string;
  chatId: string;
  sender: "user" | "assistant";
  content: string;
  status: "completed" | "processing";
  parentMessageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageResponse {
  success: boolean;
  userMessage: Message;
  assistantMessage: Message;
}

/* ================================
   GET ALL MESSAGES IN A CHAT
================================ */
export const getMessages = async (chatId: string): Promise<Message[]> => {
  const res = await apiFetch(`/api/chats/${chatId}/messages`, {
    method: "GET",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to fetch messages");
  }

  const data = await res.json();
  return data.messages || [];
};

/* ================================
   CREATE AND SEND MESSAGE
================================ */
export const createMessage = async (
  chatId: string,
  content: string
): Promise<CreateMessageResponse> => {
  const res = await apiFetch(`/api/chats/${chatId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to send message");
  }

  const data = await res.json();
  return data;
};