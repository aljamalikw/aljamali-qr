"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { DashboardIcon } from "@/components/dashboard/icons/DashboardIcons";
import type { ReservationItem } from "@/lib/reservations/types";
import {
  formatReservationDate,
  formatReservationDateTime,
} from "@/lib/reservations/utils";
import { ReservationStatusBadge } from "./ReservationStatusBadge";

interface ReservationDetailsDrawerProps {
  item: ReservationItem | null;
  saving: boolean;
  onClose: () => void;
  onSaveDetails: (
    id: string,
    fields: { tableNumber: string; internalNotes: string },
  ) => Promise<boolean>;
  onConfirm: (item: ReservationItem) => void;
  onComplete: (item: ReservationItem) => void;
  onNoShow: (item: ReservationItem) => void;
  onCancel: (item: ReservationItem) => void;
}

const labelClass = "block text-xs font-medium uppercase tracking-wider text-white/40";
const readonlyClass = "mt-1 text-sm text-white/85";
const inputClass = "auth-input w-full";

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className={readonlyClass}>{value || "—"}</p>
    </div>
  );
}

export function ReservationDetailsDrawer({
  item,
  saving,
  onClose,
  onSaveDetails,
  onConfirm,
  onComplete,
  onNoShow,
  onCancel,
}: ReservationDetailsDrawerProps) {
  const [tableNumber, setTableNumber] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setTableNumber(item.tableNumber ?? "");
    setInternalNotes(item.internalNotes ?? "");
    setError(null);
  }, [item]);

  const handleSave = async () => {
    if (!item) return;
    const ok = await onSaveDetails(item.id, { tableNumber, internalNotes });
    if (!ok) setError("Unable to save changes. Please try again.");
  };

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            initial={{ opacity: 0, x: "100%", scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: "100%", scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="menu-drawer fixed inset-0 z-50 flex w-full flex-col border-s border-gold/10 shadow-2xl sm:inset-y-0 sm:start-auto sm:end-0 sm:max-w-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-drawer-title"
          >
            <div className="flex items-center justify-between border-b border-gold/10 px-5 py-4">
              <div>
                <h2 id="reservation-drawer-title" className="font-serif text-xl font-bold text-white">
                  Reservation
                </h2>
                <p className="mt-1 text-xs text-white/45">{item.customerName}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <DashboardIcon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">
              <div className="flex flex-wrap items-center gap-2">
                <ReservationStatusBadge status={item.status} />
                <span className="rounded-full border border-gold/20 bg-gold/5 px-2.5 py-1 text-xs text-gold/90">
                  {item.reservationType}
                </span>
              </div>

              <section className="space-y-4 rounded-2xl border border-gold/10 bg-black/20 p-4">
                <h3 className="font-serif text-lg text-white">Reservation Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailField label="Customer Name" value={item.customerName} />
                  <DetailField label="Mobile Number" value={item.mobileNumber} />
                  <DetailField label="Email" value={item.email} />
                  <DetailField label="Guests" value={item.guests} />
                  <DetailField label="Date" value={formatReservationDate(item.reservationDate)} />
                  <DetailField label="Time" value={item.reservationTime} />
                </div>
                <DetailField label="Special Requests" value={item.specialRequests} />
              </section>

              <section className="space-y-4 rounded-2xl border border-gold/10 bg-black/20 p-4">
                <h3 className="font-serif text-lg text-white">Timeline</h3>
                <div className="space-y-2 text-sm text-white/60">
                  <p>Requested: {formatReservationDateTime(item.createdAt)}</p>
                  {item.confirmedAt && <p>Confirmed: {formatReservationDateTime(item.confirmedAt)}</p>}
                  {item.cancelledAt && <p>Cancelled: {formatReservationDateTime(item.cancelledAt)}</p>}
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-gold/10 bg-black/20 p-4">
                <h3 className="font-serif text-lg text-white">Manage</h3>
                <div className="space-y-1.5">
                  <label htmlFor="reservation-table-number" className={labelClass}>
                    Table Number
                  </label>
                  <input
                    id="reservation-table-number"
                    className={inputClass}
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. T-12"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="reservation-internal-notes" className={labelClass}>
                    Internal Notes
                  </label>
                  <textarea
                    id="reservation-internal-notes"
                    rows={3}
                    className={`${inputClass} min-h-[90px] resize-y`}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Private notes for your team..."
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-400" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  className="menu-btn-secondary w-full"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Notes"}
                </button>
              </section>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-gold/10 px-5 py-4">
              {item.status === "Pending" && (
                <button
                  type="button"
                  className="menu-btn-primary flex-1"
                  onClick={() => onConfirm(item)}
                >
                  Confirm
                </button>
              )}
              {item.status === "Confirmed" && (
                <>
                  <button
                    type="button"
                    className="menu-btn-primary flex-1"
                    onClick={() => onComplete(item)}
                  >
                    Complete
                  </button>
                  <button
                    type="button"
                    className="menu-btn-secondary flex-1"
                    onClick={() => onNoShow(item)}
                  >
                    No Show
                  </button>
                </>
              )}
              {(item.status === "Pending" || item.status === "Confirmed") && (
                <button
                  type="button"
                  className="menu-btn-danger flex-1"
                  onClick={() => onCancel(item)}
                >
                  Cancel
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
