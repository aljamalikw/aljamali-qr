/** Shared date ranges for Restaurant Intelligence dashboards. */

export type IntelligenceRangeId =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "90d"
  | "year"
  | "custom";

export type DateRange = {
  id: IntelligenceRangeId;
  start: Date;
  end: Date;
  label: string;
};

export const INTELLIGENCE_RANGE_OPTIONS: Array<{
  id: Exclude<IntelligenceRangeId, "custom">;
  label: string;
}> = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
  { id: "year", label: "Year" },
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function resolveIntelligenceRange(
  id: IntelligenceRangeId,
  customStart?: string | null,
  customEnd?: string | null,
): DateRange {
  const now = new Date();

  if (id === "custom" && customStart && customEnd) {
    return {
      id: "custom",
      start: startOfDay(new Date(customStart)),
      end: endOfDay(new Date(customEnd)),
      label: "Custom",
    };
  }

  if (id === "today") {
    return {
      id,
      start: startOfDay(now),
      end: endOfDay(now),
      label: "Today",
    };
  }

  if (id === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return {
      id,
      start: startOfDay(y),
      end: endOfDay(y),
      label: "Yesterday",
    };
  }

  const days =
    id === "7d" ? 7 : id === "30d" ? 30 : id === "90d" ? 90 : 365;
  const start = startOfDay(now);
  start.setDate(start.getDate() - (days - 1));
  return {
    id,
    start,
    end: endOfDay(now),
    label:
      INTELLIGENCE_RANGE_OPTIONS.find((o) => o.id === id)?.label ?? "Range",
  };
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatMoney(amount: number, currency = "KWD"): string {
  return `${amount.toFixed(3)} ${currency}`;
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
