import { motion } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Chat {
  _id: string;
  title: string;
  preview?: string;
  updatedAt: string;
  settings?: {
    studyMode: string;
    constraintMode: string;
  };
}

interface ChatListProps {
  chats: Chat[];
  activeChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
  onNewChat: () => void;
  onArchiveChat: (chatId: string) => void;
  isLoading: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  showNewChatButton: boolean;
  headerTitle: string;
}

export const ChatList = ({
  chats,
  activeChat,
  onChatSelect,
  onNewChat,
  onArchiveChat,
  isLoading,
  collapsed,
  onToggleCollapse,
  showNewChatButton,
  headerTitle,
}: ChatListProps) => {
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
    <>
      <motion.div
        animate={{ width: collapsed ? 0 : 288 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="shrink-0 bg-surface-1 border-r border-border hidden md:flex flex-col overflow-hidden"
      >
        <div className="p-3 border-b border-border space-y-2">
          <p className="text-xs text-text-muted font-medium px-1">{headerTitle}</p>
          {showNewChatButton && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onNewChat}
              disabled={isLoading}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          )}
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
                  onClick={() => onChatSelect(chat)}
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
                  onClick={() => onArchiveChat(chat._id)}
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
        onClick={onToggleCollapse}
        className="hidden md:flex items-center justify-center w-6 bg-surface-1 border-r border-border hover:bg-surface-hover transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-text-secondary" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-text-secondary" />
        )}
      </button>
    </>
  );
};