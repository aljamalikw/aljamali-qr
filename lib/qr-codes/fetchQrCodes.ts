import type { QrCodeItem } from "@/lib/dashboard/qr/types";
import { supabase } from "@/lib/supabase";
import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import { fetchQrScanSummaries } from "@/lib/qr-analytics/queries";
import { mapQrCodeRowToItem } from "./mappers";
import type { QrCodeRow } from "./types";

const FETCH_ERROR = "Unable to load QR codes. Please try again.";

export async function fetchQrCodes(): Promise<
  { ok: true; data: QrCodeItem[] } | { ok: false; message: string }
> {
  try {
    const restaurant = await fetchUserRestaurant();

    if (!restaurant?.id) {
      return { ok: false, message: FETCH_ERROR };
    }

    const [qrCodesResult, scanSummariesResult] = await Promise.all([
      supabase
        .from("qr_codes")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false }),
      fetchQrScanSummaries(restaurant.id, restaurant.timezone),
    ]);

    if (qrCodesResult.error) {
      return { ok: false, message: FETCH_ERROR };
    }

    if (!scanSummariesResult.ok) {
      return { ok: false, message: scanSummariesResult.message };
    }

    return {
      ok: true,
      data: ((qrCodesResult.data ?? []) as QrCodeRow[])
        .filter((row) => !row.deleted_at)
        .map((row) => mapQrCodeRowToItem(row, scanSummariesResult.data.get(row.id))),
    };
  } catch {
    return { ok: false, message: FETCH_ERROR };
  }
}

export async function fetchQrCodesForRestaurant(
  restaurantId: string,
): Promise<
  { ok: true; data: QrCodeItem[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, message: FETCH_ERROR };
    }

    return {
      ok: true,
      data: (data as QrCodeRow[]).map((row) => mapQrCodeRowToItem(row)),
    };
  } catch {
    return { ok: false, message: FETCH_ERROR };
  }
}
