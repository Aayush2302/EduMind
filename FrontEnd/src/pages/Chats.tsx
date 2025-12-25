// This continues from the New Chat Modal in the previous artifact
// Place this inside the modal section:
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
  MoreVertical,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

interface ChatSettings {
  studyMode: "simple" | "interview" | "step-by-step";
  constraintMode: "allowed" | "strict";
  document?: File | null;
}

interface Chat {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  messages: Message[];
  settings?: ChatSettings;
  subjectId?: string;
}

interface Subject {
  id: string;
  name: string;
}

const mockSubjects: Subject[] = [
  { id: "1", name: "Data Structures & Algorithms" },
  { id: "2", name: "Machine Learning" },
  { id: "3", name: "Web Development" },
];

const initialChats: Chat[] = [
  {
    id: "1",
    title: "Binary Trees Basics",
    preview: "Explain the difference between...",
    timestamp: "2h ago",
    subjectId: "1",
    settings: { studyMode: "simple", constraintMode: "allowed" },
    messages: [
      {
        id: "1",
        role: "user",
        content: "What is a binary tree and how does it differ from a regular tree?",
        timestamp: "2:30 PM",
      },
      {
        id: "2",
        role: "ai",
        content:
          "A binary tree is a hierarchical data structure where each node has at most two children, referred to as the left child and right child. This differs from a general tree where nodes can have any number of children.\n\nKey characteristics of binary trees:\n• Maximum of 2 children per node\n• Left and right children are distinct\n• Commonly used in search operations and expression parsing",
        timestamp: "2:30 PM",
      },
    ],
  },
  {
    id: "2",
    title: "Sorting Algorithms",
    preview: "Compare quicksort and mergesort...",
    timestamp: "1d ago",
    subjectId: "1",
    settings: { studyMode: "interview", constraintMode: "strict" },
    messages: [],
  },
  {
    id: "3",
    title: "Neural Networks Intro",
    preview: "What are activation functions...",
    timestamp: "3d ago",
    subjectId: "2",
    settings: { studyMode: "step-by-step", constraintMode: "allowed" },
    messages: [],
  },
];

const Chats = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subjectId = searchParams.get("subject");
  
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mobileView, setMobileView] = useState<"subjects" | "chats" | "chat">("subjects");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [newChatSettings, setNewChatSettings] = useState<ChatSettings>({
    studyMode: "simple",
    constraintMode: "allowed",
    document: null,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Filter chats by subject
  const filteredChats = subjectId 
    ? chats.filter(chat => chat.subjectId === subjectId)
    : chats;

  // Get current subject
  const currentSubject = mockSubjects.find(s => s.id === subjectId);

  useEffect(() => {
    if (subjectId) {
      const subject = mockSubjects.find(s => s.id === subjectId);
      setSelectedSubject(subject || null);
      setMobileView("chats");
    }
  }, [subjectId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  const handleNewChatClick = () => {
    setNewChatSettings({
      studyMode: "simple",
      constraintMode: "allowed",
      document: null,
    });
    setShowNewChatModal(true);
  };

  const handleCreateChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      preview: "Start a conversation...",
      timestamp: "Just now",
      messages: [],
      subjectId: subjectId || undefined,
      settings: { ...newChatSettings },
    };
    setChats([newChat, ...chats]);
    setActiveChat(newChat);
    setShowNewChatModal(false);
    setMobileView("chat");
  };

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
    setMobileView("chat");
  };

  const handleSend = async () => {
    if (!input.trim() || !activeChat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updatedChat = {
      ...activeChat,
      messages: [...activeChat.messages, userMessage],
      preview: input.slice(0, 30) + "...",
      title: activeChat.messages.length === 0 ? input.slice(0, 30) : activeChat.title,
    };

    setActiveChat(updatedChat);
    setChats(chats.map((c) => (c.id === activeChat.id ? updatedChat : c)));
    setInput("");
    setIsTyping(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "ai",
      content:
        "This is a simulated AI response. In a real implementation, this would connect to an AI service to provide intelligent answers based on your learning context and uploaded documents.",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const finalChat = {
      ...updatedChat,
      messages: [...updatedChat.messages, aiMessage],
    };

    setActiveChat(finalChat);
    setChats(chats.map((c) => (c.id === activeChat.id ? finalChat : c)));
    setIsTyping(false);
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

  const studyModes = [
    { value: "simple", label: "Simple", icon: BookOpen, description: "Basic Q&A format" },
    { value: "interview", label: "Interview", icon: Users, description: "Practice interview style" },
    { value: "step-by-step", label: "Step-by-Step", icon: ListOrdered, description: "Guided learning path" },
  ] as const;

  const constraintModes = [
    { value: "allowed", label: "Allowed", icon: Shield, description: "Flexible responses" },
    { value: "strict", label: "Strict", icon: ShieldCheck, description: "Strict topic adherence" },
  ] as const;

  // Mobile View: Subject Selection
  const MobileSubjectView = () => (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-medium text-foreground">Select a Subject</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {mockSubjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => {
              setSelectedSubject(subject);
              navigate(`/chats?subject=${subject.id}`);
            }}
            className="w-full p-4 bg-surface-1 border border-border rounded-sm text-left hover:bg-surface-hover transition-colors"
          >
            <h3 className="text-sm font-medium text-foreground">{subject.name}</h3>
          </button>
        ))}
      </div>
    </div>
  );

  // Mobile View: Chat List
  const MobileChatListView = () => (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <button onClick={() => setMobileView("subjects")}>
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <h2 className="text-lg font-medium text-foreground flex-1 truncate">
          {selectedSubject?.name}
        </h2>
        <Button variant="outline" size="sm" onClick={handleNewChatClick}>
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-text-muted mb-4">No chats yet</p>
              <Button variant="outline" onClick={handleNewChatClick}>
                Create your first chat
              </Button>
            </div>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className="w-full text-left p-4 border-b border-border hover:bg-surface-hover transition-colors"
            >
              <div className="text-sm font-medium text-foreground truncate">
                {chat.title}
              </div>
              <div className="text-xs text-text-muted truncate mt-1">
                {chat.preview}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-text-muted">{chat.timestamp}</span>
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

  return (
    <div className="h-[calc(100vh-7rem)] flex">
      {/* Desktop: Collapsible Chat List */}
      <motion.div
        animate={{ width: sidebarCollapsed ? 0 : 288 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="shrink-0 bg-surface-1 border-r border-border hidden md:flex flex-col overflow-hidden"
      >
        {/* Desktop: Subject Name (only visible on desktop) */}
        {currentSubject && (
          <div className="px-3 pt-3 pb-2">
            <div className="text-xs font-medium text-text-muted uppercase tracking-wide">
              {currentSubject.name}
            </div>
          </div>
        )}
        
        <div className="p-3 border-b border-border flex items-center gap-2">
          <Button variant="outline" className="flex-1" onClick={handleNewChatClick}>
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-minimal">
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={cn(
                "w-full text-left p-3 border-b border-border transition-colors duration-200",
                activeChat?.id === chat.id
                  ? "bg-surface-hover"
                  : "hover:bg-surface-hover"
              )}
            >
              <div className="text-sm font-medium text-foreground truncate">
                {chat.title}
              </div>
              <div className="text-xs text-text-muted truncate mt-1">
                {chat.preview}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-text-muted">{chat.timestamp}</span>
                {chat.settings && (
                  <span className="text-xs text-text-secondary capitalize px-1.5 py-0.5 bg-surface-2 rounded-sm">
                    {chat.settings.studyMode}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Desktop: Sidebar Toggle */}
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

      {/* Mobile Views */}
      <div className="flex-1 md:hidden">
        {mobileView === "subjects" && <MobileSubjectView />}
        {mobileView === "chats" && <MobileChatListView />}
        {mobileView === "chat" && activeChat && (
          <div className="flex-1 flex flex-col bg-background h-full">
            {/* Mobile Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-1">
              <button onClick={() => setMobileView("chats")} className="mr-2">
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </button>
              <h2 className="text-sm font-medium text-foreground flex-1 truncate">
                {activeChat.title}
              </h2>
              <button onClick={() => setShowMobileMenu(!showMobileMenu)}>
                <MoreVertical className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
              {showMobileMenu && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-surface-1 border-b border-border overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    {activeChat.settings && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-secondary">Study Mode:</span>
                          <span className="text-sm text-foreground capitalize">
                            {activeChat.settings.studyMode}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-secondary">Constraint Mode:</span>
                          <span className="text-sm text-foreground capitalize">
                            {activeChat.settings.constraintMode}
                          </span>
                        </div>
                      </>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={handleGeneratePDF}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Generate PDF
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-minimal">
              {activeChat.messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-text-muted">Start a conversation</p>
                </div>
              )}
              {activeChat.messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] p-4 rounded-sm",
                      message.role === "user"
                        ? "bg-gray-700 text-white"
                        : "bg-gray-200 text-gray-900"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={cn(
                      "text-xs mt-2",
                      message.role === "user" ? "text-gray-300" : "text-gray-600"
                    )}>
                      {message.timestamp}
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
                  <div className="bg-gray-200 p-4 rounded-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 text-sm">AI is thinking</span>
                      <span className="animate-pulse text-gray-600">•••</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-surface-1">
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
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full bg-transparent text-foreground placeholder:text-text-muted resize-none focus:outline-none text-sm py-1"
                    style={{ maxHeight: "120px" }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSend}
                  disabled={!input.trim()}
                >
                  <Send className="w-4 h-4 text-text-secondary" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Active Chat */}
      <div className="flex-1 hidden md:flex flex-col bg-background">
        {activeChat ? (
          <>
            {/* Desktop Chat Header */}
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-minimal">
              {activeChat.messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-text-muted">Start a conversation</p>
                </div>
              )}
              {activeChat.messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] p-4 rounded-sm",
                      message.role === "user"
                        ? "bg-gray-700 text-white"
                        : "bg-gray-200 text-gray-900"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={cn(
                      "text-xs mt-2",
                      message.role === "user" ? "text-gray-300" : "text-gray-600"
                    )}>
                      {message.timestamp}
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
                  <div className="bg-gray-200 p-4 rounded-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 text-sm">AI is thinking</span>
                      <span className="animate-pulse text-gray-600">•••</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-surface-1">
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
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full bg-transparent text-foreground placeholder:text-text-muted resize-none focus:outline-none text-sm py-1"
                    style={{ maxHeight: "120px" }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSend}
                  disabled={!input.trim()}
                >
                  <Send className="w-4 h-4 text-text-secondary" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-text-muted">Select a chat to start</p>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewChatModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-1 border border-border rounded-sm w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-medium text-foreground">New Chat</h2>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="text-text-secondary hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* Study Mode Selection */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Study Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {studyModes.map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => setNewChatSettings({ ...newChatSettings, studyMode: mode.value })}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-sm border transition-all duration-200",
                          newChatSettings.studyMode === mode.value
                            ? "border-foreground bg-surface-2"
                            : "border-border hover:bg-surface-hover"
                        )}
                      >
                        <mode.icon className="w-5 h-5 text-text-secondary" />
                        <span className="text-xs font-medium text-foreground">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    {studyModes.find(m => m.value === newChatSettings.studyMode)?.description}
                  </p>
                </div>

                {/* Document Upload */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Share Document (Optional)
                  </label>
                  <div
                    onClick={() => modalFileInputRef.current?.click()}
                    className="border border-dashed border-border rounded-sm p-4 text-center hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    {newChatSettings.document ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5 text-text-secondary" />
                        <span className="text-sm text-foreground">{newChatSettings.document.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewChatSettings({ ...newChatSettings, document: null });
                          }}
                          className="ml-2 text-text-muted hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-text-secondary mx-auto mb-2" />
                        <p className="text-sm text-text-secondary">Click to upload document</p>
                        <p className="text-xs text-text-muted mt-1">PDF, DOC, DOCX, TXT</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleModalFileUpload}
                  />
                </div>

                {/* Constraint Mode */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Constraint Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {constraintModes.map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => setNewChatSettings({ ...newChatSettings, constraintMode: mode.value })}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-sm border transition-all duration-200",
                          newChatSettings.constraintMode === mode.value
                            ? "border-foreground bg-surface-2"
                            : "border-border hover:bg-surface-hover"
                        )}
                      >
                        <mode.icon className="w-5 h-5 text-text-secondary" />
                        <div className="text-left">
                          <span className="text-sm font-medium text-foreground block">{mode.label}</span>
                          <span className="text-xs text-text-muted">{mode.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-4 border-t border-border">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowNewChatModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleCreateChat}
                >
                  Start Chat
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chats;