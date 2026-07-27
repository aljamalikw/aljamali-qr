import { escapeHtml, renderEmailLayout } from "./shared";

export type VerifyEmailData = {
  ownerName: string;
  verifyUrl: string;
};

export function renderVerifyEmail(data: VerifyEmailData): string {
  const name = escapeHtml(data.ownerName || "there");

  return renderEmailLayout({
    previewText: "Confirm your email to activate your Aljamali QR account.",
    heading: `Confirm your email, ${name}`,
    bodyHtml: `
      <p style="margin:0 0 14px;">Thanks for signing up for Aljamali QR. Please confirm this is your email address to activate your account.</p>
      <p style="margin:0 0 14px;">If you did not create this account, you can safely ignore this email.</p>
      <p style="margin:0;">This link will expire in 24 hours.</p>
    `,
    ctaLabel: "Verify Email Address",
    ctaHref: data.verifyUrl,
  });
}

export const verifyEmailSample: VerifyEmailData = {
  ownerName: "Layla Al-Mutairi",
  verifyUrl: "https://aljamaliqr.com/auth/verify?token=sample",
};
