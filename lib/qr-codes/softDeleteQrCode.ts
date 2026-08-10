import { logActivity } from "@/lib/admin/activity-log";
import { NO_COLUMNS_AVAILABLE, updateWithColumnFallback } from "@/lib/supabase/persist-with-fallback";
import { deleteQrCode } from "./deleteQrCode";
import type { QrCodeRow } from "./types";

const DELETE_ERROR = "Unable to delete QR code. Please try again.";

export async function softDeleteQrCode(
  id: string,
): Promise<{ ok: true; hard: boolean } | { ok: false; message: string }> {
  try {
    const result = await updateWithColumnFallback<QrCodeRow>(
      "qr_codes",
      { id },
      { deleted_at: new Date().toISOString() },
    );

    if (result.ok) {
      void logActivity({
        action: "qr_deleted",
        restaurantId: result.data.restaurant_id,
        entityType: "qr_code",
        entityId: id,
        oldValues: { id },
        metadata: { soft: true },
      });
      return { ok: true, hard: false };
    }

    if (result.message === NO_COLUMNS_AVAILABLE) {
      const hardResult = await deleteQrCode(id);
      if (!hardResult.ok) return hardResult;
      return { ok: true, hard: true };
    }

    return { ok: false, message: result.message };
  } catch {
    return { ok: false, message: DELETE_ERROR };
  }
}

export async function restoreQrCode(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const result = await updateWithColumnFallback<QrCodeRow>(
    "qr_codes",
    { id },
    { deleted_at: null },
  );

  if (!result.ok) {
    return { ok: false, message: result.message === NO_COLUMNS_AVAILABLE ? DELETE_ERROR : result.message };
  }

  return { ok: true };
}
