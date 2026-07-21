export function downloadQrSvg(url: string, filename: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <rect width="256" height="256" fill="#ffffff"/>
    <text x="128" y="128" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#050505">${url}</text>
  </svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.svg`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function printQrPage(title: string, url: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html><head><title>${title}</title>
    <style>
      body { font-family: system-ui; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; }
      h1 { font-size: 1.25rem; margin-bottom: 1rem; }
      p { color: #666; font-size: 0.875rem; word-break: break-all; max-width: 300px; text-align:center; }
      .qr { width: 200px; height: 200px; border: 2px solid #d4af37; display:flex; align-items:center; justify-content:center; margin: 1rem 0; }
    </style></head>
    <body>
      <h1>${title}</h1>
      <div class="qr">QR</div>
      <p>${url}</p>
      <script>window.onload = () => { window.print(); }</script>
    </body></html>
  `);
  win.document.close();
}
