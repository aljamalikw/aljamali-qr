import type { QrCodeItem, QrCreateFormData, QrMode, QrStatus } from "@/lib/dashboard/qr/types";
import { buildQrScanUrl } from "@/lib/dashboard/qr/utils";
import type { QrScanSummary } from "@/lib/qr-analytics/types";
import type { QrCodeInsert, QrCodeRow } from "./types";

export function mapQrCodeRowToItem(
  row: QrCodeRow,
  scanSummary?: QrScanSummary,
): QrCodeItem {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.is_active ? "active" : "inactive",
    tableNumber: row.table_number?.trim() ?? "",
    area: row.table_area?.trim() ?? "",
    description: row.description?.trim() ?? "",
    url: buildQrScanUrl(row.id),
    destinationUrl: row.destination_url,
    totalScans: row.scans_count,
    todayScans: scanSummary?.todayScans ?? 0,
    lastScan: scanSummary?.lastScan ?? null,
    mode: (row.qr_mode as QrMode) ?? "dynamic",
    expiresAt: row.expires_at ?? null,
    passwordProtected: row.password_protected ?? false,
    scanLimit: row.scan_limit ?? null,
    isArchived: row.is_archived ?? false,
    deletedAt: row.deleted_at ?? null,
    createdAt: row.created_at,
  };
}

export function mapQrFormToInsert(
  form: QrCreateFormData,
  restaurantId: string,
  destinationUrl: string,
): QrCodeInsert {
  return {
    restaurant_id: restaurantId,
    name: form.name.trim(),
    type: form.type,
    destination_url: destinationUrl,
    table_number: form.tableNumber.trim() || null,
    description: form.description.trim() || null,
    is_active: form.status === "active",
    table_area: form.area.trim() || null,
    qr_mode: form.mode,
    expires_at: form.expiresAt.trim() || null,
    password_protected: form.passwordProtected,
    access_password: form.passwordProtected ? form.accessPassword.trim() || null : null,
    scan_limit: form.scanLimit.trim() ? Number(form.scanLimit) : null,
  };
}

export function mapStatusToIsActive(status: QrStatus): boolean {
  return status === "active";
}

export function mapDuplicateRowToInsert(
  source: QrCodeRow,
  name: string,
  destinationUrl: string,
): QrCodeInsert {
  return {
    restaurant_id: source.restaurant_id,
    name,
    type: source.type,
    destination_url: destinationUrl,
    table_number: source.table_number,
    description: source.description,
    is_active: source.is_active,
    table_area: source.table_area ?? null,
    qr_mode: (source.qr_mode as QrMode) ?? "dynamic",
    expires_at: source.expires_at ?? null,
    password_protected: source.password_protected ?? false,
    access_password: source.access_password ?? null,
    scan_limit: source.scan_limit ?? null,
  };
}
