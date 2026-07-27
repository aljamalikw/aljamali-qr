import { buildCsv } from "@/lib/utils/csv";
import type {
  ReservationFilterParams,
  ReservationItem,
  ReservationKpis,
  ReservationStatus,
  ReservationStatusFilter,
  ReservationTypeFilter,
  ReservationWithRestaurant,
} from "./types";
import { RESERVATION_STATUSES, RESERVATION_TYPES } from "./types";

export const RESERVATIONS_PAGE_SIZE = 10;

export const RESERVATION_STATUS_FILTERS: ReservationStatusFilter[] = [
  "all",
  ...RESERVATION_STATUSES,
];

export const RESERVATION_TYPE_FILTERS: ReservationTypeFilter[] = [
  "all",
  ...RESERVATION_TYPES,
];

export function emptyReservationFilters(): ReservationFilterParams {
  return { search: "", status: "all", type: "all", dateFrom: "", dateTo: "" };
}

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatReservationDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatReservationDateShort(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function formatReservationDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getReservationStatusBadgeClass(status: ReservationStatus): string {
  switch (status) {
    case "Pending":
      return "border border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "Confirmed":
      return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "Completed":
      return "border border-sky-500/30 bg-sky-500/10 text-sky-300";
    case "Cancelled":
      return "border border-red-500/30 bg-red-500/10 text-red-300";
    case "No Show":
      return "border border-slate-500/30 bg-slate-500/10 text-slate-300";
    default:
      return "border border-white/10 bg-white/5 text-white/45";
  }
}

export function getReservationStatusDotClass(status: ReservationStatus): string {
  switch (status) {
    case "Pending":
      return "bg-amber-400";
    case "Confirmed":
      return "bg-emerald-400";
    case "Completed":
      return "bg-sky-400";
    case "Cancelled":
      return "bg-red-400";
    case "No Show":
      return "bg-slate-400";
    default:
      return "bg-white/30";
  }
}

export function computeReservationKpis(items: ReservationItem[]): ReservationKpis {
  const today = todayDateString();

  return {
    today: items.filter(
      (item) => item.reservationDate === today && item.status !== "Cancelled",
    ).length,
    upcoming: items.filter(
      (item) =>
        item.reservationDate > today &&
        (item.status === "Pending" || item.status === "Confirmed"),
    ).length,
    pending: items.filter((item) => item.status === "Pending").length,
    cancelled: items.filter((item) => item.status === "Cancelled").length,
  };
}

export function filterReservations<T extends ReservationItem>(
  items: T[],
  params: ReservationFilterParams,
): T[] {
  const query = params.search.trim().toLowerCase();

  return items.filter((item) => {
    if (params.status !== "all" && item.status !== params.status) return false;
    if (params.type !== "all" && item.reservationType !== params.type) return false;

    if (params.dateFrom && item.reservationDate < params.dateFrom) return false;
    if (params.dateTo && item.reservationDate > params.dateTo) return false;

    if (!query) return true;

    return (
      item.customerName.toLowerCase().includes(query) ||
      item.mobileNumber.toLowerCase().includes(query) ||
      (item.email?.toLowerCase().includes(query) ?? false) ||
      (item.tableNumber?.toLowerCase().includes(query) ?? false)
    );
  });
}

export function sortReservationsByDate<T extends ReservationItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const dateCompare = b.reservationDate.localeCompare(a.reservationDate);
    if (dateCompare !== 0) return dateCompare;
    return b.reservationTime.localeCompare(a.reservationTime);
  });
}

export function paginateReservations<T>(
  items: T[],
  page: number,
  pageSize: number = RESERVATIONS_PAGE_SIZE,
): { pageItems: T[]; totalPages: number; page: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    totalPages,
    page: safePage,
  };
}

export function exportReservationsToCsv(items: ReservationItem[]): string {
  const headers = [
    "Customer",
    "Mobile",
    "Email",
    "Date",
    "Time",
    "Guests",
    "Type",
    "Status",
    "Table",
    "Created",
  ];

  const rows = items.map((item) => [
    item.customerName,
    item.mobileNumber,
    item.email ?? "",
    item.reservationDate,
    item.reservationTime,
    String(item.guests),
    item.reservationType,
    item.status,
    item.tableNumber ?? "",
    item.createdAt,
  ]);

  return buildCsv(headers, rows);
}

export function exportReservationsWithRestaurantToCsv(
  items: ReservationWithRestaurant[],
): string {
  const headers = [
    "Restaurant",
    "Customer",
    "Mobile",
    "Email",
    "Date",
    "Time",
    "Guests",
    "Type",
    "Status",
    "Created",
  ];

  const rows = items.map((item) => [
    item.restaurantName ?? "",
    item.customerName,
    item.mobileNumber,
    item.email ?? "",
    item.reservationDate,
    item.reservationTime,
    String(item.guests),
    item.reservationType,
    item.status,
    item.createdAt,
  ]);

  return buildCsv(headers, rows);
}
