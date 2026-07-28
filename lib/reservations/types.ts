export const RESERVATION_STATUSES = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
  "No Show",
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const RESERVATION_TYPES = [
  "Birthday",
  "Business",
  "Family",
  "Anniversary",
  "Outdoor",
  "Indoor",
  "Smoking",
  "Non-Smoking",
] as const;

export type ReservationType = (typeof RESERVATION_TYPES)[number];

export type ReservationItem = {
  id: string;
  restaurantId: string;
  customerName: string;
  mobileNumber: string;
  email: string | null;
  reservationDate: string;
  reservationTime: string;
  guests: number;
  specialRequests: string | null;
  reservationType: ReservationType;
  status: ReservationStatus;
  tableNumber: string | null;
  internalNotes: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateReservationInput = {
  restaurantId: string;
  customerName: string;
  mobileNumber: string;
  email?: string;
  reservationDate: string;
  reservationTime: string;
  guests: number;
  specialRequests?: string;
  reservationType: ReservationType;
};

export type ReservationRow = {
  id: string;
  restaurant_id: string;
  customer_name: string;
  mobile_number: string;
  email: string | null;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  special_requests: string | null;
  reservation_type: string;
  status: string;
  table_number: string | null;
  internal_notes: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Restaurant-joined row shape used by the admin cross-restaurant overview. */
export type ReservationRowWithRestaurant = ReservationRow & {
  restaurants:
    | { restaurant_name: string | null }
    | { restaurant_name: string | null }[]
    | null;
};

export type ReservationWithRestaurant = ReservationItem & {
  restaurantName: string | null;
};

export type ReservationKpis = {
  today: number;
  upcoming: number;
  pending: number;
  cancelled: number;
};

export type ReservationStatusFilter = ReservationStatus | "all";
export type ReservationTypeFilter = ReservationType | "all";

export type ReservationFilterParams = {
  search: string;
  status: ReservationStatusFilter;
  type: ReservationTypeFilter;
  dateFrom: string;
  dateTo: string;
};

export type UpdateReservationDetailsInput = {
  tableNumber?: string | null;
  internalNotes?: string | null;
};
