"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AuthCard } from "@/components/auth/AuthCard";
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

export function OnboardingSuccess({
  restaurant,
  qrResult,
  onGoToDashboard,
}: OnboardingSuccessProps) {
  const { showToast } = useToast();
  const [sharing, setSharing] = useState(false);

  const restaurantName = restaurant?.restaurant_name?.trim() || "Your restaurant";
  const menuUrl = buildQrDestinationUrl(restaurant?.slug, getAppBaseUrl());

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
    <AuthCard className="max-w-xl text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-3xl"
      >
        🎉
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="mt-6 font-serif text-2xl font-bold text-white sm:text-3xl">
          Congratulations!
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-base">
          <span className="text-white/80">{restaurantName}</span> is now live.
          Your premium digital menu is ready for guests to scan and explore.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 grid gap-3 sm:grid-cols-2"
      >
        <a
          href={menuUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!menuUrl}
          className={`auth-btn-secondary flex items-center justify-center ${
            !menuUrl ? "pointer-events-none opacity-50" : ""
          }`}
        >
          View Menu
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
        <AuthButton type="button" onClick={onGoToDashboard}>
          Go To Dashboard
        </AuthButton>
      </motion.div>
    </AuthCard>
  );
}
