import { useState, useRef, useEffect } from "react";
import {
  getChats,
  createChat,
  archiveChat,
  getAllChatsForUser,
} from "@/services/chatService";
import { getMessages, createMessage } from "@/services/messageService";
import { uploadDocument, pollDocumentStatus } from "@/services/documentService";
import { NewChatModal } from "./NewChatModal";
import { ChatList } from "./ChatList";
import { ChatView } from "./ChatView";
import { MobileChatList } from "./MobileChatList";
import { MobileChatView } from "./MobileChatView";
import { DocumentUploadProgress } from "./documentUploadProggress";
import { toast } from "sonner";

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

  const [uploadProgress, setUploadProgress] = useState<{
    show: boolean;
    fileName: string;
    status: "uploading" | "processing" | "processed" | "failed";
    pageCount?: number;
  }>({
    show: false,
    fileName: "",
    status: "uploading",
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (activeChat && isTyping) {
      pollingIntervalRef.current = setInterval(() => {
        fetchMessagesQuietly(activeChat._id);
      }, 2000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [activeChat?._id, isTyping]);

  const fetchMessagesQuietly = async (chatId: string) => {
    try {
      const fetchedMessages = await getMessages(chatId);

      const lastAssistantMessage = [...fetchedMessages]
        .reverse()
        .find((msg) => msg.sender === "assistant");

      if (lastAssistantMessage?.status === "completed") {
        setIsTyping(false);
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat._id === chatId ? { ...chat, messages: fetchedMessages } : chat
        )
      );

      setActiveChat((prev) =>
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
      toast.error("Please select a subject first to create a new chat");
      return;
    }

    if (!newChatSettings.chatTitle.trim()) {
      toast.error("Please enter a chat name");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 1️⃣ Create the chat first
      const newChat = await createChat(folderId, {
        title: newChatSettings.chatTitle.trim(),
        studyMode: mapStudyModeToBackend(newChatSettings.studyMode),
      });

      console.log("✅ Chat created:", newChat._id);

      // 2️⃣ Upload document if provided
      if (newChatSettings.document) {
        const file = newChatSettings.document;
        console.log("📤 Uploading document:", file.name);

        // Show uploading modal
        setUploadProgress({
          show: true,
          fileName: file.name,
          status: "uploading",
        });

        try {
          // Upload document
          const document = await uploadDocument(newChat._id, file);
          console.log("✅ Upload complete, starting processing:", document.id);

          // Update to processing state
          setUploadProgress({
            show: true,
            fileName: file.name,
            status: "processing",
          });

          // Poll for status updates
          await pollDocumentStatus(
            document.id,
            (status, pageCount) => {
              console.log(`📊 Status update: ${status}, pages: ${pageCount || 0}`);

              if (status === "processing") {
                setUploadProgress({
                  show: true,
                  fileName: file.name,
                  status: "processing",
                  pageCount,
                });
              } else if (status === "processed") {
                setUploadProgress({
                  show: true,
                  fileName: file.name,
                  status: "processed",
                  pageCount,
                });
              } else if (status === "failed") {
                setUploadProgress({
                  show: true,
                  fileName: file.name,
                  status: "failed",
                });
              }
            },
            2000,
            60
          );

          toast.success("Document processed successfully!");
        } catch (uploadErr) {
          console.error("❌ Document upload/processing failed:", uploadErr);
          setUploadProgress({
            show: true,
            fileName: file.name,
            status: "failed",
          });
          toast.error(
            `Document processing failed: ${
              uploadErr instanceof Error ? uploadErr.message : "Unknown error"
            }`
          );
        }
      }

      // 3️⃣ Add chat to list
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
      toast.success("Chat created successfully!");
    } catch (err) {
      console.error("Error creating chat:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create chat");
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

      toast.success("Chat archived successfully");
    } catch (err) {
      console.error("Error archiving chat:", err);
      toast.error(err instanceof Error ? err.message : "Failed to archive chat");
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

      await createMessage(activeChat._id, messageContent);
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error(err instanceof Error ? err.message : "Failed to send message");
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
    toast.info("PDF generation feature coming soon!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported");
      return;
    }

    // Validate file size (15MB max)
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size must be less than 15MB");
      return;
    }

    try {
      // Show uploading state
      setUploadProgress({
        show: true,
        fileName: file.name,
        status: "uploading",
      });

      console.log("📤 Uploading document:", file.name);

      // Upload document
      const document = await uploadDocument(activeChat._id, file);

      console.log("✅ Upload complete, starting processing:", document.id);

      // Update to processing state
      setUploadProgress({
        show: true,
        fileName: file.name,
        status: "processing",
      });

      // Poll for status updates
      await pollDocumentStatus(
        document.id,
        (status, pageCount) => {
          console.log(`📊 Status update: ${status}, pages: ${pageCount || 0}`);

          if (status === "processing") {
            setUploadProgress({
              show: true,
              fileName: file.name,
              status: "processing",
              pageCount,
            });
          } else if (status === "processed") {
            setUploadProgress({
              show: true,
              fileName: file.name,
              status: "processed",
              pageCount,
            });
          } else if (status === "failed") {
            setUploadProgress({
              show: true,
              fileName: file.name,
              status: "failed",
            });
          }
        },
        2000,
        60
      );

      toast.success("Document processed successfully!");
    } catch (error) {
      console.error("❌ Upload/processing error:", error);

      setUploadProgress({
        show: true,
        fileName: file.name,
        status: "failed",
      });

      toast.error(
        error instanceof Error ? error.message : "Failed to process document"
      );
    } finally {
      // Clear file input
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleModalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are allowed");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error("File size must be less than 15MB");
        return;
      }
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
        <DocumentUploadProgress
          show={uploadProgress.show}
          fileName={uploadProgress.fileName}
          status={uploadProgress.status}
          pageCount={uploadProgress.pageCount}
          onClose={() => setUploadProgress({ ...uploadProgress, show: false })}
        />
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
        <DocumentUploadProgress
          show={uploadProgress.show}
          fileName={uploadProgress.fileName}
          status={uploadProgress.status}
          pageCount={uploadProgress.pageCount}
          onClose={() => setUploadProgress({ ...uploadProgress, show: false })}
        />
      </>
    );
  }

  // DESKTOP VIEW
  return (
    <>
      <div className="h-[calc(100vh-7rem)] flex">
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
      </div>

      <DocumentUploadProgress
        show={uploadProgress.show}
        fileName={uploadProgress.fileName}
        status={uploadProgress.status}
        pageCount={uploadProgress.pageCount}
        onClose={() => setUploadProgress({ ...uploadProgress, show: false })}
      />

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
};

export default Chats;