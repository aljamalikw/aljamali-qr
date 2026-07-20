"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ResetConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResetConfirmModal({
  open,
  onConfirm,
  onCancel,
}: ResetConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-gold/15 bg-surface-elevated p-6 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10 text-xl text-gold">
              ↺
            </div>
            <h2
              id="reset-modal-title"
              className="mt-5 text-center font-serif text-xl font-bold text-white"
            >
              Discard unsaved changes?
            </h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-white/50">
              Your edits will be reverted to the last saved version. This action
              cannot be undone.
            </p>
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCancel}
                className="menu-btn-secondary flex-1"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="menu-btn-primary flex-1"
              >
                Discard Changes
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
