import * as XLSX from "xlsx";
import { formatExportCell } from "./formatters";
import { buildExportFilename, downloadBinary } from "./filenames";
import type { ExportColumn, ExportDataset, ExportSheet } from "./types";

function sheetFromData(
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  sheetName: string,
): XLSX.WorkSheet {
  const headerRow = columns.map((col) => col.header);
  const dataRows = rows.map((row) =>
    columns.map((col) => {
      const raw = row[col.key];
      if (col.type === "number" || col.type === "currency") {
        const n = Number(raw);
        return Number.isFinite(n) ? n : formatExportCell(raw, col.type);
      }
      if (col.type === "date" || col.type === "datetime") {
        return formatExportCell(raw, col.type);
      }
      return raw ?? "";
    }),
  );

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  const colWidths = columns.map((col, index) => {
    const maxLen = Math.max(
      col.header.length,
      ...dataRows.map((row) => String(row[index] ?? "").length),
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 48) };
  });
  ws["!cols"] = colWidths;
  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(rows.length, 0), c: columns.length - 1 },
    }),
  };
  return ws;
}

function summarySheet(dataset: ExportDataset): XLSX.WorkSheet | null {
  if (!dataset.summary?.length && !dataset.meta.filterSummary?.length) {
    return null;
  }
  const rows: string[][] = [
    ["Report", dataset.meta.title],
    ["Restaurant", dataset.meta.restaurantName ?? ""],
    ["Date range", dataset.meta.dateRangeLabel ?? ""],
    ["Generated", formatExportCell(dataset.meta.generatedAt ?? new Date(), "datetime")],
  ];
  if (dataset.meta.filterSummary?.length) {
    rows.push(["Filters", dataset.meta.filterSummary.join("; ")]);
  }
  rows.push([]);
  if (dataset.summary?.length) {
    rows.push(["Summary", ""]);
    for (const item of dataset.summary) {
      rows.push([item.label, item.value]);
    }
  }
  return XLSX.utils.aoa_to_sheet(rows);
}

function appendSheet(
  wb: XLSX.WorkBook,
  sheet: ExportSheet | { name: string; columns: ExportColumn[]; rows: Record<string, unknown>[] },
): void {
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromData(sheet.columns, sheet.rows, sheet.name),
    sheet.name.slice(0, 31),
  );
}

export function exportDatasetExcel(dataset: ExportDataset): void {
  const wb = XLSX.utils.book_new();
  const summary = summarySheet(dataset);
  if (summary) {
    XLSX.utils.book_append_sheet(wb, summary, "Summary");
  }

  if (dataset.sheets?.length) {
    for (const sheet of dataset.sheets) {
      appendSheet(wb, sheet);
    }
  } else {
    appendSheet(wb, {
      name: dataset.meta.title.slice(0, 31) || "Data",
      columns: dataset.columns,
      rows: dataset.rows,
    });
  }

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBinary(
    buildExportFilename(dataset.filenamePrefix, "xlsx", {
      dateRangeLabel: dataset.meta.dateRangeLabel,
    }),
    buffer,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}

export function exportEmptyDatasetExcel(dataset: ExportDataset): void {
  exportDatasetExcel({
    ...dataset,
    rows: [],
    summary: [{ label: "Records", value: "No records match the current filters." }],
  });
}
