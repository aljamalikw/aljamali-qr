"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { qrTypes } from "@/lib/dashboard/qr/seed-data";
import type { QrCreateFormData, QrType } from "@/lib/dashboard/qr/types";
import {
  buildQrUrl,
  createEmptyQrForm,
  validateQrForm,
} from "@/lib/dashboard/qr/utils";
import { downloadQrSvg, printQrPage } from "@/lib/dashboard/qr/download-utils";
import { useToast } from "@/components/ui/ToastProvider";
import { QrIcon } from "./icons/QrIcons";

interface CreateQrWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: QrCreateFormData) => void;
}

const inputClass =
  "w-full rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

export function CreateQrWizard({ open, onClose, onComplete }: CreateQrWizardProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<QrCreateFormData>(createEmptyQrForm());
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (open) {
      setStep(1);
      setForm(createEmptyQrForm());
      setError(null);
      setPreviewUrl("");
    }
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const update = <K extends keyof QrCreateFormData>(
    key: K,
    value: QrCreateFormData[K],
  ) => {
    setForm((p) => ({ ...p, [key]: value }));
    setError(null);
  };

  const handleNext = async () => {
    const err = validateQrForm(form);
    if (err) {
      setError(err);
      return;
    }
    setStep(2);
    await new Promise((r) => setTimeout(r, 1400));
    const url = buildQrUrl(form.name, form.type, form.tableNumber);
    setPreviewUrl(url);
    setStep(3);
  };

  const handleFinish = () => {
    onComplete(form);
    showToast(`QR code "${form.name}" created successfully`);
    onClose();
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
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[90vh] max-w-lg -translate-y-1/2 overflow-y-auto rounded-2xl border border-gold/15 bg-surface-elevated p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gold">
                  Step {step} of 3
                </p>
                <h2 className="font-serif text-xl font-bold text-white">
                  {step === 1 && "QR Details"}
                  {step === 2 && "Generating..."}
                  {step === 3 && "Your QR Code"}
                </h2>
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

            <div className="mb-6 flex gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    s <= step ? "bg-gold" : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
                      QR Name
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="Table 15"
                      className={inputClass}
                    />
                  </div>
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
                      Table Number
                    </label>
                    <input
                      value={form.tableNumber}
                      onChange={(e) => update("tableNumber", e.target.value)}
                      placeholder="Optional"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      rows={2}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-400" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="menu-btn-secondary flex-1">
                      Cancel
                    </button>
                    <button type="button" onClick={handleNext} className="menu-btn-primary flex-1">
                      Generate QR
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-10"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    className="h-14 w-14 rounded-2xl border-2 border-gold/30 border-t-gold"
                  />
                  <p className="mt-6 text-sm text-white/50">
                    Creating your scannable QR code...
                  </p>
                </motion.div>
              )}

              {step === 3 && previewUrl && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="mx-auto inline-block rounded-2xl bg-white p-4">
                    <QRCodeSVG value={previewUrl} size={180} bgColor="#fff" fgColor="#050505" />
                  </div>
                  <p className="mt-4 truncate text-xs text-white/40">{previewUrl}</p>
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="menu-btn-secondary text-xs"
                      onClick={() => {
                        downloadQrSvg(previewUrl, form.name);
                        showToast("SVG downloaded");
                      }}
                    >
                      Download SVG
                    </button>
                    <button
                      type="button"
                      className="menu-btn-secondary text-xs"
                      onClick={() => {
                        printQrPage(form.name, previewUrl);
                        showToast("Opening print dialog...");
                      }}
                    >
                      Print QR
                    </button>
                    <button
                      type="button"
                      className="menu-btn-secondary col-span-2 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(previewUrl);
                        showToast("URL copied to clipboard");
                      }}
                    >
                      Copy URL
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="menu-btn-primary mt-6 w-full"
                  >
                    Save QR Code
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
