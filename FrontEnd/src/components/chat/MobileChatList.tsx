import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface MobileChatListProps {
  chats: Chat[];
  onChatSelect: (chat: Chat) => void;
  onNewChat: () => void;
  isLoading: boolean;
  showNewChatButton: boolean;
  headerTitle: string;
}

export const MobileChatList = ({
  chats,
  onChatSelect,
  onNewChat,
  isLoading,
  showNewChatButton,
  headerTitle,
}: MobileChatListProps) => {
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
    <div className="h-[calc(100vh-7rem)] flex flex-col bg-background">
      {/* Mobile Header - Chat List */}
      <div className="px-4 py-3 border-b border-border bg-surface-1 flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground truncate">
          {headerTitle}
        </h2>
        {showNewChatButton && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onNewChat}
            disabled={isLoading}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

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
              {showNewChatButton && (
                <Button onClick={onNewChat} disabled={isLoading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Chat
                </Button>
              )}
            </div>
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat._id}
              onClick={() => onChatSelect(chat)}
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
};