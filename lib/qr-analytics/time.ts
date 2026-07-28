const DEFAULT_TIMEZONE = "Asia/Kuwait";

function getDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
  };
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  timeZone: string,
): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(utcGuess);

  const lookup = Object.fromEntries(formatted.map((part) => [part.type, part.value]));
  const localAsUtc = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour),
    0,
    0,
    0,
  );

  const offsetMs = localAsUtc - utcGuess.getTime();
  return new Date(utcGuess.getTime() - offsetMs);
}

export function getTimezoneOrDefault(timezone?: string | null): string {
  return timezone?.trim() || DEFAULT_TIMEZONE;
}

export function getStartOfTodayIso(timezone?: string | null): string {
  const tz = getTimezoneOrDefault(timezone);
  const now = new Date();
  const { year, month, day } = getDateParts(now, tz);
  return zonedTimeToUtc(year, month, day, tz).toISOString();
}

export function getStartOfWeekIso(timezone?: string | null): string {
  const tz = getTimezoneOrDefault(timezone);
  const now = new Date();
  const { year, month, day } = getDateParts(now, tz);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  }).format(now);

  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  const start = zonedTimeToUtc(year, month, day, tz);
  start.setUTCDate(start.getUTCDate() - weekdayIndex);
  return start.toISOString();
}

export function getStartOfMonthIso(timezone?: string | null): string {
  const tz = getTimezoneOrDefault(timezone);
  const now = new Date();
  const { year, month } = getDateParts(now, tz);
  return zonedTimeToUtc(year, month, 1, tz).toISOString();
}

export function getDaysAgoIso(days: number, timezone?: string | null): string {
  const tz = getTimezoneOrDefault(timezone);
  const now = new Date();
  const { year, month, day } = getDateParts(now, tz);
  const start = zonedTimeToUtc(year, month, day, tz);
  start.setUTCDate(start.getUTCDate() - days);
  return start.toISOString();
}

export function formatDayLabel(dateIso: string, timeZone?: string | null): string {
  return new Date(dateIso).toLocaleDateString("en-GB", {
    timeZone: getTimezoneOrDefault(timeZone),
    day: "numeric",
    month: "short",
  });
}

export function getDayKey(date: Date, timeZone?: string | null): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: getTimezoneOrDefault(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function buildDailyScanSeries(
  scanDates: string[],
  days: number,
  timeZone?: string | null,
): { date: string; label: string; scans: number }[] {
  const tz = getTimezoneOrDefault(timeZone);
  const counts = new Map<string, number>();

  for (const scannedAt of scanDates) {
    const key = getDayKey(new Date(scannedAt), tz);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const series: { date: string; label: string; scans: number }[] = [];
  const now = new Date();
  const { year, month, day } = getDateParts(now, tz);
  const todayStart = zonedTimeToUtc(year, month, day, tz);

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const current = new Date(todayStart);
    current.setUTCDate(current.getUTCDate() - offset);
    const key = getDayKey(current, tz);
    series.push({
      date: key,
      label: formatDayLabel(current.toISOString(), tz),
      scans: counts.get(key) ?? 0,
    });
  }

  return series;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function buildPeakHourSeries(
  scanDates: string[],
  timeZone?: string | null,
): { hour: number; label: string; scans: number }[] {
  const tz = getTimezoneOrDefault(timeZone);
  const counts = new Array(24).fill(0) as number[];

  for (const scannedAt of scanDates) {
    const hourStr = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    }).format(new Date(scannedAt));
    const hour = Number(hourStr) % 24;
    counts[hour] += 1;
  }

  return counts.map((scans, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00`,
    scans,
  }));
}

export function buildPeakDaySeries(
  scanDates: string[],
  timeZone?: string | null,
): { day: number; label: string; scans: number }[] {
  const tz = getTimezoneOrDefault(timeZone);
  const counts = new Array(7).fill(0) as number[];

  for (const scannedAt of scanDates) {
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
    }).format(new Date(scannedAt));
    const index = WEEKDAY_LABELS.indexOf(weekday);
    if (index >= 0) counts[index] += 1;
  }

  return counts.map((scans, day) => ({
    day,
    label: WEEKDAY_LABELS[day],
    scans,
  }));
}

export function summarizeScansByQrCode(
  scans: { qr_code_id: string; scanned_at: string }[],
  todayStartIso: string,
): Map<string, { todayScans: number; lastScan: string | null }> {
  const summaries = new Map<string, { todayScans: number; lastScan: string | null }>();
  const todayStart = new Date(todayStartIso).getTime();

  for (const scan of scans) {
    const existing = summaries.get(scan.qr_code_id) ?? {
      todayScans: 0,
      lastScan: null,
    };

    if (new Date(scan.scanned_at).getTime() >= todayStart) {
      existing.todayScans += 1;
    }

    if (!existing.lastScan || new Date(scan.scanned_at) > new Date(existing.lastScan)) {
      existing.lastScan = scan.scanned_at;
    }

    summaries.set(scan.qr_code_id, existing);
  }

  return summaries;
}
