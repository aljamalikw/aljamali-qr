"use client";

import type { PublicLanguage } from "@/lib/public-menu/types";

interface LanguageSwitchProps {
  lang: PublicLanguage;
  onChange: (lang: PublicLanguage) => void;
}

export function LanguageSwitch({ lang, onChange }: LanguageSwitchProps) {
  return (
    <div
      className="flex rounded-xl border border-gold/20 bg-surface p-1"
      role="group"
      aria-label="Language switch"
    >
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
          lang === "en"
            ? "bg-gold text-black shadow-md shadow-gold/20"
            : "text-white/60 hover:text-white"
        }`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onChange("ar")}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
          lang === "ar"
            ? "bg-gold text-black shadow-md shadow-gold/20"
            : "text-white/60 hover:text-white"
        }`}
        aria-pressed={lang === "ar"}
      >
        AR
      </button>
    </div>
  );
}
