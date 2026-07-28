"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface RenameQrModalProps {
  open: boolean;
  currentName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function RenameQrModal({
  open,
  currentName,
  onConfirm,
  onCancel,
}: RenameQrModalProps) {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onConfirm(name.trim());
  };

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
            aria-labelledby="rename-qr-title"
          >
            <h2
              id="rename-qr-title"
              className="font-serif text-xl font-bold text-white"
            >
              Rename QR Code
            </h2>
            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15"
                autoFocus
              />
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button type="button" onClick={onCancel} className="menu-btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="menu-btn-primary flex-1">
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
