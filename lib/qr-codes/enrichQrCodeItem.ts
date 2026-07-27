import { fetchQrScanSummaries } from "@/lib/qr-analytics/queries";
import type { QrCodeItem } from "@/lib/dashboard/qr/types";
import { mapQrCodeRowToItem } from "./mappers";
import type { QrCodeRow } from "./types";

export async function mapQrCodeRowWithScanStats(
  row: QrCodeRow,
  timezone?: string | null,
): Promise<QrCodeItem> {
  const summaries = await fetchQrScanSummaries(row.restaurant_id, timezone);
  const summary = summaries.ok ? summaries.data.get(row.id) : undefined;
  return mapQrCodeRowToItem(row, summary);
}
