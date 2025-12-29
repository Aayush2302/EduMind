import { AnimatePresence, motion } from "framer-motion";
import { X, Upload, Plus, Loader2, BookOpen, Users, ListOrdered, Shield, ShieldCheck } from "lucide-react";

interface ChatSettings {
  studyMode: "simple" | "interview" | "step-by-step";
  constraintMode: "allowed" | "strict";
  document?: File | null;
  chatTitle: string;
}

interface NewChatModalProps {
  show: boolean;
  onClose: () => void;
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
  onCreateChat: () => void;
  isLoading: boolean;
  modalFileInputRef: React.RefObject<HTMLInputElement>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const studyModes = [
  { value: "simple" as const, label: "Simple", icon: BookOpen, description: "Basic Q&A format" },
  { value: "interview" as const, label: "Interview", icon: Users, description: "Practice interview style" },
  { value: "step-by-step" as const, label: "Step-by-Step", icon: ListOrdered, description: "Guided learning path" },
];

const constraintModes = [
  { value: "allowed" as const, label: "Allowed", icon: Shield, description: "Flexible responses" },
  { value: "strict" as const, label: "Strict", icon: ShieldCheck, description: "Strict topic adherence" },
];

export const NewChatModal = ({
  show,
  onClose,
  settings,
  onSettingsChange,
  onCreateChat,
  isLoading,
  modalFileInputRef,
  onFileUpload,
}: NewChatModalProps) => {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-surface-1 border border-border rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Create New Chat</h3>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Chat Name Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Chat Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.chatTitle}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, chatTitle: e.target.value })
                  }
                  placeholder="e.g., Chapter 5 Discussion, Math Homework Help"
                  className="w-full px-3 py-2 bg-background border border-border rounded-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  autoFocus
                />
                <p className="text-xs text-text-muted mt-1">
                  Give your chat a descriptive name
                </p>
              </div>

              {/* Study Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Study Mode
                </label>
                <div className="space-y-2">
                  {studyModes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.value}
                        onClick={() =>
                          onSettingsChange({
                            ...settings,
                            studyMode: mode.value,
                          })
                        }
                        className={`w-full flex items-start gap-3 p-3 rounded-sm border transition-colors ${
                          settings.studyMode === mode.value
                            ? "border-foreground bg-surface-2"
                            : "border-border hover:border-text-muted"
                        }`}
                      >
                        <Icon className="w-5 h-5 text-text-secondary mt-0.5 shrink-0" />
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium text-foreground">{mode.label}</p>
                          <p className="text-xs text-text-muted">{mode.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Constraint Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Constraint Mode
                </label>
                <div className="space-y-2">
                  {constraintModes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.value}
                        onClick={() =>
                          onSettingsChange({
                            ...settings,
                            constraintMode: mode.value,
                          })
                        }
                        className={`w-full flex items-start gap-3 p-3 rounded-sm border transition-colors ${
                          settings.constraintMode === mode.value
                            ? "border-foreground bg-surface-2"
                            : "border-border hover:border-text-muted"
                        }`}
                      >
                        <Icon className="w-5 h-5 text-text-secondary mt-0.5 shrink-0" />
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium text-foreground">{mode.label}</p>
                          <p className="text-xs text-text-muted">{mode.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Document Upload (Optional) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Upload Document (Optional)
                </label>
                <button
                  onClick={() => modalFileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-border rounded-sm hover:border-text-muted transition-colors"
                >
                  <Upload className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm text-text-secondary">
                    {settings.document
                      ? settings.document.name
                      : "Click to upload"}
                  </span>
                </button>
                <input
                  ref={modalFileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={onFileUpload}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 border border-border rounded-sm text-foreground hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onCreateChat}
                disabled={isLoading || !settings.chatTitle.trim()}
                className="px-4 py-2 bg-foreground text-background rounded-sm hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Chat
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}