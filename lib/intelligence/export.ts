import { buildCsv, csvTimestamp, downloadCsv } from "@/lib/utils/csv";

/** Professional: CSV. Enterprise helpers also expose Excel-like TSV and printable HTML→PDF. */

export function exportBiCsv(
  filenamePrefix: string,
  headers: string[],
  rows: string[][],
): void {
  downloadCsv(`${filenamePrefix}-${csvTimestamp()}.csv`, buildCsv(headers, rows));
}

/** Excel-friendly TSV (.xls extension opens in Excel). */
export function exportBiExcel(
  filenamePrefix: string,
  headers: string[],
  rows: string[][],
): void {
  const lines = [
    headers.join("\t"),
    ...rows.map((row) => row.map((cell) => String(cell).replace(/\t/g, " ")).join("\t")),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filenamePrefix}-${csvTimestamp()}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Opens a printable summary the browser can Save as PDF. */
export function exportBiPdf(
  title: string,
  sections: Array<{ heading: string; lines: string[] }>,
): void {
  const html = `<!DOCTYPE html><html><head><title>${escapeHtml(title)}</title>
  <style>
    body{font-family:Georgia,serif;padding:32px;color:#111;background:#fff}
    h1{font-size:22px;margin:0 0 8px} h2{font-size:16px;margin:24px 0 8px;color:#8a6a1a}
    p{margin:4px 0;font-size:13px;color:#333} .meta{color:#777;font-size:12px}
  </style></head><body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">Generated ${new Date().toLocaleString()}</p>
  ${sections
    .map(
      (s) =>
        `<h2>${escapeHtml(s.heading)}</h2>${s.lines
          .map((l) => `<p>${escapeHtml(l)}</p>`)
          .join("")}`,
    )
    .join("")}
  <script>window.onload=()=>window.print()</script>
  </body></html>`;
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
