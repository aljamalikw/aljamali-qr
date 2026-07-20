"use client";

import { AnimatePresence, motion } from "framer-motion";

interface QrToastProps {
  message: string;
  visible: boolean;
}

export function QrToast({ message, visible }: QrToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 end-4 z-50 flex items-center gap-2.5 rounded-xl border border-gold/20 bg-surface-elevated/95 px-3.5 py-2.5 shadow-lg backdrop-blur-sm sm:end-6"
          role="status"
          aria-live="polite"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs text-gold">
            ✓
          </span>
          <p className="text-xs font-medium text-white sm:text-sm">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
