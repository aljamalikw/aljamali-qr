/**
 * Normalize phone numbers for WhatsApp / tel: links.
 * Default country code: Kuwait (965).
 */

const DEFAULT_COUNTRY = "965";

/**
 * Strip spaces, dashes, brackets, plus signs → digits only,
 * then ensure a country code is present.
 *
 * Examples:
 * - 65592134 → 96565592134
 * - +965 6559 2134 → 96565592134
 * - 96565592134 → unchanged
 */
export function normalizeWhatsAppPhone(
  phone: string | null | undefined,
  defaultCountryCode: string = DEFAULT_COUNTRY,
): string | null {
  if (!phone) return null;
  let digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;

  // International prefix 00XX…
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith(defaultCountryCode)) {
    return digits;
  }

  // Local Kuwait mobiles are typically 8 digits (e.g. 65592134).
  if (digits.length === 8) {
    return `${defaultCountryCode}${digits}`;
  }

  // Leading trunk 0 + 8 digits → drop 0, add country.
  if (digits.startsWith("0") && digits.length === 9) {
    return `${defaultCountryCode}${digits.slice(1)}`;
  }

  return digits;
}

/** tel:+965… href for Call Customer. */
export function buildTelHref(phone: string | null | undefined): string | null {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return null;
  return `tel:+${normalized}`;
}
