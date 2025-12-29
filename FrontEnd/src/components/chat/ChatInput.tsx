import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Paperclip, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  maxHeight?: string;
}

export const ChatInput = ({
  value,
  onChange,
  onSend,
  onFileUpload,
  disabled,
  fileInputRef,
  textareaRef,
  maxHeight = "150px",
}: ChatInputProps) => {
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
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
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
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
                onChange={onFileUpload}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        className="flex-1 bg-transparent text-foreground placeholder:text-text-muted resize-none focus:outline-none text-sm py-1"
        style={{ maxHeight }}
        disabled={disabled}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onSend}
        disabled={!value.trim() || disabled}
      >
        <Send className="w-4 h-4 text-text-secondary" />
      </Button>
    </div>
  );
};