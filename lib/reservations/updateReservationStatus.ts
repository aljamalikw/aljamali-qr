import { logActivity } from "@/lib/admin/activity-log";
import { supabase } from "@/lib/supabase";
import { mapReservationRow } from "./mappers";
import type {
  ReservationItem,
  ReservationRow,
  ReservationStatus,
  UpdateReservationDetailsInput,
} from "./types";

const ERROR = "Unable to update reservation. Please try again.";

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
): Promise<{ ok: true; data: ReservationItem } | { ok: false; message: string }> {
  try {
    const { data: previous } = await supabase
      .from("reservations")
      .select("status, restaurant_id")
      .eq("id", id)
      .maybeSingle();

    const payload: Record<string, unknown> = { status };

    if (status === "Confirmed") {
      payload.confirmed_at = new Date().toISOString();
    } else if (status === "Cancelled") {
      payload.cancelled_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("reservations")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    const reservation = mapReservationRow(data as ReservationRow);
    void logActivity({
      action: "reservation_updated",
      restaurantId:
        reservation.restaurantId ||
        (previous as { restaurant_id?: string } | null)?.restaurant_id,
      entityType: "reservation",
      entityId: id,
      oldValues: {
        status: (previous as { status?: string } | null)?.status ?? null,
      },
      newValues: { status },
    });

    return { ok: true, data: reservation };
  } catch {
    return { ok: false, message: ERROR };
  }
}

/** Updates the assigned table / internal notes without changing the status. */
export async function updateReservationDetails(
  id: string,
  fields: UpdateReservationDetailsInput,
): Promise<{ ok: true; data: ReservationItem } | { ok: false; message: string }> {
  try {
    const payload: Record<string, unknown> = {};
    if (fields.tableNumber !== undefined) {
      payload.table_number = fields.tableNumber?.trim() || null;
    }
    if (fields.internalNotes !== undefined) {
      payload.internal_notes = fields.internalNotes?.trim() || null;
    }

    const { data, error } = await supabase
      .from("reservations")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    return { ok: true, data: mapReservationRow(data as ReservationRow) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function bulkUpdateReservationStatus(
  ids: string[],
  status: ReservationStatus,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (ids.length === 0) return { ok: true };
  try {
    const payload: Record<string, unknown> = { status };
    if (status === "Confirmed") payload.confirmed_at = new Date().toISOString();
    if (status === "Cancelled") payload.cancelled_at = new Date().toISOString();

    const { error } = await supabase
      .from("reservations")
      .update(payload)
      .in("id", ids);

    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}
