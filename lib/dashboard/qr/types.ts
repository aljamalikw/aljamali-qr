export type QrType =
  | "restaurant-table"
  | "vip-room"
  | "outdoor"
  | "delivery"
  | "takeaway"
  | "kitchen"
  | "custom";

export type QrStatus = "active" | "inactive";

export type QrSortOption = "newest" | "oldest" | "scans" | "name";
export type QrStatusFilter = "all" | QrStatus;
export type QrTypeFilter = "all" | QrType;

export interface QrCodeItem {
  id: string;
  name: string;
  type: QrType;
  status: QrStatus;
  tableNumber: string;
  description: string;
  url: string;
  totalScans: number;
  todayScans: number;
  lastScan: string | null;
  createdAt: string;
}

export interface QrCreateFormData {
  name: string;
  type: QrType;
  tableNumber: string;
  description: string;
  status: QrStatus;
}

export interface QrOverviewStats {
  total: number;
  active: number;
  totalScans: number;
  todayScans: number;
}

export interface QrTypeMeta {
  value: QrType;
  label: string;
}
