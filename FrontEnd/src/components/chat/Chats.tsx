import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Send, 
  Paperclip, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Upload,
  X,
  BookOpen,
  Users,
  ListOrdered,
  Shield,
  ShieldCheck,
  Trash2,
  MoreVertical,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getChats, createChat, archiveChat } from "@/services/chatService";
import { getMessages, createMessage } from "@/services/messageService";
import MessageDisplay from "@/components/chat/MessageDisplay";

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
  folderId: string;
  subjectName?: string;
}

const Chats = ({ folderId, subjectName = "Subject" }: ChatsProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [newChatSettings, setNewChatSettings] = useState<ChatSettings>({
    studyMode: "simple",
    constraintMode: "allowed",
    document: null,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  useEffect(() => {
    fetchChats();
  }, [folderId]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat._id);
    }
  }, [activeChat?._id]);

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedChats = await getChats(folderId);
      
      const enrichedChats = fetchedChats.map(chat => ({
        ...chat,
        preview: chat.title.slice(0, 30) + "...",
        messages: [],
        settings: {
          studyMode: mapStudyMode(chat.studyMode),
          constraintMode: "allowed" as const,
        }
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
      
      setChats(chats.map(chat => 
        chat._id === chatId 
          ? { ...chat, messages: fetchedMessages }
          : chat
      ));

      setActiveChat(prev => 
        prev && prev._id === chatId 
          ? { ...prev, messages: fetchedMessages }
          : prev
      );
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch messages");
    }
  };

  const mapStudyMode = (mode?: "simple" | "interview" | "step-by-step"): "simple" | "interview" | "step-by-step" => {
    if (mode === "step-by-step") return "step-by-step";
    return mode || "simple";
  };

  const mapStudyModeToBackend = (mode: "simple" | "interview" | "step-by-step"): "simple" | "interview" | "step-by-step" => {
    if (mode === "step-by-step") return "step-by-step";
    return mode;
  };

  const handleNewChatClick = () => {
    setNewChatSettings({
      studyMode: "simple",
      constraintMode: "allowed",
      document: null,
    });
    setShowNewChatModal(true);
    setShowMobileMenu(false);
  };

  const handleCreateChat = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const newChat = await createChat(folderId, {
        title: "New Chat",
        studyMode: mapStudyModeToBackend(newChatSettings.studyMode),
      });

      const enrichedChat: Chat = {
        ...newChat,
        preview: "Start a conversation...",
        messages: [],
        settings: { ...newChatSettings },
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
      
      setChats(chats.filter(c => c._id !== chatId));
      
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

      const updatedMessages = [...(activeChat.messages || []), tempUserMessage, tempAssistantMessage];
      const updatedChat = {
        ...activeChat,
        messages: updatedMessages,
        preview: messageContent.slice(0, 30) + "...",
        title: (activeChat.messages?.length || 0) === 0 ? messageContent.slice(0, 30) : activeChat.title,
      };

      setActiveChat(updatedChat);
      setChats(chats.map((c) => (c._id === activeChat._id ? updatedChat : c)));
      setIsTyping(true);

      const response = await createMessage(activeChat._id, messageContent);

      const finalMessages = updatedMessages.map(msg => {
        if (msg._id.startsWith('temp-')) {
          if (msg.sender === 'user') {
            return response.userMessage;
          } else {
            return response.assistantMessage;
          }
        }
        return msg;
      });

      const finalChat = {
        ...updatedChat,
        messages: finalMessages,
      };

      setActiveChat(finalChat);
      setChats(chats.map((c) => (c._id === activeChat._id ? finalChat : c)));
      setIsTyping(false);

    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      setIsTyping(false);
      
      if (activeChat) {
        const cleanedMessages = (activeChat.messages || []).filter(msg => !msg._id.startsWith('temp-'));
        const rollbackChat = {
          ...activeChat,
          messages: cleanedMessages,
        };
        setActiveChat(rollbackChat);
        setChats(chats.map((c) => (c._id === activeChat._id ? rollbackChat : c)));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGeneratePDF = () => {
    alert("PDF generation would be triggered here");
    setShowMobileMenu(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File uploaded:", file.name);
      setShowAttachMenu(false);
    }
  };

  const handleModalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewChatSettings({ ...newChatSettings, document: file });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "1d ago";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const studyModes = [
    { value: "simple", label: "Simple", icon: BookOpen, description: "Basic Q&A format" },
    { value: "interview", label: "Interview", icon: Users, description: "Practice interview style" },
    { value: "step-by-step", label: "Step-by-Step", icon: ListOrdered, description: "Guided learning path" },
  ] as const;

  const constraintModes = [
    { value: "allowed", label: "Allowed", icon: Shield, description: "Flexible responses" },
    { value: "strict", label: "Strict", icon: ShieldCheck, description: "Strict topic adherence" },
  ] as const;

  // MOBILE VIEW: Chat List
  if (isMobile && !activeChat) {
    return (
      <div className="h-[calc(100vh-7rem)] flex flex-col bg-background">
        {/* Mobile Header - Chat List */}
        <div className="px-4 py-3 border-b border-border bg-surface-1 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground truncate">{subjectName}</h2>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={handleNewChatClick}
            disabled={isLoading}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-sm shadow-lg z-50 flex items-center gap-2">
            {error}
            <button onClick={() => setError(null)}>Ã—</button>
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-minimal">
          {isLoading && chats.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-5 h-5 animate-spin text-text-muted mr-2" />
              <p className="text-text-muted text-sm">Loading chats...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-center">
              <div>
                <p className="text-text-muted text-sm mb-4">No chats yet</p>
                <Button onClick={handleNewChatClick} disabled={isLoading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Chat
                </Button>
              </div>
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => setActiveChat(chat)}
                className="w-full text-left p-4 border-b border-border hover:bg-surface-hover transition-colors active:bg-surface-2"
              >
                <div className="text-sm font-medium text-foreground truncate">
                  {chat.title}
                </div>
                <div className="text-xs text-text-muted truncate mt-1">
                  {chat.preview || "Start a conversation..."}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-text-muted">
                    {formatTimestamp(chat.updatedAt)}
                  </span>
                  {chat.settings && (
                    <span className="text-xs text-text-secondary capitalize px-1.5 py-0.5 bg-surface-2 rounded-sm">
                      {chat.settings.studyMode}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // MOBILE VIEW: Chat Screen
  if (isMobile && activeChat) {
    return (
      <div className="h-[calc(100vh-7rem)] flex flex-col bg-background">
        {/* Mobile Chat Header */}
        <div className="px-4 py-3 border-b border-border bg-surface-1 flex items-center justify-between">
          <button
            onClick={() => setActiveChat(null)}
            className="flex items-center gap-2 text-foreground hover:text-text-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium truncate flex-1">{activeChat.title}</span>
          </button>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="text-text-secondary hover:text-foreground transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-surface-2 border-b border-border"
            >
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-text-muted mb-2">Study Mode</p>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {activeChat.settings?.studyMode}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-2">Constraint Mode</p>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {activeChat.settings?.constraintMode}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm"
                  onClick={handleGeneratePDF}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate PDF
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-sm shadow-lg z-50 flex items-center gap-2">
            {error}
            <button onClick={() => setError(null)}>Ã—</button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-minimal p-3 space-y-3">
          {(!activeChat.messages || activeChat.messages.length === 0) && !isTyping && (
            <div className="flex items-center justify-center h-full">
              <p className="text-text-muted text-sm">Start a conversation</p>
            </div>
          )}
          {activeChat.messages?.map((message, index) => (
            <motion.div
              key={message._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={cn(
                "flex",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-sm max-w-[85%] break-words",
                  message.sender === "user"
                    ? "bg-surface-2 text-foreground"
                    : "bg-surface-1 text-foreground"
                )}
              >
                <MessageDisplay content={message.content} sender={message.sender} />
                <p className="text-xs text-text-muted mt-1">
                  {formatTimestamp(message.createdAt)}
                </p>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-surface-1 p-3 rounded-sm">
                <div className="flex items-center gap-1">
                  <span className="text-text-muted text-xs">AI is thinking</span>
                  <span className="animate-pulse-subtle text-text-muted">â€¢â€¢â€¢</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-border bg-surface-1 shrink-0">
          <div className="flex items-end gap-2 border border-border rounded-sm p-2">
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
              >
                <Paperclip className="w-4 h-4 text-text-secondary" />
              </Button>
              
              <AnimatePresence>
                {showAttachMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-12 left-0 bg-surface-2 border border-border rounded-sm shadow-lg min-w-[180px] overflow-hidden z-10"
                  >
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-surface-hover transition-colors"
                    >
                      <Upload className="w-4 h-4 text-text-secondary" />
                      Upload Document
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-transparent text-foreground placeholder:text-text-muted resize-none focus:outline-none text-sm py-1"
              style={{ maxHeight: "100px" }}
              disabled={isTyping}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
            >
              <Send className="w-4 h-4 text-text-secondary" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // DESKTOP VIEW
  return (
    <div className="h-[calc(100vh-7rem)] flex">
      {/* Error Display */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-sm shadow-lg z-50 flex items-center gap-2">
          {error}
          <button onClick={() => setError(null)}>Ã—</button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <motion.div
        animate={{ width: sidebarCollapsed ? 0 : 288 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="shrink-0 bg-surface-1 border-r border-border hidden md:flex flex-col overflow-hidden"
      >
        <div className="p-3 border-b border-border space-y-2">
          <p className="text-xs text-text-muted font-medium px-1">{subjectName}</p>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleNewChatClick}
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-minimal">
          {isLoading && chats.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-5 h-5 animate-spin text-text-muted mr-2" />
              <p className="text-text-muted text-sm">Loading chats...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-text-muted text-sm">No chats yet</p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat._id}
                className={cn(
                  "w-full text-left p-3 border-b border-border transition-colors duration-200 group relative",
                  activeChat?._id === chat._id
                    ? "bg-surface-hover"
                    : "hover:bg-surface-hover"
                )}
              >
                <button
                  onClick={() => setActiveChat(chat)}
                  className="w-full text-left"
                >
                  <div className="text-sm font-medium text-foreground truncate pr-8">
                    {chat.title}
                  </div>
                  <div className="text-xs text-text-muted truncate mt-1">
                    {chat.preview || "Start a conversation..."}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-text-muted">
                      {formatTimestamp(chat.updatedAt)}
                    </span>
                    {chat.settings && (
                      <span className="text-xs text-text-secondary capitalize px-1.5 py-0.5 bg-surface-2 rounded-sm">
                        {chat.settings.studyMode}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleArchiveChat(chat._id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-red-500"
                  title="Archive chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="hidden md:flex items-center justify-center w-6 bg-surface-1 border-r border-border hover:bg-surface-hover transition-colors"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4 text-text-secondary" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-text-secondary" />
        )}
      </button>

      {/* Desktop Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {activeChat ? (
          <>
            {/* Desktop Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-1">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-medium text-foreground">{activeChat.title}</h2>
                {activeChat.settings && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary px-2 py-1 bg-surface-2 rounded-sm capitalize">
                      {activeChat.settings.studyMode}
                    </span>
                    <span className="text-xs text-text-secondary px-2 py-1 bg-surface-2 rounded-sm capitalize">
                      {activeChat.settings.constraintMode}
                    </span>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleGeneratePDF}>
                <FileText className="w-4 h-4 mr-2" />
                Generate PDF
              </Button>
            </div>

            {/* Desktop Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-minimal p-4 space-y-4">
              {(!activeChat.messages || activeChat.messages.length === 0) && !isTyping && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-text-muted">Start a conversation</p>
                </div>
              )}
              {activeChat.messages?.map((message, index) => (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={cn(
                    "flex",
                    message.sender === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[70%] p-4 rounded-sm",
                      message.sender === "user"
                        ? "bg-surface-2 text-foreground"
                        : "bg-surface-1 text-foreground"
                    )}
                  >
                    <MessageDisplay content={message.content} sender={message.sender} />
                    <p className="text-xs text-text-muted mt-2">
                      {formatTimestamp(message.createdAt)}
                    </p>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-surface-1 p-4 rounded-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-text-muted text-xs">AI is thinking</span>
                      <span className="animate-pulse-subtle text-text-muted">â€¢â€¢â€¢</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Desktop Input Area */}
            <div className="p-4 border-t border-border bg-surface-1 shrink-0">
              <div className="flex items-end gap-2 border border-border rounded-sm p-2">
                <div className="relative">
                  <Button 
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                  >
                    <Paperclip className="w-4 h-4 text-text-secondary" />
                  </Button>
                  
                  <AnimatePresence>
                    {showAttachMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-12 left-0 bg-surface-2 border border-border rounded-sm shadow-lg min-w-[180px] overflow-hidden z-10"
                      >
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-surface-hover transition-colors"
                        >
                          <Upload className="
w-4 h-4 text-text-secondary" />
                          Upload Document
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleFileUpload}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 bg-transparent text-foreground placeholder:text-text-muted resize-none focus:outline-none text-sm py-1"
                  style={{ maxHeight: "150px" }}
                  disabled={isTyping}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleSend}  
                  disabled={!input.trim() || isTyping}
                >
                  <Send className="w-4 h-4 text-text-secondary" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-text-muted">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;