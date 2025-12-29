import { motion } from "framer-motion";

export const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-start"
    >
      <div className="bg-surface-1 p-3 md:p-4 rounded-sm">
        <div className="flex items-center gap-1">
          <span className="text-text-muted text-xs">AI is thinking</span>
          <span className="animate-pulse-subtle text-text-muted">•••</span>
        </div>
      </div>
    </motion.div>
  );
};