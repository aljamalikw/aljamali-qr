"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AuthButton } from "@/components/auth/AuthButton";
import { useToast } from "@/components/ui/ToastProvider";
import { downloadQrSvg } from "@/lib/dashboard/qr/download-utils";
import { buildQrDestinationUrl, getAppBaseUrl } from "@/lib/dashboard/qr/utils";
import type { OnboardingQrResult } from "@/lib/onboarding/types";
import type { Restaurant } from "@/lib/restaurants/types";

interface OnboardingSuccessProps {
  restaurant: Restaurant | null;
  qrResult: OnboardingQrResult | null;
  onGoToDashboard: () => void;
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: `${(i * 17) % 100}%`,
        delay: (i % 10) * 0.08,
        duration: 2.2 + (i % 5) * 0.25,
        color: i % 3 === 0 ? "#d4af37" : i % 3 === 1 ? "#e8c547" : "#ffffff",
        size: 4 + (i % 4),
      })),
    [],
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: piece.left,
            width: piece.size,
            height: piece.size * 1.4,
            background: piece.color,
          }}
          initial={{ y: -20, opacity: 0, rotate: 0 }}
          animate={{
            y: [0, 420],
            opacity: [0, 1, 1, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export function OnboardingSuccess({
  restaurant,
  qrResult,
  onGoToDashboard,
}: OnboardingSuccessProps) {
  const { showToast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  const restaurantName = restaurant?.restaurant_name?.trim() || "Your restaurant";
  const menuUrl = buildQrDestinationUrl(restaurant?.slug, getAppBaseUrl());

  useEffect(() => {
    const timer = window.setTimeout(() => setShowConfetti(false), 3500);
    return () => window.clearTimeout(timer);
  }, []);

  const handleShare = async () => {
    if (!menuUrl) return;
    setSharing(true);

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `${restaurantName} — Digital Menu`,
          url: menuUrl,
        });
      } else {
        await navigator.clipboard.writeText(menuUrl);
        showToast("Menu link copied to clipboard");
      }
    } catch {
      // User cancelled the native share sheet — nothing to do.
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-gold/25 bg-black/55 px-6 py-12 text-center shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:px-10 sm:py-14">
      {showConfetti ? <Confetti /> : null}

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.14)_0%,transparent_55%)]"
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] text-3xl text-black shadow-[0_16px_40px_rgba(212,175,55,0.45)]"
      >
        ✓
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Setup Complete
        </p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">
          Your restaurant is ready!
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55 sm:text-base">
          <span className="text-white/85">{restaurantName}</span> is live. Your
          premium digital menu is ready for guests to scan and explore.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-9 grid gap-3 sm:grid-cols-2"
      >
        <AuthButton type="button" onClick={onGoToDashboard} className="w-full py-3.5">
          Go to Dashboard
        </AuthButton>
        <a
          href={menuUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!menuUrl}
          className={`auth-btn-secondary flex w-full items-center justify-center py-3.5 ${
            !menuUrl ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Preview My Menu
        </a>
        <button
          type="button"
          onClick={() => {
            if (!qrResult) return;
            downloadQrSvg(qrResult.url, qrResult.name);
            showToast("QR code downloaded");
          }}
          disabled={!qrResult}
          className="auth-btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Download QR
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={!menuUrl || sharing}
          className="auth-btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sharing ? "Sharing…" : "Share Menu"}
        </button>
      </motion.div>
    </div>
  );
}
