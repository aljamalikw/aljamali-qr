import { escapeHtml, renderEmailLayout } from "./shared";

export type DemoConfirmationEmailData = {
  contactName: string;
  restaurantName: string;
  preferredDate: string;
  preferredTime: string;
};

export function renderDemoConfirmationEmail(
  data: DemoConfirmationEmailData,
): string {
  const name = escapeHtml(data.contactName || "there");
  const restaurant = escapeHtml(data.restaurantName || "your restaurant");
  const date = escapeHtml(data.preferredDate || "the requested date");
  const time = escapeHtml(data.preferredTime || "the requested time");

  return renderEmailLayout({
    previewText: `Your Aljamali QR demo request is confirmed for ${date}.`,
    heading: `Your demo is booked, ${name}`,
    bodyHtml: `
      <p style="margin:0 0 14px;">Thank you for requesting a demo of Aljamali QR for <strong style="color:#e8c547;">${restaurant}</strong>.</p>
      <p style="margin:0 0 14px;">We have scheduled your walkthrough for:</p>
      <p style="margin:0 0 14px;padding:12px 16px;border:1px solid rgba(212,175,55,0.2);border-radius:10px;background:rgba(212,175,55,0.06);">
        📅 ${date} &nbsp;·&nbsp; 🕒 ${time}
      </p>
      <p style="margin:0;">A member of our team will reach out shortly to confirm the details.</p>
    `,
    ctaLabel: "Visit Aljamali QR",
    ctaHref: "https://aljamaliqr.com",
  });
}

export const demoConfirmationEmailSample: DemoConfirmationEmailData = {
  contactName: "Ahmed Al-Rashid",
  restaurantName: "Saffron Garden",
  preferredDate: "August 3, 2026",
  preferredTime: "3:00 PM",
};
