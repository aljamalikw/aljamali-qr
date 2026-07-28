import type { ReservationStatus } from "@/lib/reservations/types";
import { getReservationStatusBadgeClass } from "@/lib/reservations/utils";

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getReservationStatusBadgeClass(status)}`}
    >
      {status}
    </span>
  );
}
