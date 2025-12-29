import { motion } from "framer-motion";
import { User, Bot } from "lucide-react";
import { useEffect, useState } from "react";
import MessageDisplay from "@/components/chat/MessageDisplay";
import { cn } from "@/lib/utils";

interface Message {
  _id: string;
  chatId: string;
  sender: "user" | "assistant";
  content: string;
  status: "completed" | "processing" | "failed"; // ← ADD "failed" HERE
  parentMessageId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessageProps {
  message: Message;
  index: number;
}

export const ChatMessage = ({ message, index }: ChatMessageProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const isUser = message.sender === "user";
  const isFailed = message.status === "failed";

  // Mobile layout - user left with limited width, assistant full width
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
        className="flex gap-2 items-start"
      >
        {/* Avatar */}
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
            isUser ? "bg-blue-600" : isFailed ? "bg-red-600" : "bg-purple-600"
          )}
        >
          {isUser ? (
            <User className="w-3.5 h-3.5 text-white" />
          ) : (
            <Bot className="w-3.5 h-3.5 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className={cn("flex-1", isUser ? "max-w-[calc(100%-2.5rem)]" : "w-full")}>
          <div
            className={cn(
              "rounded-sm p-3",
              isUser
                ? "bg-surface-2 text-foreground max-w-[85%]"
                : isFailed
                ? "bg-red-50 text-red-900 border border-red-200 w-full"
                : "bg-surface-1 text-foreground border border-border w-full"
            )}
          >
            <div className="overflow-hidden break-words">
              <MessageDisplay content={message.content} sender={message.sender} />
            </div>
          </div>
          <p className="text-xs text-text-muted mt-1 px-1">
            {formatTimestamp(message.createdAt)}
          </p>
        </div>
      </motion.div>
    );
  }

  // Desktop layout - user right, assistant left
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {/* Avatar (left side for assistant) */}
      {!isUser && (
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isFailed ? "bg-red-600" : "bg-purple-600"
        )}>
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Message Content */}
      <div className="max-w-[70%]">
        <div
          className={cn(
            "p-3 rounded-sm",
            isUser
              ? "bg-surface-2 text-foreground"
              : isFailed
              ? "bg-red-50 text-red-900 border border-red-200"
              : "bg-surface-1 text-foreground"
          )}
        >
          <div className="break-words">
            <MessageDisplay content={message.content} sender={message.sender} />
          </div>
        </div>
        <p className={cn("text-xs text-text-muted mt-1 md:mt-2", isUser ? "text-right" : "text-left")}>
          {formatTimestamp(message.createdAt)}
        </p>
      </div>

      {/* Avatar (right side for user) */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
};