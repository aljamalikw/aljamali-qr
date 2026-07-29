"use client";

import type { PublicLanguage } from "@/lib/public-menu/types";

interface LanguageSwitchProps {
  lang: PublicLanguage;
  onChange: (lang: PublicLanguage) => void;
}

export function LanguageSwitch({ lang, onChange }: LanguageSwitchProps) {
  return (
    <div
      className="flex rounded-full border border-gold/25 bg-black/50 p-1 backdrop-blur-md"
      role="group"
      aria-label="Language switch"
    >
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
          lang === "en"
            ? "bg-gradient-to-r from-[#e8c547] via-gold to-[#b8942e] text-black shadow-md shadow-gold/25"
            : "text-white/60 hover:text-white"
        }`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onChange("ar")}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-wider transition-all duration-300 ${
          lang === "ar"
            ? "bg-gradient-to-r from-[#e8c547] via-gold to-[#b8942e] text-black shadow-md shadow-gold/25"
            : "text-white/60 hover:text-white"
        }`}
        aria-pressed={lang === "ar"}
      >
        العربية
      </button>
    </div>
  );
}
