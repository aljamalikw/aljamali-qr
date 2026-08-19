import type { ExportColumn, ExportColumnType } from "./types";

export function formatExportDate(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value ?? "");
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatExportTime(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatExportDateTime(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value ?? "");
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatExportMoney(
  value: unknown,
  currency = "KWD",
  decimals = 3,
): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `${n.toFixed(decimals)} ${currency}`;
}

export function formatExportCell(
  value: unknown,
  type: ExportColumnType = "string",
): string {
  if (value === null || value === undefined) return "";
  switch (type) {
    case "number":
      return Number.isFinite(Number(value)) ? String(Number(value)) : "";
    case "currency":
      return formatExportMoney(value);
    case "date":
      return formatExportDate(value);
    case "datetime":
      return formatExportDateTime(value);
    default:
      return String(value);
  }
}

export function datasetToMatrix(
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
): { headers: string[]; matrix: string[][] } {
  return {
    headers: columns.map((col) => col.header),
    matrix: rows.map((row) =>
      columns.map((col) =>
        formatExportCell(row[col.key], col.type ?? "string"),
      ),
    ),
  };
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
