export type QrScanRow = {
  id: string;
  qr_code_id: string;
  restaurant_id: string;
  scanned_at: string;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
};

export type QrScanSummary = {
  qrCodeId: string;
  todayScans: number;
  lastScan: string | null;
};

export type QrOverviewStats = {
  total: number;
  active: number;
  totalScans: number;
  todayScans: number;
  mostScannedQr: { name: string; scans: number } | null;
  lastScan: string | null;
};

export type AnalyticsOverview = {
  totalScans: number;
  scansToday: number;
  scansThisWeek: number;
  scansThisMonth: number;
};

export type DailyScanPoint = {
  date: string;
  label: string;
  scans: number;
};

export type RankedQrCode = {
  id: string;
  name: string;
  type: string;
  tableNumber: string;
  scans: number;
};

export type RankedTable = {
  tableNumber: string;
  qrName: string;
  scans: number;
};

export type PeakHourPoint = {
  hour: number;
  label: string;
  scans: number;
};

export type PeakDayPoint = {
  day: number;
  label: string;
  scans: number;
};

export type DeviceBreakdown = {
  mobile: number;
  desktop: number;
  tablet: number;
  unknown: number;
};

export type AnalyticsRange = "week" | "month" | "quarter" | "year";

export type AnalyticsDashboardData = {
  overview: AnalyticsOverview;
  dailyScans: DailyScanPoint[];
  topQrCodes: RankedQrCode[];
  topTables: RankedTable[];
  mostScannedQr: RankedQrCode | null;
  leastScannedQr: RankedQrCode | null;
  peakHours: PeakHourPoint[];
  peakDays: PeakDayPoint[];
  deviceBreakdown: DeviceBreakdown;
};
