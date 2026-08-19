import { logActivity } from "@/lib/admin/activity-log";
import type { QrCodeItem, QrCreateFormData } from "@/lib/dashboard/qr/types";
import {
  buildQrDestinationUrl,
  getAppBaseUrl,
} from "@/lib/dashboard/qr/utils";
import { fetchQrScanSummaries } from "@/lib/qr-analytics/queries";
import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import type { Restaurant } from "@/lib/restaurants/types";
import { insertWithColumnFallback } from "@/lib/supabase/persist-with-fallback";
import { mapQrCodeRowToItem, mapQrFormToInsert } from "./mappers";
import type { QrCodeRow } from "./types";

const CREATE_ERROR = "Unable to create QR code. Please try again.";
const DESTINATION_ERROR =
  "Unable to generate destination URL. Set NEXT_PUBLIC_APP_URL to your public base URL.";

export async function createQrCode(
  form: QrCreateFormData,
  restaurantOverride?: Restaurant | null,
): Promise<
  { ok: true; data: QrCodeItem } | { ok: false; message: string }
> {
  try {
    const restaurant = restaurantOverride ?? (await fetchUserRestaurant());

    if (!restaurant?.id) {
      return { ok: false, message: CREATE_ERROR };
    }

    if (!restaurant.slug?.trim()) {
      return {
        ok: false,
        message: "Unable to generate QR URL. Please complete restaurant setup first.",
      };
    }

    const baseUrl = getAppBaseUrl();
    const destinationUrl = buildQrDestinationUrl(
      restaurant.slug,
      baseUrl,
      form.tableNumber,
    );
    if (!baseUrl || !destinationUrl.startsWith(`${baseUrl}/menu/`)) {
      return { ok: false, message: DESTINATION_ERROR };
    }

    const payload = mapQrFormToInsert(form, restaurant.id, destinationUrl);

    console.info("[QR TRACE] create request", {
      activeRestaurantId: restaurant.id,
      ownerId: restaurant.owner_id,
      restaurantName: restaurant.restaurant_name ?? null,
      qrName: form.name.trim(),
      targetUrl: destinationUrl,
      payload: {
        restaurant_id: payload.restaurant_id,
        type: payload.type,
        table_number: payload.table_number,
      },
    });

    const result = await insertWithColumnFallback<QrCodeRow>("qr_codes", payload);

    if (!result.ok) {
      console.warn("[QR TRACE] create failed", {
        activeRestaurantId: restaurant.id,
        message: result.message,
        appliedKeys: result.appliedKeys,
      });
      return { ok: false, message: result.message === "NO_COLUMNS_AVAILABLE" ? CREATE_ERROR : result.message };
    }

    const row = result.data;
    console.info("[QR TRACE] create succeeded", {
      activeRestaurantId: restaurant.id,
      insertedRestaurantId: row.restaurant_id,
      qrId: row.id,
    });
    const scanSummaries = await fetchQrScanSummaries(restaurant.id, restaurant.timezone);
    const scanSummary = scanSummaries.ok
      ? scanSummaries.data.get(row.id)
      : undefined;

    void logActivity({
      action: "qr_generated",
      restaurantId: restaurant.id,
      ownerId: restaurant.owner_id,
      entityType: "qr_code",
      entityId: row.id,
      newValues: {
        table_number: form.tableNumber ?? null,
        destination_url: destinationUrl,
      },
    });

    return { ok: true, data: mapQrCodeRowToItem(row, scanSummary) };
  } catch (error) {
    console.error("[QR TRACE] create exception", error);
    return { ok: false, message: CREATE_ERROR };
  }
}
