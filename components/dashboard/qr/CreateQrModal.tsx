"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { qrTypes } from "@/lib/dashboard/qr/seed-data";
import type { QrCreateFormData, QrType } from "@/lib/dashboard/qr/types";
import {
  buildQrDestinationUrl,
  createEmptyQrForm,
  getAppBaseUrl,
  validateQrForm,
} from "@/lib/dashboard/qr/utils";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { QrPreview } from "./QrPreview";
import { QrIcon } from "./icons/QrIcons";

interface CreateQrModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (data: QrCreateFormData) => void;
}

const inputClass =
  "w-full rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

export function CreateQrModal({ open, onClose, onGenerate }: CreateQrModalProps) {
  const { restaurant } = useRestaurant();
  const [form, setForm] = useState<QrCreateFormData>(createEmptyQrForm());
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(createEmptyQrForm());
      setError(null);
      setPreviewUrl(null);
    }
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const update = <K extends keyof QrCreateFormData>(key: K, value: QrCreateFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleGenerate = () => {
    const err = validateQrForm(form);
    if (err) {
      setError(err);
      return;
    }
    const url = buildQrDestinationUrl(restaurant?.slug, getAppBaseUrl());
    setPreviewUrl(url || null);
    onGenerate(form);
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
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[90vh] max-w-lg -translate-y-1/2 overflow-y-auto rounded-2xl border border-gold/15 bg-surface-elevated p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-qr-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="create-qr-title" className="font-serif text-xl font-bold text-white">
                  Create QR Code
                </h2>
                <p className="mt-1 text-sm text-white/45">
                  Generate a new scannable code for your restaurant
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <QrIcon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                  QR Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Table 15"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                  QR Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => update("type", e.target.value as QrType)}
                  className={inputClass}
                >
                  {qrTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                  Table Number
                </label>
                <input
                  type="text"
                  value={form.tableNumber}
                  onChange={(e) => update("tableNumber", e.target.value)}
                  placeholder="Optional — e.g. 15"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={2}
                  placeholder="Optional notes..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => update("status", e.target.value as "active" | "inactive")}
                  className={inputClass}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {previewUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center rounded-xl border border-gold/20 bg-black/30 p-5"
                >
                  <p className="mb-3 text-xs uppercase tracking-wider text-gold">Preview</p>
                  <QrPreview value={previewUrl} size={120} className="border border-gold/10 p-2" />
                </motion.div>
              )}

              {error && (
                <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
              <button type="button" onClick={onClose} className="menu-btn-secondary flex-1">
                Cancel
              </button>
              <button type="button" onClick={handleGenerate} className="menu-btn-primary flex-1">
                Generate
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { createEmptyQrForm };
