import type { QrCodeItem, QrCreateFormData } from "@/lib/dashboard/qr/types";
import {
  buildQrDestinationUrl,
  getAppBaseUrl,
} from "@/lib/dashboard/qr/utils";
import { fetchQrScanSummaries } from "@/lib/qr-analytics/queries";
import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import { insertWithColumnFallback } from "@/lib/supabase/persist-with-fallback";
import { mapQrCodeRowToItem, mapQrFormToInsert } from "./mappers";
import type { QrCodeRow } from "./types";

const CREATE_ERROR = "Unable to create QR code. Please try again.";
const DESTINATION_ERROR =
  "Unable to generate destination URL. Set NEXT_PUBLIC_APP_URL to your public base URL.";

export async function createQrCode(
  form: QrCreateFormData,
): Promise<
  { ok: true; data: QrCodeItem } | { ok: false; message: string }
> {
  try {
    const restaurant = await fetchUserRestaurant();

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

    const result = await insertWithColumnFallback<QrCodeRow>("qr_codes", payload);

    if (!result.ok) {
      return { ok: false, message: result.message === "NO_COLUMNS_AVAILABLE" ? CREATE_ERROR : result.message };
    }

    const row = result.data;
    const scanSummaries = await fetchQrScanSummaries(restaurant.id, restaurant.timezone);
    const scanSummary = scanSummaries.ok
      ? scanSummaries.data.get(row.id)
      : undefined;

    return { ok: true, data: mapQrCodeRowToItem(row, scanSummary) };
  } catch {
    return { ok: false, message: CREATE_ERROR };
  }
}
