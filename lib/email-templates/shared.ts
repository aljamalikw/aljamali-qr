/** Shared black/gold branded HTML email layout builder for Aljamali QR. */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type EmailLayoutData = {
  previewText?: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote?: string;
};

const GOLD_GRADIENT = "linear-gradient(135deg, #e8c547 0%, #d4af37 50%, #b8942e 100%)";

export function renderEmailLayout({
  previewText = "",
  heading,
  bodyHtml,
  ctaLabel,
  ctaHref,
  footerNote,
}: EmailLayoutData): string {
  const year = new Date().getFullYear();
  const footer =
    footerNote ??
    `You are receiving this email because you have an account with Aljamali QR.`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#050505;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none;font-size:1px;color:#050505;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(previewText)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#050505;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:linear-gradient(145deg, rgba(26,26,26,0.97) 0%, rgba(17,17,17,0.98) 100%);border:1px solid rgba(212,175,55,0.15);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:${GOLD_GRADIENT};padding:28px 32px;text-align:center;">
              <span style="font-family:Georgia,'Playfair Display',serif;font-size:24px;font-weight:700;color:#050505;letter-spacing:0.01em;">
                Aljamali&nbsp;QR
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 28px;">
              <h1 style="margin:0 0 18px;font-family:Georgia,'Playfair Display',serif;font-size:22px;line-height:1.35;color:#f5f5f5;font-weight:700;">
                ${heading}
              </h1>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.75;color:rgba(245,245,245,0.72);">
                ${bodyHtml}
              </div>
              ${
                ctaLabel && ctaHref
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:30px;">
                <tr>
                  <td style="border-radius:10px;background:${GOLD_GRADIENT};">
                    <a href="${escapeHtml(ctaHref)}" style="display:inline-block;padding:13px 30px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#050505;text-decoration:none;border-radius:10px;">
                      ${escapeHtml(ctaLabel)}
                    </a>
                  </td>
                </tr>
              </table>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid rgba(212,175,55,0.12);">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:rgba(245,245,245,0.35);text-align:center;">
                ${footer}
              </p>
              <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:rgba(245,245,245,0.25);text-align:center;">
                &copy; ${year} Aljamali QR. Premium digital menus.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
