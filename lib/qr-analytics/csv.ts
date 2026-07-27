import type { AnalyticsDashboardData } from "./types";

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function exportAnalyticsToCsv(data: AnalyticsDashboardData): string {
  const lines: string[] = [];

  lines.push("Daily Scans");
  lines.push("Date,Scans");
  data.dailyScans.forEach((point) => {
    lines.push([point.date, String(point.scans)].map(escapeCell).join(","));
  });

  lines.push("");
  lines.push("Top QR Codes");
  lines.push("Rank,Name,Type,Scans");
  data.topQrCodes.forEach((item, index) => {
    lines.push(
      [String(index + 1), item.name, item.type, String(item.scans)].map(escapeCell).join(","),
    );
  });

  lines.push("");
  lines.push("Peak Hours");
  lines.push("Hour,Scans");
  data.peakHours.forEach((point) => {
    lines.push([point.label, String(point.scans)].map(escapeCell).join(","));
  });

  lines.push("");
  lines.push("Peak Days");
  lines.push("Day,Scans");
  data.peakDays.forEach((point) => {
    lines.push([point.label, String(point.scans)].map(escapeCell).join(","));
  });

  lines.push("");
  lines.push("Device Breakdown");
  lines.push("Device,Scans");
  lines.push(`Mobile,${data.deviceBreakdown.mobile}`);
  lines.push(`Desktop,${data.deviceBreakdown.desktop}`);
  lines.push(`Tablet,${data.deviceBreakdown.tablet}`);
  lines.push(`Unknown,${data.deviceBreakdown.unknown}`);

  return lines.join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
