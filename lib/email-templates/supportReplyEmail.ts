import { escapeHtml, renderEmailLayout } from "./shared";

export type SupportReplyEmailData = {
  ownerName: string;
  ticketNumber: string;
  subject: string;
  replyBody: string;
};

export function renderSupportReplyEmail(data: SupportReplyEmailData): string {
  const name = escapeHtml(data.ownerName || "there");
  const ticket = escapeHtml(data.ticketNumber || "—");
  const subject = escapeHtml(data.subject || "your support ticket");
  const reply = escapeHtml(data.replyBody || "").replace(/\n/g, "<br />");

  return renderEmailLayout({
    previewText: `New reply on ticket ${ticket}: ${data.subject ?? ""}`,
    heading: `New reply on your ticket, ${name}`,
    bodyHtml: `
      <p style="margin:0 0 14px;">Our support team replied to <strong style="color:#e8c547;">${subject}</strong> (${ticket}):</p>
      <div style="margin:0 0 14px;padding:14px 16px;border:1px solid rgba(212,175,55,0.15);border-radius:10px;background:rgba(0,0,0,0.25);color:rgba(245,245,245,0.85);font-size:13px;line-height:1.7;">
        ${reply}
      </div>
      <p style="margin:0;">You can reply directly from your dashboard support inbox.</p>
    `,
    ctaLabel: "View Ticket",
    ctaHref: "https://aljamaliqr.com/dashboard/support",
  });
}

export const supportReplyEmailSample: SupportReplyEmailData = {
  ownerName: "Layla Al-Mutairi",
  ticketNumber: "SUP-9F2K-014",
  subject: "QR code not loading on mobile",
  replyBody:
    "Thanks for the details — this has been fixed on our end. Please refresh your QR code page and let us know if the issue persists.",
};
