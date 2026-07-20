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

export function buildQrUrl(name: string, type: string, tableNumber: string): string {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const table = tableNumber ? `&table=${tableNumber}` : "";
  return `https://aljamaliqr.com/demo?qr=${slug}&type=${type}${table}`;
}

export function createEmptyQrForm(): QrCreateFormData {
  return {
    name: "",
    type: "restaurant-table",
    tableNumber: "",
    description: "",
    status: "active",
  };
}

export function formToQrItem(data: QrCreateFormData, id?: string): QrCodeItem {
  const itemId = id ?? generateQrId();
  return {
    id: itemId,
    name: data.name.trim(),
    type: data.type,
    status: data.status,
    tableNumber: data.tableNumber.trim(),
    description: data.description.trim(),
    url: buildQrUrl(data.name, data.type, data.tableNumber),
    totalScans: 0,
    todayScans: 0,
    lastScan: null,
    createdAt: new Date().toISOString(),
  };
}

export function duplicateQrItem(item: QrCodeItem): QrCodeItem {
  return {
    ...item,
    id: generateQrId(),
    name: `${item.name} (Copy)`,
    url: buildQrUrl(`${item.name} (Copy)`, item.type, item.tableNumber),
    totalScans: 0,
    todayScans: 0,
    lastScan: null,
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
}

export function filterAndSortQrCodes(
  items: QrCodeItem[],
  params: QrFilterParams,
): QrCodeItem[] {
  const query = params.search.trim().toLowerCase();

  let result = items.filter((item) => {
    if (params.status !== "all" && item.status !== params.status) return false;
    if (params.type !== "all" && item.type !== params.type) return false;
    if (!query) return true;
    return (
      item.name.toLowerCase().includes(query) ||
      getQrTypeLabel(item.type).toLowerCase().includes(query) ||
      item.tableNumber.toLowerCase().includes(query) ||
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
  return null;
}
