import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, MoreVertical, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col bg-background">
      {/* Mobile Chat Header */}
      <div className="px-4 py-3 border-b border-border bg-surface-1 flex items-center justify-between">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-minimal p-3 space-y-3">
        {(!chat.messages || chat.messages.length === 0) && !isTyping && (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-muted text-sm">Start a conversation</p>
          </div>
        )}
        {chat.messages?.map((message, index) => (
          <ChatMessage key={message._id} message={message} index={index} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-border bg-surface-1 shrink-0">
        <ChatInput
          value={input}
          onChange={onInputChange}
          onSend={onSend}
          onFileUpload={onFileUpload}
          disabled={isTyping}
          fileInputRef={fileInputRef}
          textareaRef={textareaRef}
          maxHeight="100px"
        />
      </div>
    </div>
  );
};