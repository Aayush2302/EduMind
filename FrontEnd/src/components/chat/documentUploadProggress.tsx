import { AnimatePresence, motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle, FileText } from "lucide-react";

interface DocumentUploadProgressProps {
  show: boolean;
  fileName: string;
  status: "uploading" | "processing" | "processed" | "failed";
  pageCount?: number;
  onClose: () => void;
}

export const DocumentUploadProgress = ({
  show,
  fileName,
  status,
  pageCount,
  onClose,
}: DocumentUploadProgressProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "uploading":
        return {
          icon: Loader2,
          iconClass: "animate-spin text-blue-500",
          title: "Uploading Document",
          message: "Uploading file to server...",
          showClose: false,
        };
      case "processing":
        return {
          icon: Loader2,
          iconClass: "animate-spin text-blue-500",
          title: "Processing Document",
          message: pageCount
            ? `Generating embeddings... (${pageCount} pages processed)`
            : "Extracting text and generating embeddings...",
          showClose: false,
        };
      case "processed":
        return {
          icon: CheckCircle,
          iconClass: "text-green-500",
          title: "Document Ready!",
          message: `Successfully processed ${pageCount || 0} pages. You can now ask questions about this document.`,
          showClose: true,
        };
      case "failed":
        return {
          icon: XCircle,
          iconClass: "text-red-500",
          title: "Processing Failed",
          message: "Failed to process document. Please try again.",
          showClose: true,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={config.showClose ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-surface-1 border border-border rounded-lg shadow-xl w-full max-w-md p-6"
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <Icon className={`w-16 h-16 ${config.iconClass}`} />
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-foreground text-center mb-2">
              {config.title}
            </h3>

            {/* File Name */}
            <div className="flex items-center justify-center gap-2 text-sm text-text-muted mb-4">
              <FileText className="w-4 h-4" />
              <span className="truncate max-w-xs">{fileName}</span>
            </div>

            {/* Message */}
            <p className="text-sm text-text-secondary text-center mb-6">
              {config.message}
            </p>

            {/* Progress Bar (for processing) */}
            {status === "processing" && (
              <div className="w-full bg-surface-2 rounded-full h-2 mb-6 overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: 30,
                    ease: "linear",
                    repeat: Infinity,
                  }}
                />
              </div>
            )}

            {/* Close Button (only when processing is complete) */}
            {config.showClose && (
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-foreground text-background rounded-sm hover:bg-foreground/90 transition-colors"
              >
                {status === "processed" ? "Start Chatting" : "Close"}
              </button>
            )}

            {/* Info Text */}
            {status === "processing" && (
              <p className="text-xs text-text-muted text-center mt-4">
                This may take 1-2 minutes depending on document size
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};