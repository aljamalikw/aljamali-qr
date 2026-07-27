import type { QrCodeItem } from "@/lib/dashboard/qr/types";
import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import { updateWithColumnFallback } from "@/lib/supabase/persist-with-fallback";
import { mapQrCodeRowWithScanStats } from "./enrichQrCodeItem";
import type { QrCodeRow } from "./types";

const ARCHIVE_ERROR = "Unable to update QR code. Please try again.";

export async function setQrCodeArchived(
  id: string,
  archived: boolean,
): Promise<{ ok: true; data: QrCodeItem } | { ok: false; message: string }> {
  try {
    const restaurant = await fetchUserRestaurant();

    const result = await updateWithColumnFallback<QrCodeRow>(
      "qr_codes",
      { id },
      { is_archived: archived },
    );

    if (!result.ok) {
      return { ok: false, message: result.message === "NO_COLUMNS_AVAILABLE" ? ARCHIVE_ERROR : result.message };
    }

    return { ok: true, data: await mapQrCodeRowWithScanStats(result.data, restaurant?.timezone) };
  } catch {
    return { ok: false, message: ARCHIVE_ERROR };
  }
}
