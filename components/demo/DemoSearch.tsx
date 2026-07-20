"use client";

import type { Language } from "@/lib/saffron-garden/types";
import { t } from "@/lib/saffron-garden/menu-data";

interface DemoSearchProps {
  lang: Language;
  value: string;
  onChange: (value: string) => void;
}

export function DemoSearch({ lang, value, onChange }: DemoSearchProps) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder", lang)}
        className="w-full rounded-2xl border border-gold/15 bg-surface py-4 pe-12 ps-12 text-sm text-white placeholder:text-white/35 transition-all duration-300 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 sm:text-base"
        aria-label={t("searchPlaceholder", lang)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute end-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-gold transition-colors hover:bg-gold/10"
          aria-label={t("clearSearch", lang)}
        >
          {t("clearSearch", lang)}
        </button>
      )}
    </div>
  );
}
