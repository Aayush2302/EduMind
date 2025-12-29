import { useState, useRef, useEffect } from "react";
import {
  getChats,
  createChat,
  archiveChat,
  getAllChatsForUser,
} from "@/services/chatService";
import { getMessages, createMessage } from "@/services/messageService";
import { NewChatModal } from "./NewChatModal";
import { ChatList } from "./ChatList";
import { ChatView } from "./ChatView";
import { MobileChatList } from "./MobileChatList";
import { MobileChatView } from "./MobileChatView";

interface Message {
  _id: string;
  chatId: string;
  sender: "user" | "assistant";
  content: string;
  status: "completed" | "processing";
  parentMessageId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatSettings {
  studyMode: "simple" | "interview" | "step-by-step";
  constraintMode: "allowed" | "strict";
  document?: File | null;
  chatTitle: string;
}

interface Chat {
  _id: string;
  folderId: string;
  title: string;
  studyMode?: "simple" | "interview" | "step-by-step";
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  preview?: string;
  messages?: Message[];
  settings?: ChatSettings;
}

interface ChatsProps {
  folderId?: string;
  subjectName?: string;
}

const Chats = ({ folderId, subjectName = "All Chats" }: ChatsProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [newChatSettings, setNewChatSettings] = useState<ChatSettings>({
    studyMode: "simple",
    constraintMode: "allowed",
    document: null,
    chatTitle: "",
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchChats();
  }, [folderId]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat._id);
    }
  }, [activeChat?._id]);

  // ========== POLLING FOR REAL-TIME UPDATES ==========
  useEffect(() => {
    // Start polling when there's an active chat and typing is happening
    if (activeChat && isTyping) {
      pollingIntervalRef.current = setInterval(() => {
        fetchMessagesQuietly(activeChat._id);
      }, 2000); // Poll every 2 seconds
    }

    // Cleanup polling when typing stops or chat changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [activeChat?._id, isTyping]);

  // Fetch messages without showing loading state (for polling)
  const fetchMessagesQuietly = async (chatId: string) => {
  try {
    const fetchedMessages = await getMessages(chatId);

    const lastAssistantMessage = [...fetchedMessages]
      .reverse()
      .find(msg => msg.sender === "assistant");

    if (lastAssistantMessage?.status === "completed") {
      setIsTyping(false);
    }

    setChats(prev =>
      prev.map(chat =>
        chat._id === chatId
          ? { ...chat, messages: fetchedMessages }
          : chat
      )
    );

    setActiveChat(prev =>
      prev && prev._id === chatId
        ? { ...prev, messages: fetchedMessages }
        : prev
    );
  } catch (err) {
    console.error("Polling error:", err);
  }
};


  const fetchChats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const fetchedChats = folderId
        ? await getChats(folderId)
        : await getAllChatsForUser();

      const enrichedChats = fetchedChats.map((chat) => ({
        ...chat,
        preview: chat.title.slice(0, 30) + "...",
        messages: [],
        settings: {
          studyMode: mapStudyMode(chat.studyMode),
          constraintMode: "allowed" as const,
          chatTitle: chat.title,
        },
      }));

      setChats(enrichedChats);

      if (enrichedChats.length > 0 && !activeChat && !isMobile) {
        setActiveChat(enrichedChats[0]);
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch chats");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const fetchedMessages = await getMessages(chatId);

      setChats(
        chats.map((chat) =>
          chat._id === chatId ? { ...chat, messages: fetchedMessages } : chat
        )
      );

      setActiveChat((prev) =>
        prev && prev._id === chatId
          ? { ...prev, messages: fetchedMessages }
          : prev
      );
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch messages");
    }
  };

  const mapStudyMode = (
    mode?: "simple" | "interview" | "step-by-step"
  ): "simple" | "interview" | "step-by-step" => {
    if (mode === "step-by-step") return "step-by-step";
    return mode || "simple";
  };

  const mapStudyModeToBackend = (
    mode: "simple" | "interview" | "step-by-step"
  ): "simple" | "interview" | "step-by-step" => {
    if (mode === "step-by-step") return "step-by-step";
    return mode;
  };

  const handleNewChatClick = () => {
    setNewChatSettings({
      studyMode: "simple",
      constraintMode: "allowed",
      document: null,
      chatTitle: "",
    });
    setShowNewChatModal(true);
  };

  const handleCreateChat = async () => {
    if (!folderId) {
      setError("Please select a subject first to create a new chat");
      return;
    }

    if (!newChatSettings.chatTitle.trim()) {
      setError("Please enter a chat name");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const newChat = await createChat(folderId, {
        title: newChatSettings.chatTitle.trim(),
        studyMode: mapStudyModeToBackend(newChatSettings.studyMode),
      });

      const enrichedChat: Chat = {
        ...newChat,
        preview: "Start a conversation...",
        messages: [],
        settings: {
          studyMode: newChatSettings.studyMode,
          constraintMode: newChatSettings.constraintMode,
          chatTitle: newChatSettings.chatTitle.trim(),
        },
      };

      setChats([enrichedChat, ...chats]);
      setActiveChat(enrichedChat);
      setShowNewChatModal(false);
    } catch (err) {
      console.error("Error creating chat:", err);
      setError(err instanceof Error ? err.message : "Failed to create chat");
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveChat = async (chatId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await archiveChat(chatId);

      setChats(chats.filter((c) => c._id !== chatId));

      if (activeChat?._id === chatId) {
        setActiveChat(chats.length > 1 ? chats[0] : null);
      }
    } catch (err) {
      console.error("Error archiving chat:", err);
      setError(err instanceof Error ? err.message : "Failed to archive chat");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeChat) return;

    const messageContent = input;
    setInput("");

    try {
      const tempUserMessage: Message = {
        _id: `temp-${Date.now()}`,
        chatId: activeChat._id,
        sender: "user",
        content: messageContent,
        status: "completed",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const tempAssistantMessage: Message = {
        _id: `temp-${Date.now() + 1}`,
        chatId: activeChat._id,
        sender: "assistant",
        content: "",
        status: "processing",
        parentMessageId: tempUserMessage._id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedMessages = [
        ...(activeChat.messages || []),
        tempUserMessage,
        tempAssistantMessage,
      ];
      const updatedChat = {
        ...activeChat,
        messages: updatedMessages,
        preview: messageContent.slice(0, 30) + "...",
        title:
          (activeChat.messages?.length || 0) === 0
            ? messageContent.slice(0, 30)
            : activeChat.title,
      };

      setActiveChat(updatedChat);
      setChats(chats.map((c) => (c._id === activeChat._id ? updatedChat : c)));
      setIsTyping(true);

      // Send message to backend (which adds to BullMQ)
      await createMessage(activeChat._id, messageContent);

      // Polling will now handle fetching the response
      // The useEffect with polling will automatically fetch messages

    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      setIsTyping(false);

      if (activeChat) {
        const cleanedMessages = (activeChat.messages || []).filter(
          (msg) => !msg._id.startsWith("temp-")
        );
        const rollbackChat = {
          ...activeChat,
          messages: cleanedMessages,
        };
        setActiveChat(rollbackChat);
        setChats(
          chats.map((c) => (c._id === activeChat._id ? rollbackChat : c))
        );
      }
    }
  };

  const handleGeneratePDF = () => {
    alert("PDF generation would be triggered here");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File uploaded:", file.name);
    }
  };

  const handleModalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewChatSettings({ ...newChatSettings, document: file });
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setActiveChat(chat);
  };

  // MOBILE VIEW: Chat List
  if (isMobile && !activeChat) {
    return (
      <>
        <MobileChatList
          chats={chats}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChatClick}
          isLoading={isLoading}
          showNewChatButton={!!folderId}
          headerTitle={folderId ? subjectName : "All Chats"}
        />
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-sm shadow-lg z-50 flex items-center gap-2">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        <NewChatModal
          show={showNewChatModal}
          onClose={() => setShowNewChatModal(false)}
          settings={newChatSettings}
          onSettingsChange={setNewChatSettings}
          onCreateChat={handleCreateChat}
          isLoading={isLoading}
          modalFileInputRef={modalFileInputRef}
          onFileUpload={handleModalFileUpload}
        />
      </>
    );
  }

  // MOBILE VIEW: Chat Screen
  if (isMobile && activeChat) {
    return (
      <>
        <MobileChatView
          chat={activeChat}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          onBack={() => setActiveChat(null)}
          onGeneratePDF={handleGeneratePDF}
          onFileUpload={handleFileUpload}
          isTyping={isTyping}
          fileInputRef={fileInputRef}
          textareaRef={textareaRef}
        />
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-sm shadow-lg z-50 flex items-center gap-2">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        <NewChatModal
          show={showNewChatModal}
          onClose={() => setShowNewChatModal(false)}
          settings={newChatSettings}
          onSettingsChange={setNewChatSettings}
          onCreateChat={handleCreateChat}
          isLoading={isLoading}
          modalFileInputRef={modalFileInputRef}
          onFileUpload={handleModalFileUpload}
        />
      </>
    );
  }

  // DESKTOP VIEW
  return (
    <div className="h-[calc(100vh-7rem)] flex">
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-sm shadow-lg z-50 flex items-center gap-2">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <ChatList
        chats={chats}
        activeChat={activeChat}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChatClick}
        onArchiveChat={handleArchiveChat}
        isLoading={isLoading}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        showNewChatButton={!!folderId}
        headerTitle={folderId ? subjectName : "All Chats"}
      />

      <div className="flex-1 flex flex-col bg-background">
        <ChatView
          chat={activeChat}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          onGeneratePDF={handleGeneratePDF}
          onFileUpload={handleFileUpload}
          isTyping={isTyping}
          fileInputRef={fileInputRef}
          textareaRef={textareaRef}
        />
      </div>

      <NewChatModal
        show={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        settings={newChatSettings}
        onSettingsChange={setNewChatSettings}
        onCreateChat={handleCreateChat}
        isLoading={isLoading}
        modalFileInputRef={modalFileInputRef}
        onFileUpload={handleModalFileUpload}
      />
    </div>
  );
};

export default Chats;