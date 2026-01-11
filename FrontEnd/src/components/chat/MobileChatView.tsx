import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, MoreVertical, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

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

interface Chat {
  _id: string;
  title: string;
  messages?: Message[];
  settings?: {
    studyMode: string;
    constraintMode: string;
  };
}

interface MobileChatViewProps {
  chat: Chat;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onBack: () => void;
  onGeneratePDF: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isTyping: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const MobileChatView = ({
  chat,
  input,
  onInputChange,
  onSend,
  onBack,
  onGeneratePDF,
  onFileUpload,
  isTyping,
  fileInputRef,
  textareaRef,
}: MobileChatViewProps) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  useEffect(() => {
    // Always scroll to bottom when messages change
    scrollToBottom("auto");
  }, [chat.messages]);

  useEffect(() => {
    // Check scroll position on mount and when chat changes
    handleScroll();
  }, [chat._id]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Check initial scroll position
      handleScroll();
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [chat._id]);

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col bg-background overflow-hidden">
      {/* Mobile Chat Header - Fixed */}
      <div className="px-4 py-3 border-b border-border bg-surface-1 flex items-center justify-between shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-foreground hover:text-text-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium truncate flex-1">{chat.title}</span>
        </button>
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="text-text-secondary hover:text-foreground transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Menu Dropdown - Fixed */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-surface-2 border-b border-border shrink-0"
          >
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-text-muted mb-2">Study Mode</p>
                <p className="text-sm font-medium text-foreground capitalize">
                  {chat.settings?.studyMode}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-2">Constraint Mode</p>
                <p className="text-sm font-medium text-foreground capitalize">
                  {chat.settings?.constraintMode}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start text-sm"
                onClick={() => {
                  onGeneratePDF();
                  setShowMobileMenu(false);
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate PDF
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages with scroll button - Scrollable */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={messagesContainerRef}
          className="h-full overflow-y-auto scrollbar-minimal p-3 space-y-3"
        >
          {(!chat.messages || chat.messages.length === 0) && !isTyping && (
            <div className="flex items-center justify-center h-full">
              <p className="text-text-muted text-sm">Start a conversation</p>
            </div>
          )}
          {chat.messages?.map((message, index) => (
            <ChatMessage key={message._id} message={message} index={index} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scrollToBottom()}
              className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-surface-2 border border-border shadow-lg flex items-center justify-center hover:bg-surface-hover transition-colors z-10"
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="w-5 h-5 text-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area - Fixed */}
      <div className="p-3 border-t border-border bg-surface-1 shrink-0">
        <ChatInput
          value={input}
          onChange={onInputChange}
          onSend={onSend}
          onFileUpload={onFileUpload}
          disabled={isTyping}
          fileInputRef={fileInputRef}
          textareaRef={textareaRef}
          maxHeight="150px"
        />
      </div>
    </div>
  );
};