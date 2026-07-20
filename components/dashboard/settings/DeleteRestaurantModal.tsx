"use client";

import { AnimatePresence, motion } from "framer-motion";

interface DeleteRestaurantModalProps {
  open: boolean;
  restaurantName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteRestaurantModal({
  open,
  restaurantName,
  onConfirm,
  onCancel,
}: DeleteRestaurantModalProps) {
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
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-red-500/20 bg-surface-elevated p-6 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-2xl">
              ⚠️
            </div>
            <h2
              id="delete-modal-title"
              className="mt-5 text-center font-serif text-xl font-bold text-white"
            >
              Delete restaurant?
            </h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-white/50">
              This will permanently delete{" "}
              <span className="font-medium text-white">{restaurantName}</span>{" "}
              and all associated menu data. This action cannot be undone.
            </p>
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCancel}
                className="menu-btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="menu-btn-danger flex-1"
              >
                Delete Restaurant
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
