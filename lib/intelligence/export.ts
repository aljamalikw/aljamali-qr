import { buildCsv, csvTimestamp, downloadCsv } from "@/lib/utils/csv";
import { runExport } from "@/lib/export/export-data";
import { buildBiExportDataset, biExportRows } from "@/lib/export/datasets/bi";
import type { ExportFormat } from "@/lib/export/types";

/** @deprecated Use runExport with buildBiExportDataset instead. */
export function exportBiCsv(
  filenamePrefix: string,
  headers: string[],
  rows: string[][],
): void {
  downloadCsv(`${filenamePrefix}-${csvTimestamp()}.csv`, buildCsv(headers, rows));
}

/** @deprecated Use runExport(format, dataset) instead. */
export function exportBiExcel(
  filenamePrefix: string,
  headers: string[],
  rows: string[][],
): void {
  void runExport("xlsx", {
    filenamePrefix,
    meta: { title: filenamePrefix },
    columns: headers.map((header, index) => ({
      key: `col_${index}`,
      header,
    })),
    rows: rows.map((row) =>
      Object.fromEntries(row.map((cell, index) => [`col_${index}`, cell])),
    ),
  });
}

/** @deprecated Use runExport(format, dataset) instead. */
export function exportBiPdf(
  title: string,
  sections: Array<{ heading: string; lines: string[] }>,
): void {
  const rows = sections.flatMap((section) =>
    section.lines.map((line) => ({
      metric: section.heading,
      value: line,
    })),
  );
  void runExport("pdf", {
    filenamePrefix: title.toLowerCase().replace(/\s+/g, "_"),
    meta: { title },
    columns: [
      { key: "metric", header: "Section" },
      { key: "value", header: "Detail" },
    ],
    rows,
  });
}

export { runExport, buildBiExportDataset, biExportRows };
export type { ExportFormat };
