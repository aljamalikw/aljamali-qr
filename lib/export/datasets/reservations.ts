import type { ReservationItem } from "@/lib/reservations/types";
import type { ExportDataset } from "../types";

export function buildReservationsExportDataset(input: {
  reservations: ReservationItem[];
  restaurantName: string;
  filterSummary: string[];
}): ExportDataset {
  const rows = input.reservations.map((item) => ({
    customerName: item.customerName,
    phone: item.mobileNumber,
    email: item.email ?? "",
    reservationDate: item.reservationDate,
    reservationTime: item.reservationTime,
    guestCount: item.guests,
    status: item.status,
    notes: item.specialRequests ?? item.internalNotes ?? "",
    restaurant: input.restaurantName,
    createdAt: item.createdAt,
  }));

  return {
    filenamePrefix: "reservations",
    meta: {
      title: "Reservations Export",
      restaurantName: input.restaurantName,
      filterSummary: input.filterSummary,
    },
    columns: [
      { key: "customerName", header: "Customer Name" },
      { key: "phone", header: "Phone" },
      { key: "email", header: "Email" },
      { key: "reservationDate", header: "Reservation Date" },
      { key: "reservationTime", header: "Reservation Time" },
      { key: "guestCount", header: "Guest Count", type: "number" },
      { key: "status", header: "Status" },
      { key: "notes", header: "Notes" },
      { key: "restaurant", header: "Restaurant" },
      { key: "createdAt", header: "Created At", type: "datetime" },
    ],
    rows,
    summary: [{ label: "Reservations", value: String(rows.length) }],
  };
}

export function buildReservationsFilterSummary(input: {
  search: string;
  status: string;
  type: string;
  selectedDate?: string;
}): string[] {
  const filters: string[] = [];
  if (input.search.trim()) filters.push(`Search: ${input.search.trim()}`);
  if (input.status !== "all") filters.push(`Status: ${input.status}`);
  if (input.type !== "all") filters.push(`Type: ${input.type}`);
  if (input.selectedDate) filters.push(`Calendar date: ${input.selectedDate}`);
  return filters;
}
