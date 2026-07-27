import { supabase } from "@/lib/supabase";
import { mapReservationRow, mapReservationRowWithRestaurant } from "./mappers";
import type {
  ReservationItem,
  ReservationRow,
  ReservationRowWithRestaurant,
  ReservationWithRestaurant,
} from "./types";

const FETCH_ERROR = "Unable to load reservations. Please try again.";

/** Fetches all reservations belonging to a single restaurant (owner/member dashboard). */
export async function fetchReservationsByRestaurant(
  restaurantId: string,
): Promise<{ ok: true; data: ReservationItem[] } | { ok: false; message: string }> {
  try {
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("reservation_date", { ascending: false })
      .order("reservation_time", { ascending: false });

    if (error) return { ok: false, message: error.message || FETCH_ERROR };

    return {
      ok: true,
      data: ((data ?? []) as ReservationRow[]).map(mapReservationRow),
    };
  } catch {
    return { ok: false, message: FETCH_ERROR };
  }
}

/** Fetches every reservation across all restaurants (platform admin overview). */
export async function fetchAllReservations(): Promise<
  { ok: true; data: ReservationWithRestaurant[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("reservations")
      .select("*, restaurants(restaurant_name)")
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: error.message || FETCH_ERROR };

    return {
      ok: true,
      data: ((data ?? []) as ReservationRowWithRestaurant[]).map(
        mapReservationRowWithRestaurant,
      ),
    };
  } catch {
    return { ok: false, message: FETCH_ERROR };
  }
}
