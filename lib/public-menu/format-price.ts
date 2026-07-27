import type { PublicLanguage } from "./types";

const currencyLabels: Record<string, { en: string; ar: string }> = {
  KWD: { en: "KD", ar: "د.ك" },
  USD: { en: "USD", ar: "USD" },
  EUR: { en: "EUR", ar: "EUR" },
  SAR: { en: "SAR", ar: "ر.س" },
  AED: { en: "AED", ar: "د.إ" },
  BHD: { en: "BHD", ar: "د.ب" },
  OMR: { en: "OMR", ar: "ر.ع" },
  QAR: { en: "QAR", ar: "ر.ق" },
};

export function formatPublicPrice(
  price: number,
  currency: string,
  lang: PublicLanguage,
): string {
  const formatted = Number(price).toFixed(3);
  const code = currency.toUpperCase();
  const label = currencyLabels[code]?.[lang] ?? code;

  return lang === "ar" ? `${formatted} ${label}` : `${formatted} ${label}`;
}
