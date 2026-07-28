"use client";

import { useState } from "react";
import { t } from "@/lib/public-menu/i18n";
import type { PublicLanguage } from "@/lib/public-menu/types";

interface ShareMenuButtonsProps {
  lang: PublicLanguage;
  restaurantName: string;
  compact?: boolean;
}

export function ShareMenuButtons({ lang, restaurantName, compact = false }: ShareMenuButtonsProps) {
  const [copied, setCopied] = useState(false);

  const getUrl = () => (typeof window !== "undefined" ? window.location.href : "");

  const handleShare = async () => {
    const url = getUrl();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: restaurantName, url });
        return;
      } catch {
        // user cancelled or share failed; fall through to copy
      }
    }
    await handleCopy();
  };

  const handleCopy = async () => {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard unavailable; no-op
    }
  };

  const btnClass = compact
    ? "flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-sm text-white/70 backdrop-blur-sm transition-colors hover:border-gold/30 hover:text-gold"
    : "flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3.5 py-1.5 text-xs text-white/70 backdrop-blur-sm transition-colors hover:border-gold/30 hover:text-gold";

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={handleShare} className={btnClass} aria-label={t("share", lang)}>
        {compact ? "↗" : `↗ ${t("share", lang)}`}
      </button>
      <button type="button" onClick={handleCopy} className={btnClass} aria-label={t("copyLink", lang)}>
        {copied ? `✓ ${t("linkCopied", lang)}` : compact ? "⎘" : `⎘ ${t("copyLink", lang)}`}
      </button>
    </div>
  );
}
