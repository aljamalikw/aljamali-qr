import { escapeHtml, renderEmailLayout } from "./shared";

export type PasswordResetEmailData = {
  ownerName: string;
  resetUrl: string;
};

export function renderPasswordResetEmail(data: PasswordResetEmailData): string {
  const name = escapeHtml(data.ownerName || "there");

  return renderEmailLayout({
    previewText: "Reset your Aljamali QR password.",
    heading: `Reset your password, ${name}`,
    bodyHtml: `
      <p style="margin:0 0 14px;">We received a request to reset the password for your Aljamali QR account.</p>
      <p style="margin:0 0 14px;">Click the button below to choose a new password. This link expires in 1 hour.</p>
      <p style="margin:0;">If you did not request this, you can safely ignore this email — your password will remain unchanged.</p>
    `,
    ctaLabel: "Reset Password",
    ctaHref: data.resetUrl,
  });
}

export const passwordResetEmailSample: PasswordResetEmailData = {
  ownerName: "Layla Al-Mutairi",
  resetUrl: "https://aljamaliqr.com/auth/reset-password?token=sample",
};
