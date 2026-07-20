"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { DashboardMenuItem } from "@/lib/dashboard/menu/types";
import { MenuIcon } from "./icons/MenuIcons";

interface DeleteConfirmModalProps {
  item: DashboardMenuItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  item,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-gold/15 bg-surface-elevated p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-400">
              <MenuIcon name="warning" className="h-7 w-7" />
            </div>

            <h2
              id="delete-modal-title"
              className="mt-5 text-center font-serif text-xl font-bold text-white"
            >
              Delete menu item?
            </h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-white/50">
              Are you sure you want to delete{" "}
              <span className="font-medium text-white">{item.name.en}</span>? This
              action cannot be undone.
            </p>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={onCancel} className="menu-btn-secondary flex-1">
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="menu-btn-danger flex-1"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
