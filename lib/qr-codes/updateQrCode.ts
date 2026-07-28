import type { QrCodeItem, QrMode, QrStatus } from "@/lib/dashboard/qr/types";
import { buildQrDestinationUrl, getAppBaseUrl } from "@/lib/dashboard/qr/utils";
import { supabase } from "@/lib/supabase";
import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import { updateWithColumnFallback } from "@/lib/supabase/persist-with-fallback";
import { mapQrCodeRowWithScanStats } from "./enrichQrCodeItem";
import { mapStatusToIsActive } from "./mappers";
import type { QrCodeRow } from "./types";
const UPDATE_ERROR = "Unable to update QR code. Please try again.";

export interface QrDetailsUpdate {
  area?: string;
  tableNumber?: string;
  mode?: QrMode;
  expiresAt?: string | null;
  passwordProtected?: boolean;
  accessPassword?: string | null;
  scanLimit?: number | null;
}

export async function updateQrCodeDetails(
  id: string,
  updates: QrDetailsUpdate,
): Promise<{ ok: true; data: QrCodeItem } | { ok: false; message: string }> {
  try {
    const restaurant = await fetchUserRestaurant();

    const payload: Record<string, unknown> = {};
    if (updates.area !== undefined) payload.table_area = updates.area.trim() || null;
    if (updates.tableNumber !== undefined) {
      const tableNumber = updates.tableNumber.trim() || null;
      payload.table_number = tableNumber;
      if (restaurant?.slug) {
        payload.destination_url = buildQrDestinationUrl(
          restaurant.slug,
          getAppBaseUrl(),
          tableNumber,
        );
      }
    }
    if (updates.mode !== undefined) payload.qr_mode = updates.mode;
    if (updates.expiresAt !== undefined) payload.expires_at = updates.expiresAt;
    if (updates.passwordProtected !== undefined) payload.password_protected = updates.passwordProtected;
    if (updates.accessPassword !== undefined) payload.access_password = updates.accessPassword;
    if (updates.scanLimit !== undefined) payload.scan_limit = updates.scanLimit;

    const result = await updateWithColumnFallback<QrCodeRow>("qr_codes", { id }, payload);

    if (!result.ok) {
      return { ok: false, message: result.message === "NO_COLUMNS_AVAILABLE" ? UPDATE_ERROR : result.message };
    }

    return {
      ok: true,
      data: await mapQrCodeRowWithScanStats(result.data, restaurant?.timezone),
    };
  } catch {
    return { ok: false, message: UPDATE_ERROR };
  }
}

export async function renameQrCode(
  id: string,
  name: string,
): Promise<
  { ok: true; data: QrCodeItem } | { ok: false; message: string }
> {
  try {
    const trimmedName = name.trim();
    const restaurant = await fetchUserRestaurant();

    if (!trimmedName) {
      return { ok: false, message: "QR name is required." };
    }

    const { data, error } = await supabase
      .from("qr_codes")
      .update({ name: trimmedName })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: UPDATE_ERROR };
    }

    return {
      ok: true,
      data: await mapQrCodeRowWithScanStats(data as QrCodeRow, restaurant?.timezone),
    };
  } catch {
    return { ok: false, message: UPDATE_ERROR };
  }
}

export async function updateQrCodeStatus(
  id: string,
  status: QrStatus,
): Promise<
  { ok: true; data: QrCodeItem } | { ok: false; message: string }
> {
  try {
    const restaurant = await fetchUserRestaurant();

    const { data, error } = await supabase
      .from("qr_codes")
      .update({ is_active: mapStatusToIsActive(status) })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: UPDATE_ERROR };
    }

    return {
      ok: true,
      data: await mapQrCodeRowWithScanStats(data as QrCodeRow, restaurant?.timezone),
    };
  } catch {
    return { ok: false, message: UPDATE_ERROR };
  }
}
