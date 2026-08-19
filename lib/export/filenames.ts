export function exportDateStamp(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildExportFilename(
  prefix: string,
  format: string,
  options?: { dateRangeLabel?: string },
): string {
  const safePrefix = prefix.replace(/[^\w-]+/g, "_").replace(/_+/g, "_");
  const range = options?.dateRangeLabel?.trim();
  const rangeSlug = range
    ? range
        .replace(/[^\w\s-]+/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .slice(0, 40)
    : "";
  const stamp = exportDateStamp();
  const base = rangeSlug ? `${safePrefix}_${rangeSlug}_${stamp}` : `${safePrefix}_${stamp}`;
  return `${base}.${format}`;
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadBinary(
  filename: string,
  data: ArrayBuffer | Blob,
  mime: string,
): void {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  downloadBlob(filename, blob);
}

export function downloadText(filename: string, content: string, mime: string): void {
  downloadBlob(filename, new Blob([content], { type: mime }));
}
