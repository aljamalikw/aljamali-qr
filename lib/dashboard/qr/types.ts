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
export type QrMode = "dynamic" | "permanent";

export interface QrCodeItem {
  id: string;
  name: string;
  type: QrType;
  status: QrStatus;
  tableNumber: string;
  area: string;
  description: string;
  url: string;
  destinationUrl: string;
  totalScans: number;
  todayScans: number;
  lastScan: string | null;
  mode: QrMode;
  expiresAt: string | null;
  passwordProtected: boolean;
  scanLimit: number | null;
  isArchived: boolean;
  deletedAt: string | null;
  createdAt: string;
}

export interface QrCreateFormData {
  name: string;
  type: QrType;
  tableNumber: string;
  area: string;
  description: string;
  status: QrStatus;
  mode: QrMode;
  expiresAt: string;
  passwordProtected: boolean;
  accessPassword: string;
  scanLimit: string;
}

export interface BulkQrGenerateFormData {
  tableNumbers: string;
  area: string;
  type: QrType;
  mode: QrMode;
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
