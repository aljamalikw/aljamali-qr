import { logActivity } from "@/lib/admin/activity-log";
import { notifyRestaurantOwner } from "@/lib/notifications/createNotification";
import { supabase } from "@/lib/supabase";
import { mapReservationRow } from "./mappers";
import type { CreateReservationInput, ReservationItem, ReservationRow } from "./types";
import { RESERVATION_TYPES } from "./types";

function syncReservationCustomer(reservation: ReservationItem): void {
  void fetch("/api/customers/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      restaurantId: reservation.restaurantId,
      reservationId: reservation.id,
      fullName: reservation.customerName,
      phone: reservation.mobileNumber,
      email: reservation.email,
      visitAt: reservation.createdAt,
      reservationIncrement: 1,
    }),
  }).catch(() => {
    // CRM sync must never break reservation creation.
  });
}

const CREATE_ERROR = "Unable to submit reservation. Please try again.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateReservationInput(
  input: CreateReservationInput,
): string | null {
  if (!input.restaurantId.trim()) return CREATE_ERROR;
  if (!input.customerName.trim()) return "Please enter your name.";
  if (!input.mobileNumber.trim()) return "Please enter a mobile number.";
  if (input.email && !EMAIL_PATTERN.test(input.email.trim())) {
    return "Please enter a valid email address.";
  }
  if (!input.reservationDate.trim()) return "Please choose a date.";
  if (!input.reservationTime.trim()) return "Please choose a time.";
  if (!Number.isFinite(input.guests) || input.guests < 1) {
    return "Please enter at least 1 guest.";
  }
  if (!(RESERVATION_TYPES as readonly string[]).includes(input.reservationType)) {
    return "Please choose a valid reservation type.";
  }
  return null;
}

export async function createReservation(
  input: CreateReservationInput,
): Promise<{ ok: true; data: ReservationItem } | { ok: false; message: string }> {
  const validationError = validateReservationInput(input);
  if (validationError) {
    return { ok: false, message: validationError };
  }

  try {
    const { data, error } = await supabase
      .from("reservations")
      .insert({
        restaurant_id: input.restaurantId,
        customer_name: input.customerName.trim(),
        mobile_number: input.mobileNumber.trim(),
        email: input.email?.trim() || null,
        reservation_date: input.reservationDate,
        reservation_time: input.reservationTime,
        guests: input.guests,
        special_requests: input.specialRequests?.trim() || null,
        reservation_type: input.reservationType,
      })
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message || CREATE_ERROR };
    }

    const reservation = mapReservationRow(data as ReservationRow);

    void logActivity({
      action: "reservation_created",
      restaurantId: input.restaurantId,
      entityType: "reservation",
      entityId: reservation.id,
      newValues: {
        customer_name: reservation.customerName,
        guests: reservation.guests,
        reservation_date: reservation.reservationDate,
        reservation_time: reservation.reservationTime,
      },
    });

    syncReservationCustomer(reservation);

    void notifyRestaurantOwner(input.restaurantId, {
      type: "new_reservation",
      title: "New table reservation",
      body: `${reservation.customerName} requested a table for ${reservation.guests} on ${reservation.reservationDate} at ${reservation.reservationTime}.`,
      href: "/dashboard/reservations",
      meta: { reservationId: reservation.id },
    });

    return { ok: true, data: reservation };
  } catch {
    return { ok: false, message: CREATE_ERROR };
  }
}
