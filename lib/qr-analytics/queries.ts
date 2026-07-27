import type { QrCodeRow } from "@/lib/qr-codes/types";
import { supabase } from "@/lib/supabase";
import {
  getDaysAgoIso,
  getStartOfMonthIso,
  getStartOfTodayIso,
  getStartOfWeekIso,
  buildDailyScanSeries,
  buildPeakDaySeries,
  buildPeakHourSeries,
} from "./time";
import type {
  AnalyticsDashboardData,
  AnalyticsOverview,
  AnalyticsRange,
  DeviceBreakdown,
  QrOverviewStats,
  QrScanSummary,
  RankedQrCode,
  RankedTable,
} from "./types";

const QUERY_ERROR = "Unable to load QR analytics. Please try again.";

type ScanTimestampRow = {
  qr_code_id: string;
  scanned_at: string;
  user_agent: string | null;
};

const RANGE_DAYS: Record<AnalyticsRange, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

function detectDeviceBreakdown(userAgents: (string | null)[]): DeviceBreakdown {
  const breakdown: DeviceBreakdown = { mobile: 0, desktop: 0, tablet: 0, unknown: 0 };

  for (const ua of userAgents) {
    if (!ua) {
      breakdown.unknown += 1;
      continue;
    }
    const lower = ua.toLowerCase();
    if (/ipad|tablet|(android(?!.*mobile))/.test(lower)) {
      breakdown.tablet += 1;
    } else if (/mobile|iphone|android|phone/.test(lower)) {
      breakdown.mobile += 1;
    } else if (/mozilla|windows|macintosh|linux/.test(lower)) {
      breakdown.desktop += 1;
    } else {
      breakdown.unknown += 1;
    }
  }

  return breakdown;
}

function mapRankedQr(row: QrCodeRow): RankedQrCode {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    tableNumber: row.table_number?.trim() ?? "",
    scans: row.scans_count,
  };
}

async function fetchRestaurantQrCodes(restaurantId: string) {
  return supabase
    .from("qr_codes")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("scans_count", { ascending: false });
}

async function countScansSince(restaurantId: string, sinceIso: string) {
  return supabase
    .from("qr_code_scans")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .gte("scanned_at", sinceIso);
}

async function fetchRecentScans(restaurantId: string, sinceIso: string) {
  const withUserAgent = await supabase
    .from("qr_code_scans")
    .select("qr_code_id, scanned_at, user_agent")
    .eq("restaurant_id", restaurantId)
    .gte("scanned_at", sinceIso)
    .order("scanned_at", { ascending: false });

  if (!withUserAgent.error) return withUserAgent;

  const withoutUserAgent = await supabase
    .from("qr_code_scans")
    .select("qr_code_id, scanned_at")
    .eq("restaurant_id", restaurantId)
    .gte("scanned_at", sinceIso)
    .order("scanned_at", { ascending: false });

  return {
    ...withoutUserAgent,
    data: withoutUserAgent.data?.map((row) => ({ ...row, user_agent: null })) ?? null,
  };
}

async function fetchLatestScan(restaurantId: string) {
  return supabase
    .from("qr_code_scans")
    .select("scanned_at")
    .eq("restaurant_id", restaurantId)
    .order("scanned_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function fetchQrScanSummaries(
  restaurantId: string,
  timezone?: string | null,
): Promise<
  { ok: true; data: Map<string, QrScanSummary> } | { ok: false; message: string }
> {
  try {
    const todayStartIso = getStartOfTodayIso(timezone);
    const { data, error } = await supabase.rpc("get_qr_scan_summaries", {
      p_restaurant_id: restaurantId,
      p_today_start: todayStartIso,
    });

    if (error) {
      return { ok: false, message: QUERY_ERROR };
    }

    const summaries = new Map<string, QrScanSummary>();

    for (const row of data ?? []) {
      summaries.set(row.qr_code_id, {
        qrCodeId: row.qr_code_id,
        todayScans: Number(row.today_scans ?? 0),
        lastScan: row.last_scan ?? null,
      });
    }

    return { ok: true, data: summaries };
  } catch {
    return { ok: false, message: QUERY_ERROR };
  }
}

export async function fetchQrOverviewStats(
  restaurantId: string,
  timezone?: string | null,
): Promise<
  { ok: true; data: QrOverviewStats } | { ok: false; message: string }
> {
  try {
    const todayStartIso = getStartOfTodayIso(timezone);

    const [qrCodesResult, todayScansResult, latestScanResult] = await Promise.all([
      fetchRestaurantQrCodes(restaurantId),
      countScansSince(restaurantId, todayStartIso),
      fetchLatestScan(restaurantId),
    ]);

    if (qrCodesResult.error || todayScansResult.error || latestScanResult.error) {
      return { ok: false, message: QUERY_ERROR };
    }

    const qrCodes = (qrCodesResult.data ?? []) as QrCodeRow[];
    const mostScanned = qrCodes[0];

    return {
      ok: true,
      data: {
        total: qrCodes.length,
        active: qrCodes.filter((row) => row.is_active).length,
        totalScans: qrCodes.reduce((sum, row) => sum + row.scans_count, 0),
        todayScans: todayScansResult.count ?? 0,
        mostScannedQr: mostScanned
          ? { name: mostScanned.name, scans: mostScanned.scans_count }
          : null,
        lastScan: latestScanResult.data?.scanned_at ?? null,
      },
    };
  } catch {
    return { ok: false, message: QUERY_ERROR };
  }
}

export async function fetchAnalyticsDashboard(
  restaurantId: string,
  timezone?: string | null,
  range: AnalyticsRange = "month",
): Promise<
  { ok: true; data: AnalyticsDashboardData } | { ok: false; message: string }
> {
  try {
    const rangeDays = RANGE_DAYS[range];
    const todayStartIso = getStartOfTodayIso(timezone);
    const weekStartIso = getStartOfWeekIso(timezone);
    const monthStartIso = getStartOfMonthIso(timezone);
    const rangeStartIso = getDaysAgoIso(rangeDays, timezone);

    const [
      qrCodesResult,
      totalScansTodayResult,
      totalScansWeekResult,
      totalScansMonthResult,
      recentScansResult,
    ] = await Promise.all([
      fetchRestaurantQrCodes(restaurantId),
      countScansSince(restaurantId, todayStartIso),
      countScansSince(restaurantId, weekStartIso),
      countScansSince(restaurantId, monthStartIso),
      fetchRecentScans(restaurantId, rangeStartIso),
    ]);

    if (
      qrCodesResult.error ||
      totalScansTodayResult.error ||
      totalScansWeekResult.error ||
      totalScansMonthResult.error ||
      recentScansResult.error
    ) {
      return { ok: false, message: QUERY_ERROR };
    }

    const qrCodes = (qrCodesResult.data ?? []) as QrCodeRow[];
    const ranked = qrCodes.map(mapRankedQr);
    const topQrCodes = [...ranked].sort((a, b) => b.scans - a.scans).slice(0, 10);
    const activeRanked = ranked.filter((item) => item.scans > 0);
    const mostScannedQr = activeRanked[0] ?? null;
    const leastScannedQr =
      activeRanked.length > 0 ? activeRanked[activeRanked.length - 1] : null;

    const topTables = ranked
      .filter((item) => item.type === "restaurant-table" && item.tableNumber)
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 10)
      .map(
        (item): RankedTable => ({
          tableNumber: item.tableNumber,
          qrName: item.name,
          scans: item.scans,
        }),
      );

    const overview: AnalyticsOverview = {
      totalScans: qrCodes.reduce((sum, row) => sum + row.scans_count, 0),
      scansToday: totalScansTodayResult.count ?? 0,
      scansThisWeek: totalScansWeekResult.count ?? 0,
      scansThisMonth: totalScansMonthResult.count ?? 0,
    };

    const recentScans = (recentScansResult.data ?? []) as ScanTimestampRow[];
    const scanTimestamps = recentScans.map((row) => row.scanned_at);

    const dailyScans = buildDailyScanSeries(scanTimestamps, rangeDays, timezone);
    const peakHours = buildPeakHourSeries(scanTimestamps, timezone);
    const peakDays = buildPeakDaySeries(scanTimestamps, timezone);
    const deviceBreakdown = detectDeviceBreakdown(recentScans.map((row) => row.user_agent));

    return {
      ok: true,
      data: {
        overview,
        dailyScans,
        topQrCodes,
        topTables,
        mostScannedQr,
        leastScannedQr,
        peakHours,
        peakDays,
        deviceBreakdown,
      },
    };
  } catch {
    return { ok: false, message: QUERY_ERROR };
  }
}
