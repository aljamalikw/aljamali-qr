import { exportDatasetCsv, exportEmptyDatasetCsv } from "./export-csv";
import { exportDatasetExcel, exportEmptyDatasetExcel } from "./export-excel";
import { exportDatasetPdf, exportEmptyDatasetPdf } from "./export-pdf";
import { exportDatasetDocx, exportEmptyDatasetDocx } from "./export-word";
import type { ExportDataset, ExportFormat, ExportResult } from "./types";

export async function runExport(
  format: ExportFormat,
  dataset: ExportDataset,
): Promise<ExportResult> {
  const generatedAt = dataset.meta.generatedAt ?? new Date();
  const payload: ExportDataset = {
    ...dataset,
    meta: { ...dataset.meta, generatedAt },
  };

  if (payload.rows.length === 0 && format === "csv") {
    exportEmptyDatasetCsv(payload);
    return { ok: true };
  }

  if (payload.rows.length === 0 && format === "xlsx") {
    exportEmptyDatasetExcel(payload);
    return { ok: true };
  }

  if (payload.rows.length === 0 && format === "pdf") {
    const opened = exportEmptyDatasetPdf(payload);
    return opened
      ? { ok: true }
      : { ok: false, message: "Could not open the print window. Please allow pop-ups." };
  }

  if (payload.rows.length === 0 && format === "docx") {
    await exportEmptyDatasetDocx(payload);
    return { ok: true };
  }

  if (payload.rows.length === 0) {
    return { ok: false, message: "No data matches the current filters.", empty: true };
  }

  try {
    switch (format) {
      case "csv":
        exportDatasetCsv(payload);
        return { ok: true };
      case "xlsx":
        exportDatasetExcel(payload);
        return { ok: true };
      case "pdf": {
        const opened = exportDatasetPdf(payload);
        return opened
          ? { ok: true }
          : {
              ok: false,
              message: "Could not open the print window. Please allow pop-ups.",
            };
      }
      case "docx":
        await exportDatasetDocx(payload);
        return { ok: true };
      default:
        return { ok: false, message: "Unsupported export format." };
    }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Could not generate export. Please try again.",
    };
  }
}

export function exportFormatLoadingLabel(format: ExportFormat): string {
  switch (format) {
    case "csv":
      return "Preparing CSV export…";
    case "xlsx":
      return "Preparing Excel export…";
    case "pdf":
      return "Generating PDF…";
    case "docx":
      return "Generating Word export…";
    default:
      return "Preparing export…";
  }
}

export function exportFormatSuccessLabel(format: ExportFormat): string {
  switch (format) {
    case "pdf":
      return "Print dialog opened — save as PDF when ready.";
    default:
      return "Export ready";
  }
}
