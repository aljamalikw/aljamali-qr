/**
 * Free WhatsApp Share helpers — no API credentials required.
 * Opens WhatsApp Web / wa.me with a pre-filled message.
 */

export function isMobileClient(userAgent?: string | null): boolean {
  const ua =
    userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    ua,
  );
}

/**
 * Build a WhatsApp share URL with the message pre-filled.
 * Desktop → web.whatsapp.com; Mobile → wa.me
 */
export function buildWhatsAppShareUrl(
  message: string,
  options?: { phone?: string | null; userAgent?: string | null },
): string {
  const text = encodeURIComponent(message);
  const phoneDigits = (options?.phone ?? "").replace(/[^\d]/g, "");
  const mobile = isMobileClient(options?.userAgent);

  if (phoneDigits) {
    // Direct chat with a specific number when available.
    return mobile
      ? `https://wa.me/${phoneDigits}?text=${text}`
      : `https://web.whatsapp.com/send?phone=${phoneDigits}&text=${text}`;
  }

  return mobile
    ? `https://wa.me/?text=${text}`
    : `https://web.whatsapp.com/send?text=${text}`;
}

export function openWhatsAppShare(
  message: string,
  options?: { phone?: string | null },
): string {
  const url = buildWhatsAppShareUrl(message, options);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return url;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  try {
    if (typeof document === "undefined") return false;
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
