import type { QrType } from "@/lib/dashboard/qr/types";

export type QrCodeRow = {
  id: string;
  restaurant_id: string;
  name: string;
  type: QrType;
  destination_url: string;
  table_number: string | null;
  description: string | null;
  is_active: boolean;
  scans_count: number;
  table_area?: string | null;
  qr_mode?: "dynamic" | "permanent" | null;
  expires_at?: string | null;
  password_protected?: boolean | null;
  access_password?: string | null;
  scan_limit?: number | null;
  is_archived?: boolean | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type QrCodeInsert = {
  restaurant_id: string;
  name: string;
  type: QrType;
  destination_url: string;
  table_number: string | null;
  description: string | null;
  is_active: boolean;
  table_area?: string | null;
  qr_mode?: "dynamic" | "permanent";
  expires_at?: string | null;
  password_protected?: boolean;
  access_password?: string | null;
  scan_limit?: number | null;
};
