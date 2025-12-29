import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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

interface ChatMessageProps {
  message: Message;
  index: number;
}

export const ChatMessage = ({ message, index }: ChatMessageProps) => {
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

  return (
    <motion.div
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
          "p-3 rounded-sm break-words",
          message.sender === "user"
            ? "bg-surface-2 text-foreground max-w-[85%] md:max-w-[70%]"
            : "bg-surface-1 text-foreground max-w-[85%] md:max-w-[70%]"
        )}
      >
        <MessageDisplay content={message.content} sender={message.sender} />
        <p className="text-xs text-text-muted mt-1 md:mt-2">
          {formatTimestamp(message.createdAt)}
        </p>
      </div>
    </motion.div>
  );
};