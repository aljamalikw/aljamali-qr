import { datasetToMatrix, escapeHtml, formatExportCell } from "./formatters";
import { buildExportFilename } from "./filenames";
import type { ExportDataset } from "./types";

const MAX_PDF_ROWS = 500;

function buildMetaBlock(dataset: ExportDataset): string {
  const lines = [
    `<p><strong>Restaurant:</strong> ${escapeHtml(dataset.meta.restaurantName ?? "—")}</p>`,
    dataset.meta.dateRangeLabel
      ? `<p><strong>Date range:</strong> ${escapeHtml(dataset.meta.dateRangeLabel)}</p>`
      : "",
    dataset.meta.filterSummary?.length
      ? `<p><strong>Filters:</strong> ${escapeHtml(dataset.meta.filterSummary.join("; "))}</p>`
      : "",
    `<p class="meta">Generated ${escapeHtml(
      formatExportCell(dataset.meta.generatedAt ?? new Date(), "datetime"),
    )}</p>`,
  ].filter(Boolean);
  return lines.join("");
}

function buildSummaryBlock(dataset: ExportDataset): string {
  if (!dataset.summary?.length) return "";
  return `<div class="summary">
    <h2>Summary</h2>
    ${dataset.summary
      .map(
        (row) =>
          `<p><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value)}</p>`,
      )
      .join("")}
  </div>`;
}

function buildTable(dataset: ExportDataset, rows: Record<string, unknown>[]): string {
  const { headers } = datasetToMatrix(dataset.columns, rows);
  const body = rows
    .map((row) => {
      const cells = dataset.columns
        .map(
          (col) =>
            `<td>${escapeHtml(formatExportCell(row[col.key], col.type ?? "string"))}</td>`,
        )
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<table>
    <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
    <tbody>${body || `<tr><td colspan="${headers.length}">No records match the current filters.</td></tr>`}</tbody>
  </table>`;
}

export function exportDatasetPdf(dataset: ExportDataset): boolean {
  const rows = dataset.rows.slice(0, MAX_PDF_ROWS);
  const truncated = dataset.rows.length > MAX_PDF_ROWS;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(dataset.meta.title)}</title>
  <style>
    @page { size: landscape; margin: 16mm; }
    body { font-family: Georgia, serif; padding: 24px; color: #111; background: #fff; }
    .brand { color: #8a6a1a; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 4px; }
    h1 { font-size: 22px; margin: 0 0 12px; }
    h2 { font-size: 15px; margin: 20px 0 8px; color: #8a6a1a; }
    p { margin: 4px 0; font-size: 12px; }
    .meta { color: #666; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 16px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f7f3e8; color: #333; }
    tr:nth-child(even) td { background: #fafafa; }
    .note { margin-top: 12px; font-size: 11px; color: #777; }
    @media print { thead { display: table-header-group; } tr { page-break-inside: avoid; } }
  </style></head><body>
  <div class="brand">Al Jamali QR</div>
  <h1>${escapeHtml(dataset.meta.title)}</h1>
  ${buildMetaBlock(dataset)}
  ${buildSummaryBlock(dataset)}
  ${buildTable(dataset, rows)}
  ${truncated ? `<p class="note">Showing first ${MAX_PDF_ROWS} of ${dataset.rows.length} records. Use Excel or CSV for the full filtered dataset.</p>` : ""}
  <script>window.onload=()=>window.print()</script>
  </body></html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  void buildExportFilename(dataset.filenamePrefix, "pdf");
  return true;
}

export function exportEmptyDatasetPdf(dataset: ExportDataset): boolean {
  return exportDatasetPdf({
    ...dataset,
    rows: [],
    summary: [{ label: "Records", value: "No records match the current filters." }],
  });
}
