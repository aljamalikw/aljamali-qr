export type ExportFormat = "csv" | "xlsx" | "pdf" | "docx";

export type ExportColumnType = "string" | "number" | "date" | "datetime" | "currency";

export type ExportColumn = {
  key: string;
  header: string;
  type?: ExportColumnType;
};

export type ExportMeta = {
  title: string;
  restaurantName?: string;
  dateRangeLabel?: string;
  filterSummary?: string[];
  generatedAt?: Date;
};

export type ExportSummaryRow = {
  label: string;
  value: string;
};

export type ExportSheet = {
  name: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  summary?: ExportSummaryRow[];
};

export type ExportDataset = {
  filenamePrefix: string;
  meta: ExportMeta;
  /** Primary table for CSV / single-sheet exports. */
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  summary?: ExportSummaryRow[];
  /** Optional extra sheets (Excel only). */
  sheets?: ExportSheet[];
};

export type ExportResult =
  | { ok: true }
  | { ok: false; message: string; empty?: boolean };

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: "CSV (.csv)",
  xlsx: "Excel (.xlsx)",
  pdf: "PDF (.pdf)",
  docx: "Word (.docx)",
};
