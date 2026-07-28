import { escapeHtml, renderEmailLayout } from "./shared";

export type AnnouncementEmailData = {
  ownerName: string;
  title: string;
  message: string;
};

export function renderAnnouncementEmail(data: AnnouncementEmailData): string {
  const name = escapeHtml(data.ownerName || "there");
  const title = escapeHtml(data.title || "Platform announcement");
  const message = escapeHtml(data.message || "").replace(/\n/g, "<br />");

  return renderEmailLayout({
    previewText: title,
    heading: title,
    bodyHtml: `
      <p style="margin:0 0 14px;">Hi ${name},</p>
      <div style="margin:0 0 14px;color:rgba(245,245,245,0.8);">
        ${message}
      </div>
      <p style="margin:0;">— The Aljamali QR Team</p>
    `,
    ctaLabel: "Open Dashboard",
    ctaHref: "https://aljamaliqr.com/dashboard",
  });
}

export const announcementEmailSample: AnnouncementEmailData = {
  ownerName: "Layla Al-Mutairi",
  title: "Scheduled maintenance this weekend",
  message:
    "We will be performing scheduled maintenance on Saturday from 2:00 AM to 4:00 AM (GMT+3). Menu pages will remain online; the dashboard may be briefly unavailable.",
};
