import { escapeHtml, renderEmailLayout } from "./shared";

export type WelcomeEmailData = {
  ownerName: string;
  restaurantName: string;
  dashboardUrl: string;
};

export function renderWelcomeEmail(data: WelcomeEmailData): string {
  const name = escapeHtml(data.ownerName || "there");
  const restaurant = escapeHtml(data.restaurantName || "your restaurant");

  return renderEmailLayout({
    previewText: `Welcome to Aljamali QR, ${name}!`,
    heading: `Welcome aboard, ${name} 🎉`,
    bodyHtml: `
      <p style="margin:0 0 14px;">Your Aljamali QR account for <strong style="color:#e8c547;">${restaurant}</strong> is ready.</p>
      <p style="margin:0 0 14px;">You can now build your digital menu, generate QR codes for every table, and track guest engagement in real time — all from one premium dashboard.</p>
      <p style="margin:0;">We are thrilled to have you with us.</p>
    `,
    ctaLabel: "Go to Dashboard",
    ctaHref: data.dashboardUrl,
  });
}

export const welcomeEmailSample: WelcomeEmailData = {
  ownerName: "Layla Al-Mutairi",
  restaurantName: "Saffron Garden",
  dashboardUrl: "https://aljamaliqr.com/dashboard",
};
