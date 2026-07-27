import { getQrTypeLabel } from "./seed-data";
import type {
  QrCodeItem,
  QrCreateFormData,
  QrOverviewStats,
  QrSortOption,
  QrStatusFilter,
  QrTypeFilter,
} from "./types";

export function generateQrId(): string {
  return `qr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function isLocalOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

function toAbsoluteBaseUrl(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  return trimTrailingSlash(
    /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
  );
}

function resolvePublicBaseUrlFromEnv(): string {
  // Keep direct process.env.NEXT_PUBLIC_* member access so Next can inline them.
  const fromAppUrl = toAbsoluteBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (fromAppUrl) return fromAppUrl;

  const fromSiteUrl = toAbsoluteBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (fromSiteUrl) return fromSiteUrl;

  if (typeof window !== "undefined") {
    return "";
  }

  const vercelProduction = toAbsoluteBaseUrl(
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  );
  if (vercelProduction) return vercelProduction;

  return toAbsoluteBaseUrl(process.env.VERCEL_URL);
}

export function getAppBaseUrl(): string {
  const fromEnv = resolvePublicBaseUrlFromEnv();
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // Never use localhost/loopback for stored or encoded QR URLs.
    if (origin && !isLocalOrigin(origin)) {
      return trimTrailingSlash(origin);
    }
  }

  return "";
}

export function buildQrDestinationUrl(
  restaurantSlug: string | null | undefined,
  baseUrl?: string,
  tableNumber?: string | null,
): string {
  const slug = restaurantSlug?.trim();
  if (!slug) return "";

  const base = (baseUrl ?? getAppBaseUrl()).trim();
  if (!base) return "";

  const url = `${base}/menu/${slug}`;
  const table = tableNumber?.trim();
  if (!table) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}table=${encodeURIComponent(table)}`;
}

export function buildQrScanUrl(qrId: string, baseUrl?: string): string {
  const id = qrId?.trim();
  if (!id) return "";

  const base = (baseUrl ?? getAppBaseUrl()).trim();
  if (!base) return "";

  return `${base}/api/qr/${id}`;
}

/** @deprecated Use buildQrDestinationUrl for menu URLs or buildQrScanUrl for encoded QR values. */
export function buildQrUrl(restaurantSlug: string | null | undefined): string {
  return buildQrDestinationUrl(restaurantSlug);
}

export function createEmptyQrForm(): QrCreateFormData {
  return {
    name: "",
    type: "restaurant-table",
    tableNumber: "",
    area: "",
    description: "",
    status: "active",
    mode: "dynamic",
    expiresAt: "",
    passwordProtected: false,
    accessPassword: "",
    scanLimit: "",
  };
}

export function formToQrItem(
  data: QrCreateFormData,
  restaurantSlug: string | null | undefined,
  id?: string,
): QrCodeItem {
  const itemId = id ?? generateQrId();
  const baseUrl = getAppBaseUrl();
  const tableNumber = data.tableNumber.trim();
  const destinationUrl = buildQrDestinationUrl(restaurantSlug, baseUrl, tableNumber);
  return {
    id: itemId,
    name: data.name.trim(),
    type: data.type,
    status: data.status,
    tableNumber,
    area: data.area.trim(),
    description: data.description.trim(),
    url: buildQrScanUrl(itemId, baseUrl),
    destinationUrl,
    totalScans: 0,
    todayScans: 0,
    lastScan: null,
    mode: data.mode,
    expiresAt: data.expiresAt.trim() || null,
    passwordProtected: data.passwordProtected,
    scanLimit: data.scanLimit.trim() ? Number(data.scanLimit) : null,
    isArchived: false,
    deletedAt: null,
    createdAt: new Date().toISOString(),
  };
}

export function duplicateQrItem(
  item: QrCodeItem,
  restaurantSlug: string | null | undefined,
): QrCodeItem {
  const nextId = generateQrId();
  const baseUrl = getAppBaseUrl();
  return {
    ...item,
    id: nextId,
    name: `${item.name} (Copy)`,
    url: buildQrScanUrl(nextId, baseUrl),
    destinationUrl: buildQrDestinationUrl(restaurantSlug, baseUrl, item.tableNumber),
    totalScans: 0,
    todayScans: 0,
    lastScan: null,
    isArchived: false,
    deletedAt: null,
    createdAt: new Date().toISOString(),
  };
}

export function computeOverviewStats(items: QrCodeItem[]): QrOverviewStats {
  return {
    total: items.length,
    active: items.filter((i) => i.status === "active").length,
    totalScans: items.reduce((sum, i) => sum + i.totalScans, 0),
    todayScans: items.reduce((sum, i) => sum + i.todayScans, 0),
  };
}

export interface QrFilterParams {
  search: string;
  status: QrStatusFilter;
  type: QrTypeFilter;
  sort: QrSortOption;
  showArchived?: boolean;
}

export function filterAndSortQrCodes(
  items: QrCodeItem[],
  params: QrFilterParams,
): QrCodeItem[] {
  const query = params.search.trim().toLowerCase();

  let result = items.filter((item) => {
    if (!params.showArchived && item.isArchived) return false;
    if (params.status !== "all" && item.status !== params.status) return false;
    if (params.type !== "all" && item.type !== params.type) return false;
    if (!query) return true;
    return (
      item.name.toLowerCase().includes(query) ||
      getQrTypeLabel(item.type).toLowerCase().includes(query) ||
      item.tableNumber.toLowerCase().includes(query) ||
      item.area.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
  });

  result = [...result].sort((a, b) => {
    switch (params.sort) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "scans":
        return b.totalScans - a.totalScans;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return result;
}

export function formatQrDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatLastScan(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatQrDate(iso);
}

export function validateQrForm(data: QrCreateFormData): string | null {
  if (!data.name.trim()) return "QR name is required.";
  if (data.scanLimit.trim() && (Number.isNaN(Number(data.scanLimit)) || Number(data.scanLimit) <= 0)) {
    return "Scan limit must be a positive number.";
  }
  if (data.passwordProtected && !data.accessPassword.trim()) {
    return "Please set a password or disable password protection.";
  }
  return null;
}

/** Parses a table range/list string like "1-6, 8, 10-12" into individual table numbers. */
export function parseTableNumberRanges(input: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (rangeMatch) {
        const start = Number(rangeMatch[1]);
        const end = Number(rangeMatch[2]);
        const [from, to] = start <= end ? [start, end] : [end, start];
        for (let n = from; n <= to; n += 1) {
          const value = String(n);
          if (!seen.has(value)) {
            seen.add(value);
            result.push(value);
          }
        }
      } else if (!seen.has(part)) {
        seen.add(part);
        result.push(part);
      }
    });

  return result;
}
