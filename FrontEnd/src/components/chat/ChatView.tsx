import { useRef, useEffect } from "react";
import { FileText } from "lucide-react";
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

interface ChatViewProps {
  chat: Chat | null;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onGeneratePDF: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isTyping: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  isMobile?: boolean;
}

export const ChatView = ({
  chat,
  input,
  onInputChange,
  onSend,
  onGeneratePDF,
  onFileUpload,
  isTyping,
  fileInputRef,
  textareaRef,
  isMobile = false,
}: ChatViewProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-muted">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-1">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-foreground">{chat.title}</h2>
          {chat.settings && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary px-2 py-1 bg-surface-2 rounded-sm capitalize">
                {chat.settings.studyMode}
              </span>
              <span className="text-xs text-text-secondary px-2 py-1 bg-surface-2 rounded-sm capitalize">
                {chat.settings.constraintMode}
              </span>
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onGeneratePDF}>
          <FileText className="w-4 h-4 mr-2" />
          Generate PDF
        </Button>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto scrollbar-minimal ${isMobile ? 'p-3 space-y-3' : 'p-4 space-y-4'}`}>
        {(!chat.messages || chat.messages.length === 0) && !isTyping && (
          <div className="flex items-center justify-center h-full">
            <p className={`text-text-muted ${isMobile ? 'text-sm' : ''}`}>
              Start a conversation
            </p>
          </div>
        )}
        {chat.messages?.map((message, index) => (
          <ChatMessage key={message._id} message={message} index={index} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`border-t border-border bg-surface-1 shrink-0 ${isMobile ? 'p-3' : 'p-4'}`}>
        <ChatInput
          value={input}
          onChange={onInputChange}
          onSend={onSend}
          onFileUpload={onFileUpload}
          disabled={isTyping}
          fileInputRef={fileInputRef}
          textareaRef={textareaRef}
          maxHeight={isMobile ? "100px" : "150px"}
        />
      </div>
    </>
  );
};