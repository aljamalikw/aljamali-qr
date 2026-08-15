/**
 * Official Aljamali QR platform WhatsApp (company support — not restaurant CRM).
 *
 * Source of truth previously hard-coded on Owner Support:
 *   https://wa.me/96565592134
 *
 * Optional override: NEXT_PUBLIC_WHATSAPP_NUMBER (digits only, with country code).
 */

export const OFFICIAL_ALJAMALI_WHATSAPP_NUMBER = "96565592134";

export const OFFICIAL_ALJAMALI_WHATSAPP_DISPLAY = "+965 6559 2134";

export const DEFAULT_PLATFORM_WHATSAPP_MESSAGE =
  "Hello Aljamali QR, I would like to learn more about your restaurant platform.";

const MIN_E164_DIGITS = 8;
const MAX_E164_DIGITS = 15;

/** Strip formatting; return digits-only international number or null. */
export function normalizeOfficialWhatsAppNumber(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (
    digits.length < MIN_E164_DIGITS ||
    digits.length > MAX_E164_DIGITS ||
    !/^\d+$/.test(digits)
  ) {
    return null;
  }
  return digits;
}

/**
 * Resolve the configured official Aljamali QR WhatsApp number.
 * Prefer NEXT_PUBLIC_WHATSAPP_NUMBER when set and valid; otherwise the
 * known platform support number. Never invents or falls back to a random value.
 */
export function getConfiguredWhatsAppNumber(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim();
  if (fromEnv) {
    const normalized = normalizeOfficialWhatsAppNumber(fromEnv);
    if (!normalized) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "[Aljamali WhatsApp] NEXT_PUBLIC_WHATSAPP_NUMBER is set but invalid. " +
            "Expected an international number with digits only (country code, no +).",
        );
      }
      return null;
    }
    return normalized;
  }

  const fallback = normalizeOfficialWhatsAppNumber(
    OFFICIAL_ALJAMALI_WHATSAPP_NUMBER,
  );
  if (!fallback && process.env.NODE_ENV !== "production") {
    console.error(
      "[Aljamali WhatsApp] Official platform WhatsApp number is missing or invalid.",
    );
  }
  return fallback;
}

/**
 * Build a WhatsApp click-to-chat URL for the official Aljamali QR number.
 * Returns null when the number is not configured / invalid (no silent redirect).
 */
export function getWhatsAppUrl(
  message: string = DEFAULT_PLATFORM_WHATSAPP_MESSAGE,
): string | null {
  const number = getConfiguredWhatsAppNumber();
  if (!number) return null;

  const trimmed = message.trim();
  if (!trimmed) {
    return `https://wa.me/${number}`;
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(trimmed)}`;
}

export function getWhatsAppTelHref(): string | null {
  const number = getConfiguredWhatsAppNumber();
  if (!number) return null;
  return `tel:+${number}`;
}
