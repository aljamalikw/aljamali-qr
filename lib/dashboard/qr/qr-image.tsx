import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";

/** Renders a real, scannable QR code to an SVG markup string (no DOM required). */
export function buildQrSvgMarkup(value: string, size = 512): string {
  const markup = renderToStaticMarkup(
    <QRCodeSVG
      value={value || " "}
      size={size}
      level="M"
      bgColor="#ffffff"
      fgColor="#050505"
      marginSize={2}
    />,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n${markup}`;
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to render QR image"));
    img.src = src;
  });
}

export function downloadQrCodeSvg(value: string, filename: string, size = 512): void {
  const svg = buildQrSvgMarkup(value, size);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `${filename}.svg`);
  URL.revokeObjectURL(url);
}

export async function downloadQrCodePng(value: string, filename: string, size = 1024): Promise<void> {
  const svg = buildQrSvgMarkup(value, size);
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));

  try {
    const img = await loadImage(svgUrl);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    triggerDownload(canvas.toDataURL("image/png"), `${filename}.png`);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function buildPrintPageHtml(
  title: string,
  cards: { name: string; url: string; subtitle?: string }[],
): string {
  const pages = cards
    .map(
      (card) => `
        <section class="qr-page">
          <h1>${escapeHtml(card.name)}</h1>
          ${card.subtitle ? `<p class="subtitle">${escapeHtml(card.subtitle)}</p>` : ""}
          <div class="qr-frame">${buildQrSvgMarkup(card.url, 280).replace(/^<\?xml[^>]*\?>\s*/, "")}</div>
          <p class="url">${escapeHtml(card.url)}</p>
        </section>`,
    )
    .join("\n");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; margin: 0; }
          .qr-page {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
            page-break-after: always;
            text-align: center;
          }
          .qr-page:last-child { page-break-after: auto; }
          h1 { font-size: 1.5rem; margin: 0 0 0.25rem; color: #111; }
          .subtitle { color: #666; font-size: 0.9rem; margin: 0 0 1.25rem; }
          .qr-frame {
            width: 280px;
            height: 280px;
            padding: 16px;
            border: 2px solid #d4af37;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-frame svg { width: 100%; height: 100%; }
          .url { margin-top: 1.25rem; color: #888; font-size: 0.75rem; word-break: break-all; max-width: 320px; }
        </style>
      </head>
      <body>
        ${pages}
        <script>window.onload = () => { window.print(); };</script>
      </body>
    </html>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function printQrCode(name: string, url: string, subtitle?: string): void {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(buildPrintPageHtml(name, [{ name, url, subtitle }]));
  win.document.close();
}

export function printQrCodesBulk(
  title: string,
  cards: { name: string; url: string; subtitle?: string }[],
): void {
  if (cards.length === 0) return;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(buildPrintPageHtml(title, cards));
  win.document.close();
}
