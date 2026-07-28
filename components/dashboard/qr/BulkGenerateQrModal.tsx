"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { qrTypes } from "@/lib/dashboard/qr/seed-data";
import type { BulkQrGenerateFormData, QrMode, QrType } from "@/lib/dashboard/qr/types";
import { parseTableNumberRanges } from "@/lib/dashboard/qr/utils";
import { QrIcon } from "./icons/QrIcons";

interface BulkGenerateQrModalProps {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onGenerate: (form: BulkQrGenerateFormData) => void | Promise<void>;
}

const inputClass =
  "w-full rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

function createEmptyBulkForm(): BulkQrGenerateFormData {
  return { tableNumbers: "", area: "", type: "restaurant-table", mode: "dynamic" };
}

export function BulkGenerateQrModal({ open, saving, onClose, onGenerate }: BulkGenerateQrModalProps) {
  const [form, setForm] = useState<BulkQrGenerateFormData>(createEmptyBulkForm());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(createEmptyBulkForm());
      setError(null);
    }
  }, [open]);

  const preview = parseTableNumberRanges(form.tableNumbers);

  const update = <K extends keyof BulkQrGenerateFormData>(key: K, value: BulkQrGenerateFormData[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (preview.length === 0) {
      setError("Enter table numbers, e.g. 1-10 or 1, 2, 5.");
      return;
    }
    await onGenerate(form);
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
            onClick={saving ? undefined : onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[90vh] max-w-lg -translate-y-1/2 overflow-y-auto rounded-2xl border border-gold/15 bg-surface-elevated p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-white">Bulk Generate QR Codes</h2>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-50"
                aria-label="Close"
              >
                <QrIcon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
                  Table numbers
                </label>
                <input
                  value={form.tableNumbers}
                  onChange={(e) => update("tableNumbers", e.target.value)}
                  placeholder="e.g. 1-10, 12, 15"
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-white/35">
                  {preview.length > 0
                    ? `Will generate ${preview.length} QR code${preview.length === 1 ? "" : "s"}.`
                    : "Use ranges (1-10) or comma-separated lists (1, 2, 5)."}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
                  Area / Section (optional)
                </label>
                <input
                  value={form.area}
                  onChange={(e) => update("area", e.target.value)}
                  placeholder="e.g. Indoor, Terrace, VIP"
                  className={inputClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
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
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
                    Mode
                  </label>
                  <select
                    value={form.mode}
                    onChange={(e) => update("mode", e.target.value as QrMode)}
                    className={inputClass}
                  >
                    <option value="dynamic">Dynamic</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>
              </div>
              {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} disabled={saving} className="menu-btn-secondary flex-1 disabled:opacity-60">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || preview.length === 0}
                  className="menu-btn-primary flex-1 disabled:opacity-60"
                >
                  {saving ? "Generating..." : `Generate ${preview.length || ""} QR Codes`}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
