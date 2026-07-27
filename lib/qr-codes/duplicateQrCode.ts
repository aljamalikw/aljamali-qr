import type { QrCodeItem } from "@/lib/dashboard/qr/types";
import {
  buildQrDestinationUrl,
  getAppBaseUrl,
} from "@/lib/dashboard/qr/utils";
import { supabase } from "@/lib/supabase";
import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import { insertWithColumnFallback } from "@/lib/supabase/persist-with-fallback";
import { mapQrCodeRowWithScanStats } from "./enrichQrCodeItem";
import { mapDuplicateRowToInsert } from "./mappers";
import type { QrCodeRow } from "./types";

const DUPLICATE_ERROR = "Unable to duplicate QR code. Please try again.";
const DESTINATION_ERROR =
  "Unable to generate destination URL. Set NEXT_PUBLIC_APP_URL to your public base URL.";

export async function duplicateQrCode(
  id: string,
): Promise<
  { ok: true; data: QrCodeItem } | { ok: false; message: string }
> {
  try {
    const restaurant = await fetchUserRestaurant();
    if (!restaurant?.id || !restaurant.slug?.trim()) {
      return { ok: false, message: DUPLICATE_ERROR };
    }

    const { data: source, error: fetchError } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !source) {
      return { ok: false, message: DUPLICATE_ERROR };
    }

    const sourceRow = source as QrCodeRow;
    const baseUrl = getAppBaseUrl();
    const destinationUrl = buildQrDestinationUrl(
      restaurant.slug,
      baseUrl,
      sourceRow.table_number,
    );
    if (!baseUrl || !destinationUrl.startsWith(`${baseUrl}/menu/`)) {
      return { ok: false, message: DESTINATION_ERROR };
    }

    const payload = mapDuplicateRowToInsert(
      sourceRow,
      `${sourceRow.name} (Copy)`,
      destinationUrl,
    );

    const result = await insertWithColumnFallback<QrCodeRow>("qr_codes", payload);

    if (!result.ok) {
      return { ok: false, message: DUPLICATE_ERROR };
    }

    return {
      ok: true,
      data: await mapQrCodeRowWithScanStats(result.data, restaurant.timezone),
    };
  } catch {
    return { ok: false, message: DUPLICATE_ERROR };
  }
}
