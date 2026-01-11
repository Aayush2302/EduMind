import { useState, useRef, useEffect, useCallback } from "react";
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
  status: "completed" | "processing" | "failed";
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
  const activeChatIdRef = useRef<string | null>(null);
  const pollCountRef = useRef(0);

  useEffect(() => {
    activeChatIdRef.current = activeChat?._id || null;
  }, [activeChat?._id]);

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
      console.log("🔄 Active chat changed, fetching messages for:", activeChat._id);
      fetchMessages(activeChat._id);
    }
  }, [activeChat?._id]);

  // Simplified polling - only start/stop based on isTyping
  useEffect(() => {
    console.log("🎯 Polling effect triggered. isTyping:", isTyping, "activeChat:", activeChat?._id);
    
    if (!isTyping || !activeChat) {
      // Stop polling
      if (pollingIntervalRef.current) {
        console.log("⏹️ Stopping polling");
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        pollCountRef.current = 0;
      }
      return;
    }

    // Start polling
    console.log("▶️ Starting polling for chat:", activeChat._id);
    pollCountRef.current = 0;
    
    const poll = async () => {
      const chatId = activeChatIdRef.current;
      if (!chatId) {
        console.log("❌ No active chat ID in ref");
        return;
      }

      pollCountRef.current++;
      console.log(`🔍 Poll #${pollCountRef.current} - Fetching messages for:`, chatId);

      try {
        const fetchedMessages = await getMessages(chatId);
        console.log(`✅ Poll #${pollCountRef.current} - Got ${fetchedMessages.length} messages`);

        // CRITICAL FIX: Preserve temp messages if backend hasn't created the real ones yet
        setActiveChat((prev) => {
          if (!prev || prev._id !== chatId) {
            console.log("❌ Chat mismatch in activeChat update");
            return prev;
          }
          
          // Find temp messages in current state
          const tempMessages = (prev.messages || []).filter(m => m._id.startsWith('temp-'));
          const hasNewTempMessages = tempMessages.length > 0;
          
          if (hasNewTempMessages) {
            console.log(`⏳ Found ${tempMessages.length} temp messages, checking if backend created them...`);
            
            // Check if the user message from temp exists in fetched messages
            const tempUserMessage = tempMessages.find(m => m.sender === 'user');
            if (tempUserMessage) {
              // Look for matching user message by content and approximate timestamp
              const matchingUserMessage = fetchedMessages.find(m => 
                m.sender === 'user' && 
                m.content === tempUserMessage.content &&
                Math.abs(new Date(m.createdAt).getTime() - new Date(tempUserMessage.createdAt).getTime()) < 10000
              );
              
              if (!matchingUserMessage) {
                console.log(`⏸️ Backend hasn't created message yet, keeping temp messages`);
                // Backend hasn't created the message yet, keep temp messages
                // DON'T stop typing here!
                return prev;
              } else {
                console.log(`✅ Found matching message in backend, replacing temp messages`);
                
                // Now check if the assistant response is complete
                const matchingAssistantMessage = fetchedMessages.find(m =>
                  m.sender === 'assistant' &&
                  m.parentMessageId === matchingUserMessage._id
                );
                
                if (matchingAssistantMessage?.status === 'completed') {
                  console.log(`✅ Assistant response completed, stopping typing`);
                  setIsTyping(false);
                } else {
                  console.log(`⏳ Assistant still processing...`);
                }
              }
            }
          } else {
            // No temp messages, check last assistant message status
            const lastAssistantMessage = [...fetchedMessages]
              .reverse()
              .find((msg) => msg.sender === "assistant");

            if (lastAssistantMessage?.status === "completed") {
              console.log("✅ Last assistant completed (no temp messages), stopping typing");
              setIsTyping(false);
            }
          }
          
          const prevMessageIds = (prev.messages || []).map(m => m._id).join(',');
          const newMessageIds = fetchedMessages.map(m => m._id).join(',');
          
          // Check if any processing messages have changed status or content
          const prevProcessingMessages = (prev.messages || []).filter(m => m.status === 'processing');
          const hasProcessingChanges = prevProcessingMessages.some(prevMsg => {
            const newMsg = fetchedMessages.find(m => m._id === prevMsg._id);
            return newMsg && (newMsg.status !== prevMsg.status || newMsg.content !== prevMsg.content);
          });
          
          if (prevMessageIds === newMessageIds && !hasProcessingChanges) {
            console.log(`⏭️ Messages unchanged and no processing updates, skipping update`);
            return prev;
          }
          
          if (hasProcessingChanges) {
            console.log(`🔄 Processing message updated, forcing re-render`);
          }
          
          console.log(`🔄 Updating activeChat messages from ${prev.messages?.length || 0} to ${fetchedMessages.length}`);
          
          // Force new object to trigger re-render
          return { 
            ...prev, 
            messages: [...fetchedMessages],
            updatedAt: new Date().toISOString() // Force change detection
          };
        });

        setChats((prev) => {
          return prev.map((chat) => {
            if (chat._id !== chatId) return chat;
            
            // Apply same temp message logic - check if we should keep temp messages
            const tempMessages = (chat.messages || []).filter(m => m._id.startsWith('temp-'));
            if (tempMessages.length > 0) {
              const tempUserMessage = tempMessages.find(m => m.sender === 'user');
              if (tempUserMessage) {
                const matchingUserMessage = fetchedMessages.find(m => 
                  m.sender === 'user' && 
                  m.content === tempUserMessage.content &&
                  Math.abs(new Date(m.createdAt).getTime() - new Date(tempUserMessage.createdAt).getTime()) < 10000
                );
                
                if (!matchingUserMessage) {
                  // Keep current state with temp messages
                  return chat;
                }
              }
            }
            
            // Update with fetched messages
            return { 
              ...chat, 
              messages: [...fetchedMessages],
              updatedAt: new Date().toISOString()
            };
          });
        });

      } catch (err) {
        console.error("❌ Polling error:", err);
      }
    };

    // Initial poll immediately
    poll();

    // Then poll every 2 seconds
    pollingIntervalRef.current = setInterval(poll, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        console.log("🧹 Cleanup: Stopping polling");
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isTyping, activeChat?._id]);

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
      console.log("📥 Fetching messages for chat:", chatId);
      const fetchedMessages = await getMessages(chatId);
      console.log(`📥 Got ${fetchedMessages.length} messages`);

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

      const newChat = await createChat(folderId, {
        title: newChatSettings.chatTitle.trim(),
        studyMode: mapStudyModeToBackend(newChatSettings.studyMode),
        constraintMode: newChatSettings.constraintMode,
      });

      console.log("✅ Chat created:", newChat._id);

      if (newChatSettings.document) {
        const file = newChatSettings.document;
        console.log("📤 Uploading document:", file.name);

        setUploadProgress({
          show: true,
          fileName: file.name,
          status: "uploading",
        });

        try {
          const document = await uploadDocument(newChat._id, file);
          console.log("✅ Upload complete, starting processing:", document.id);

          setUploadProgress({
            show: true,
            fileName: file.name,
            status: "processing",
          });

          await pollDocumentStatus(
            document.id,
            (status, pageCount) => {
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

      setChats((prev) => [enrichedChat, ...prev]);
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

      const remainingChats = chats.filter((c) => c._id !== chatId);
      setChats(remainingChats);

      if (activeChat?._id === chatId) {
        setActiveChat(remainingChats.length > 0 ? remainingChats[0] : null);
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
    if (!input.trim() || !activeChat) {
      console.log("❌ Cannot send: no input or no active chat");
      return;
    }

    const messageContent = input.trim();
    console.log("📤 Sending message:", messageContent.substring(0, 50) + "...");
    
    setInput("");

    // Use unique temp IDs with random suffix to avoid collisions
    const tempSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const tempUserId = `temp-user-${tempSuffix}`;
    const tempAssistantId = `temp-assistant-${tempSuffix}`;

    console.log("🆔 Creating temp messages with IDs:", tempUserId, tempAssistantId);

    const tempUserMessage: Message = {
      _id: tempUserId,
      chatId: activeChat._id,
      sender: "user",
      content: messageContent,
      status: "completed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const tempAssistantMessage: Message = {
      _id: tempAssistantId,
      chatId: activeChat._id,
      sender: "assistant",
      content: "",
      status: "processing",
      parentMessageId: tempUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add temp messages immediately with forced re-render
    const currentMessages = activeChat.messages || [];
    const newMessages = [...currentMessages, tempUserMessage, tempAssistantMessage];
    
    console.log("➕ Adding temp messages:");
    console.log("  Current count:", currentMessages.length);
    console.log("  New count:", newMessages.length);
    console.log("  Temp user ID:", tempUserId);
    console.log("  Temp assistant ID:", tempAssistantId);
    console.log("  Last message ID:", newMessages[newMessages.length - 1]._id);

    const updatedActiveChat = {
      ...activeChat,
      messages: newMessages,
      preview: messageContent.slice(0, 30) + "...",
      title: currentMessages.length === 0 ? messageContent.slice(0, 30) : activeChat.title,
      // Force re-render
      _updateKey: Date.now(),
    };

    console.log("🔄 Setting new activeChat with", updatedActiveChat.messages.length, "messages");
    setActiveChat(updatedActiveChat);

    setChats((prev) =>
      prev.map((c) =>
        c._id === activeChat._id
          ? {
              ...c,
              messages: newMessages,
              preview: messageContent.slice(0, 30) + "...",
              title: c.messages?.length === 0 ? messageContent.slice(0, 30) : c.title,
            }
          : c
      )
    );

    // Start typing AFTER state is updated
    console.log("🎬 Setting isTyping to true");
    setIsTyping(true);

    try {
      console.log("📡 Calling createMessage API");
      await createMessage(activeChat._id, messageContent);
      console.log("✅ Message created successfully");
    } catch (err) {
      console.error("❌ Error sending message:", err);
      toast.error(err instanceof Error ? err.message : "Failed to send message");
      setIsTyping(false);

      // Rollback
      console.log("↩️ Rolling back optimistic update");
      setActiveChat((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: (prev.messages || []).filter(
            (msg) => msg._id !== tempUserId && msg._id !== tempAssistantId
          ),
        };
      });

      setChats((prev) =>
        prev.map((c) =>
          c._id === activeChat._id
            ? {
                ...c,
                messages: (c.messages || []).filter(
                  (msg) => msg._id !== tempUserId && msg._id !== tempAssistantId
                ),
              }
            : c
        )
      );
    }
  };

  const handleGeneratePDF = () => {
    toast.info("PDF generation feature coming soon!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size must be less than 15MB");
      return;
    }

    try {
      setUploadProgress({
        show: true,
        fileName: file.name,
        status: "uploading",
      });

      const document = await uploadDocument(activeChat._id, file);

      setUploadProgress({
        show: true,
        fileName: file.name,
        status: "processing",
      });

      await pollDocumentStatus(
        document.id,
        (status, pageCount) => {
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
    console.log("🎯 Chat selected:", chat._id);
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