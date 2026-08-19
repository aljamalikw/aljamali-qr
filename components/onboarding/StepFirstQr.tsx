"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { AuthButton } from "@/components/auth/AuthButton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import { downloadQrSvg } from "@/lib/dashboard/qr/download-utils";
import type { QrCreateFormData, QrType } from "@/lib/dashboard/qr/types";
import { createEmptyQrForm } from "@/lib/dashboard/qr/utils";
import { QR_PRESET_OPTIONS } from "@/lib/onboarding/constants";
import type { OnboardingQrResult } from "@/lib/onboarding/types";
import { createQrCode } from "@/lib/qr-codes/createQrCode";
import type { Restaurant } from "@/lib/restaurants/types";

interface StepFirstQrProps {
  restaurant: Restaurant | null;
  onBack: () => void;
  onFinish: (qr: OnboardingQrResult | null) => Promise<void>;
}

const inputClass =
  "w-full rounded-xl border border-gold/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

export function StepFirstQr({ restaurant, onBack, onFinish }: StepFirstQrProps) {
  const { showToast } = useToast();
  const [name, setName] = useState("Table 1");
  const [type, setType] = useState<QrType>("restaurant-table");
  const [tableNumber, setTableNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<{ name: string; url: string } | null>(
    null,
  );
  const [finishing, setFinishing] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);

  const hasSlug = Boolean(restaurant?.slug?.trim());

  const handleGenerate = async () => {
    if (!name.trim()) {
      setError("Please enter a QR name.");
      return;
    }
    if (!hasSlug) {
      setError(
        "Your restaurant setup isn't complete yet. Please go back and finish step 1.",
      );
      return;
    }

    setGenerating(true);
    setError(null);

    const form: QrCreateFormData = {
      ...createEmptyQrForm(),
      name: name.trim(),
      type,
      tableNumber: tableNumber.trim(),
    };

    const result = await createQrCode(form, restaurant);
    setGenerating(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setGenerated({ name: result.data.name, url: result.data.url });
    showToast("QR code generated");
  };

  const handleFinish = async () => {
    setFinishing(true);
    await onFinish(generated ? { name: generated.name, url: generated.url } : null);
    setFinishing(false);
  };

  const handleSkip = async () => {
    setSkipOpen(false);
    setFinishing(true);
    await onFinish(null);
    setFinishing(false);
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
          Generate your first QR code
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50">
          Guests scan this to open your live digital menu instantly.
        </p>
      </div>

      {!generated ? (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
              QR Name
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Table 1"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {QR_PRESET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`rounded-xl border px-2 py-2.5 text-center text-[11px] transition-colors ${
                    type === option.value
                      ? "border-gold bg-gold/15 text-gold"
                      : "border-white/10 text-white/50 hover:border-gold/20 hover:text-white/80"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {type === "restaurant-table" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
                Table Number
              </label>
              <input
                value={tableNumber}
                onChange={(event) => setTableNumber(event.target.value)}
                placeholder="Optional"
                className={inputClass}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <AuthButton type="button" variant="secondary" onClick={onBack} className="flex-1">
              Back
            </AuthButton>
            <AuthButton
              type="button"
              onClick={handleGenerate}
              loading={generating}
              className="flex-1"
            >
              Generate QR
            </AuthButton>
          </div>

          <button
            type="button"
            onClick={() => setSkipOpen(true)}
            disabled={finishing}
            className="w-full pt-1 text-center text-xs text-white/35 underline-offset-2 transition-colors hover:text-white/60 hover:underline disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <div className="mx-auto inline-block rounded-2xl bg-white p-4">
            <QRCodeSVG value={generated.url} size={180} bgColor="#fff" fgColor="#050505" />
          </div>
          <p className="mt-3 font-medium text-white">{generated.name}</p>
          <p className="mt-1 truncate text-xs text-white/40">{generated.url}</p>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="menu-btn-secondary text-xs"
              onClick={() => {
                downloadQrSvg(generated.url, generated.name);
                showToast("SVG downloaded");
              }}
            >
              Download SVG
            </button>
            <button
              type="button"
              className="menu-btn-secondary text-xs"
              onClick={() => {
                navigator.clipboard.writeText(generated.url);
                showToast("URL copied to clipboard");
              }}
            >
              Copy URL
            </button>
          </div>

          <AuthButton type="button" onClick={handleFinish} loading={finishing} className="mt-6">
            Finish Setup
          </AuthButton>
        </motion.div>
      )}

      <ConfirmModal
        open={skipOpen}
        title="Skip QR code generation?"
        description="You can always create QR codes for tables, delivery, and pickup from your dashboard later."
        confirmLabel="Skip & Finish"
        loading={finishing}
        onConfirm={handleSkip}
        onCancel={() => setSkipOpen(false)}
      />
    </div>
  );
}
