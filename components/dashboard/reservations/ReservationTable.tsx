"use client";

import type { ReservationItem } from "@/lib/reservations/types";
import { formatReservationDateShort } from "@/lib/reservations/utils";
import { ReservationStatusBadge } from "./ReservationStatusBadge";

interface ReservationTableProps {
  items: ReservationItem[];
  onRowClick: (item: ReservationItem) => void;
  onConfirm: (item: ReservationItem) => void;
  onComplete: (item: ReservationItem) => void;
  onNoShow: (item: ReservationItem) => void;
  onCancel: (item: ReservationItem) => void;
}

export function ReservationTable({
  items,
  onRowClick,
  onConfirm,
  onComplete,
  onNoShow,
  onCancel,
}: ReservationTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left">
        <thead>
          <tr className="border-b border-gold/10">
            {["Customer", "Contact", "Date & Time", "Guests", "Type", "Status", "Actions"].map(
              (heading) => (
                <th
                  key={heading}
                  className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-white/40"
                >
                  {heading}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="table-row-hover cursor-pointer border-b border-white/5"
              onClick={() => onRowClick(item)}
            >
              <td className="px-3 py-3 text-sm text-white">{item.customerName}</td>
              <td className="px-3 py-3 text-sm text-white/60">{item.mobileNumber}</td>
              <td className="px-3 py-3 text-sm text-white/70">
                {formatReservationDateShort(item.reservationDate)} · {item.reservationTime}
              </td>
              <td className="px-3 py-3 text-sm text-white/70">{item.guests}</td>
              <td className="px-3 py-3 text-sm text-white/60">{item.reservationType}</td>
              <td className="px-3 py-3">
                <ReservationStatusBadge status={item.status} />
              </td>
              <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-wrap gap-1.5">
                  {item.status === "Pending" && (
                    <button
                      type="button"
                      className="menu-btn-primary !px-2.5 !py-1.5 text-xs"
                      onClick={() => onConfirm(item)}
                    >
                      Confirm
                    </button>
                  )}
                  {item.status === "Confirmed" && (
                    <>
                      <button
                        type="button"
                        className="menu-btn-primary !px-2.5 !py-1.5 text-xs"
                        onClick={() => onComplete(item)}
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                        onClick={() => onNoShow(item)}
                      >
                        No Show
                      </button>
                    </>
                  )}
                  {(item.status === "Pending" || item.status === "Confirmed") && (
                    <button
                      type="button"
                      className="menu-btn-danger !px-2.5 !py-1.5 text-xs"
                      onClick={() => onCancel(item)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
