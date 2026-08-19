import { buildCsv, escapeCsvCell } from "@/lib/utils/csv";
import { datasetToMatrix } from "./formatters";
import { buildExportFilename, downloadText } from "./filenames";
import type { ExportDataset } from "./types";

/** UTF-8 BOM prefix so Excel opens Arabic correctly. */
const UTF8_BOM = "\uFEFF";

export function exportDatasetCsv(dataset: ExportDataset): void {
  const { headers, matrix } = datasetToMatrix(dataset.columns, dataset.rows);
  const csv = UTF8_BOM + buildCsv(headers, matrix);
  downloadText(
    buildExportFilename(dataset.filenamePrefix, "csv", {
      dateRangeLabel: dataset.meta.dateRangeLabel,
    }),
    csv,
    "text/csv;charset=utf-8;",
  );
}

export function buildEmptyExportCsv(dataset: ExportDataset): string {
  const headers = dataset.columns.map((col) => col.header);
  return UTF8_BOM + buildCsv(headers, [["No records match the current filters."]]);
}

export function exportEmptyDatasetCsv(dataset: ExportDataset): void {
  downloadText(
    buildExportFilename(dataset.filenamePrefix, "csv", {
      dateRangeLabel: dataset.meta.dateRangeLabel,
    }),
    buildEmptyExportCsv(dataset),
    "text/csv;charset=utf-8;",
  );
}

export { escapeCsvCell };
