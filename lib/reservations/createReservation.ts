import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/admin/activity-log";
import { syncCustomerEvent } from "@/lib/customers/sync-customer";
import { notifyRestaurantOwner } from "@/lib/notifications/createNotification";
import { mapReservationRow } from "./mappers";
import type { CreateReservationInput, ReservationItem, ReservationRow } from "./types";
import { PUBLIC_RESERVATION_TYPES } from "./types";

const CREATE_ERROR = "Unable to submit reservation. Please try again.";
const UNAVAILABLE_ERROR =
  "Reservations are not available for this restaurant right now.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(?::\d{2})?$/;
const MIN_GUESTS = 1;
const MAX_GUESTS = 100;

export function validateReservationInput(
  input: CreateReservationInput,
): string | null {
  if (!input.restaurantId.trim() || !UUID_RE.test(input.restaurantId.trim())) {
    return CREATE_ERROR;
  }
  if (!input.customerName.trim()) return "Please enter your name.";
  if (!input.mobileNumber.trim()) return "Please enter a mobile number.";
  if (input.email && !EMAIL_PATTERN.test(input.email.trim())) {
    return "Please enter a valid email address.";
  }
  if (!DATE_RE.test(input.reservationDate.trim())) {
    return "Please choose a date.";
  }
  const parsedDate = new Date(`${input.reservationDate.trim()}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return "Please choose a date.";
  if (!TIME_RE.test(input.reservationTime.trim())) {
    return "Please choose a time.";
  }
  const guests = Number(input.guests);
  if (!Number.isInteger(guests) || guests < MIN_GUESTS || guests > MAX_GUESTS) {
    return "Please enter at least 1 guest.";
  }
  if (
    !(PUBLIC_RESERVATION_TYPES as readonly string[]).includes(
      input.reservationType,
    )
  ) {
    return "Please choose a valid reservation type.";
  }
  return null;
}

/**
 * Core reservation write path. Browser calls must use createReservation()
 * → API route; the route passes the server service-role client here.
 */
export async function createReservationWithClient(
  client: SupabaseClient,
  input: CreateReservationInput,
): Promise<{ ok: true; data: ReservationItem } | { ok: false; message: string }> {
  const validationError = validateReservationInput(input);
  if (validationError) {
    return { ok: false, message: validationError };
  }

  try {
    const restaurantId = input.restaurantId.trim();
    const { data: restaurant, error: restaurantError } = await client
      .from("restaurants")
      .select("id, is_active, reservations_enabled, slug")
      .eq("id", restaurantId)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      return { ok: false, message: UNAVAILABLE_ERROR };
    }
    if (
      restaurant.is_active === false ||
      restaurant.reservations_enabled === false ||
      !String(restaurant.slug ?? "").trim()
    ) {
      return { ok: false, message: UNAVAILABLE_ERROR };
    }

    const guests = Math.trunc(Number(input.guests));
    const { data, error } = await client
      .from("reservations")
      .insert({
        restaurant_id: restaurantId,
        customer_name: input.customerName.trim(),
        mobile_number: input.mobileNumber.trim(),
        email: input.email?.trim() || null,
        reservation_date: input.reservationDate.trim(),
        reservation_time: input.reservationTime.trim(),
        guests,
        special_requests: input.specialRequests?.trim() || null,
        reservation_type: input.reservationType,
      })
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: CREATE_ERROR };
    }

    const reservation = mapReservationRow(data as ReservationRow);

    void logActivity({
      action: "reservation_created",
      restaurantId,
      entityType: "reservation",
      entityId: reservation.id,
      newValues: {
        customer_name: reservation.customerName,
        guests: reservation.guests,
        reservation_date: reservation.reservationDate,
        reservation_time: reservation.reservationTime,
      },
      client,
    });

    void syncCustomerEvent(
      {
        restaurantId,
        fullName: reservation.customerName,
        phone: reservation.mobileNumber,
        email: reservation.email,
        visitAt: reservation.createdAt,
        reservationIncrement: 1,
      },
      client,
    );

    void notifyRestaurantOwner(
      restaurantId,
      {
        type: "new_reservation",
        title: "New table reservation",
        body: `${reservation.customerName} requested a table for ${reservation.guests} on ${reservation.reservationDate} at ${reservation.reservationTime}.`,
        href: "/dashboard/reservations",
        meta: { reservationId: reservation.id },
      },
      client,
    );

    return { ok: true, data: reservation };
  } catch {
    return { ok: false, message: CREATE_ERROR };
  }
}

/**
 * Browser entrypoint — posts to the secure Route Handler.
 * Does not use the anon key for inserts.
 */
export async function createReservation(
  input: CreateReservationInput,
): Promise<{ ok: true; data: ReservationItem } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/reservations/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    let payload: {
      ok?: boolean;
      data?: ReservationItem;
      error?: string;
      message?: string;
    } = {};

    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      return { ok: false, message: CREATE_ERROR };
    }

    if (!response.ok || !payload.ok || !payload.data) {
      return {
        ok: false,
        message: payload.error || payload.message || CREATE_ERROR,
      };
    }

    return { ok: true, data: payload.data };
  } catch {
    return { ok: false, message: CREATE_ERROR };
  }
}
