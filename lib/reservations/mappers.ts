import type {
  ReservationItem,
  ReservationRow,
  ReservationRowWithRestaurant,
  ReservationStatus,
  ReservationType,
  ReservationWithRestaurant,
} from "./types";
import { RESERVATION_STATUSES, RESERVATION_TYPES } from "./types";

function asStatus(value: string): ReservationStatus {
  return (RESERVATION_STATUSES as readonly string[]).includes(value)
    ? (value as ReservationStatus)
    : "Pending";
}

function asType(value: string): ReservationType {
  return (RESERVATION_TYPES as readonly string[]).includes(value)
    ? (value as ReservationType)
    : "Family";
}

export function mapReservationRow(row: ReservationRow): ReservationItem {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    customerName: row.customer_name,
    mobileNumber: row.mobile_number,
    email: row.email,
    reservationDate: row.reservation_date,
    reservationTime: row.reservation_time,
    guests: row.guests,
    specialRequests: row.special_requests,
    reservationType: asType(row.reservation_type),
    status: asStatus(row.status),
    tableNumber: row.table_number,
    internalNotes: row.internal_notes,
    confirmedAt: row.confirmed_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function restaurantNameFromRow(row: ReservationRowWithRestaurant): string | null {
  if (Array.isArray(row.restaurants)) {
    return row.restaurants[0]?.restaurant_name ?? null;
  }
  return row.restaurants?.restaurant_name ?? null;
}

export function mapReservationRowWithRestaurant(
  row: ReservationRowWithRestaurant,
): ReservationWithRestaurant {
  return {
    ...mapReservationRow(row),
    restaurantName: restaurantNameFromRow(row),
  };
}
