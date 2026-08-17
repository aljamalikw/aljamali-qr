"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { fetchReservationsByRestaurant } from "@/lib/reservations/fetchReservations";
import type {
  ReservationItem,
  ReservationStatus,
  ReservationStatusFilter,
  ReservationTypeFilter,
} from "@/lib/reservations/types";
import {
  updateReservationDetails,
  updateReservationStatus,
} from "@/lib/reservations/updateReservationStatus";
import {
  RESERVATIONS_PAGE_SIZE,
  RESERVATION_STATUS_FILTERS,
  RESERVATION_TYPE_FILTERS,
  computeReservationKpis,
  exportReservationsToCsv,
  filterReservations,
  formatReservationDateShort,
  paginateReservations,
  sortReservationsByDate,
} from "@/lib/reservations/utils";
import { csvTimestamp, downloadCsv } from "@/lib/utils/csv";
import { ReservationCalendar } from "./ReservationCalendar";
import { ReservationDetailsDrawer } from "./ReservationDetailsDrawer";
import { ReservationKpiCards } from "./ReservationKpiCards";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { ReservationTable } from "./ReservationTable";

type ConfirmAction = { type: "cancel"; item: ReservationItem } | null;

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ReservationsManagement() {
  const { showToast } = useToast();
  const { restaurant, loading: restaurantLoading } = useRestaurant();

  const [items, setItems] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReservationStatusFilter>("all");
  const [type, setType] = useState<ReservationTypeFilter>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<ReservationItem | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);

  const loadReservations = useCallback(async () => {
    if (!restaurant?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await fetchReservationsByRestaurant(restaurant.id);
    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      setItems([]);
      return;
    }
    setItems(result.data);
  }, [restaurant?.id]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  useEffect(() => {
    setSelected(null);
  }, [restaurant?.id]);

  useEffect(() => {
    setPage(1);
  }, [search, status, type, selectedDate]);

  const kpis = useMemo(() => computeReservationKpis(items), [items]);

  const today = todayDateString();

  const todaysReservations = useMemo(
    () =>
      sortReservationsByDate(
        items.filter((item) => item.reservationDate === today && item.status !== "Cancelled"),
      ).reverse(),
    [items, today],
  );

  const upcomingReservations = useMemo(
    () =>
      items
        .filter(
          (item) =>
            item.reservationDate > today &&
            (item.status === "Pending" || item.status === "Confirmed"),
        )
        .sort((a, b) => {
          const dateCompare = a.reservationDate.localeCompare(b.reservationDate);
          if (dateCompare !== 0) return dateCompare;
          return a.reservationTime.localeCompare(b.reservationTime);
        })
        .slice(0, 5),
    [items, today],
  );

  const filtered = useMemo(
    () =>
      filterReservations(items, {
        search,
        status,
        type,
        dateFrom: selectedDate ?? "",
        dateTo: selectedDate ?? "",
      }),
    [items, search, status, type, selectedDate],
  );

  const { pageItems, totalPages, page: safePage } = useMemo(
    () => paginateReservations(filtered, page, RESERVATIONS_PAGE_SIZE),
    [filtered, page],
  );

  const hasFilters =
    search.trim().length > 0 || status !== "all" || type !== "all" || Boolean(selectedDate);

  const replaceItem = useCallback((updated: ReservationItem) => {
    setItems((previous) =>
      previous.map((item) => (item.id === updated.id ? updated : item)),
    );
    setSelected((current) => (current?.id === updated.id ? updated : current));
  }, []);

  const handleStatusChange = useCallback(
    async (item: ReservationItem, nextStatus: ReservationStatus) => {
      setActionLoading(true);
      const result = await updateReservationStatus(item.id, nextStatus);
      setActionLoading(false);

      if (!result.ok) {
        showToast(result.message, "error");
        return;
      }

      replaceItem(result.data);
      showToast(`Reservation ${nextStatus.toLowerCase()}`);
    },
    [replaceItem, showToast],
  );

  const handleConfirmCancel = useCallback(async () => {
    if (!confirmAction) return;
    await handleStatusChange(confirmAction.item, "Cancelled");
    setConfirmAction(null);
  }, [confirmAction, handleStatusChange]);

  const handleSaveDetails = useCallback(
    async (id: string, fields: { tableNumber: string; internalNotes: string }) => {
      setSavingDetails(true);
      const result = await updateReservationDetails(id, {
        tableNumber: fields.tableNumber,
        internalNotes: fields.internalNotes,
      });
      setSavingDetails(false);

      if (!result.ok) {
        showToast(result.message, "error");
        return false;
      }

      replaceItem(result.data);
      showToast("Reservation notes saved");
      return true;
    },
    [replaceItem, showToast],
  );

  const handleExport = useCallback(() => {
    if (filtered.length === 0) {
      showToast("No rows available to export", "error");
      return;
    }
    const csv = exportReservationsToCsv(filtered);
    downloadCsv(`reservations-${csvTimestamp()}.csv`, csv);
    showToast(`Exported ${filtered.length} reservations`);
  }, [filtered, showToast]);

  if (restaurantLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-sm text-white/50">
          Complete restaurant onboarding to manage reservations.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Reservations</h1>
          <p className="mt-1 text-sm text-white/45">
            Manage table reservations submitted from your public menu.
          </p>
        </div>
        <button type="button" onClick={handleExport} className="menu-btn-secondary shrink-0">
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <ReservationKpiCards kpis={kpis} />
      )}

      {error ? (
        <div className="dashboard-card rounded-2xl p-8 text-center">
          <p className="text-sm text-white/50">{error}</p>
          <button
            type="button"
            onClick={() => void loadReservations()}
            className="menu-btn-primary mt-4"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <ReservationCalendar
              items={items}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            <div className="dashboard-card space-y-4 rounded-2xl p-5 sm:p-6 lg:col-span-2">
              <h3 className="font-serif text-lg text-white">Today&apos;s Reservations</h3>
              {loading ? (
                <TableSkeleton rows={2} />
              ) : todaysReservations.length === 0 ? (
                <p className="text-sm text-white/45">No reservations scheduled for today.</p>
              ) : (
                <div className="space-y-2">
                  {todaysReservations.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelected(item)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-start transition-colors hover:border-gold/20"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {item.customerName}
                        </p>
                        <p className="mt-0.5 text-xs text-white/45">
                          {item.reservationTime} · {item.guests} guests
                        </p>
                      </div>
                      <ReservationStatusBadge status={item.status} />
                    </button>
                  ))}
                </div>
              )}

              <h3 className="pt-2 font-serif text-lg text-white">Upcoming</h3>
              {loading ? (
                <TableSkeleton rows={2} />
              ) : upcomingReservations.length === 0 ? (
                <p className="text-sm text-white/45">No upcoming reservations.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingReservations.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelected(item)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-start transition-colors hover:border-gold/20"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {item.customerName}
                        </p>
                        <p className="mt-0.5 text-xs text-white/45">
                          {formatReservationDateShort(item.reservationDate)} ·{" "}
                          {item.reservationTime} · {item.guests} guests
                        </p>
                      </div>
                      <ReservationStatusBadge status={item.status} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, mobile, or email…"
                aria-label="Search reservations"
                className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReservationStatusFilter)}
                aria-label="Filter by status"
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-gold/30 focus:outline-none"
              >
                {RESERVATION_STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? "All statuses" : s}
                  </option>
                ))}
              </select>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ReservationTypeFilter)}
                aria-label="Filter by type"
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-gold/30 focus:outline-none"
              >
                {RESERVATION_TYPE_FILTERS.map((tOption) => (
                  <option key={tOption} value={tOption}>
                    {tOption === "all" ? "All types" : tOption}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="dashboard-card overflow-hidden rounded-2xl">
                <TableSkeleton rows={5} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="dashboard-card rounded-2xl py-12 text-center">
                <p className="text-sm text-white/50">
                  {hasFilters
                    ? "No reservations match your filters."
                    : "No reservations yet. Share your menu link to start receiving bookings."}
                </p>
              </div>
            ) : (
              <div className="dashboard-card overflow-hidden rounded-2xl">
                <ReservationTable
                  items={pageItems}
                  onRowClick={setSelected}
                  onConfirm={(item) => void handleStatusChange(item, "Confirmed")}
                  onComplete={(item) => void handleStatusChange(item, "Completed")}
                  onNoShow={(item) => void handleStatusChange(item, "No Show")}
                  onCancel={(item) => setConfirmAction({ type: "cancel", item })}
                />
                <div className="border-t border-white/5 px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-white/45">
                      Showing {(safePage - 1) * RESERVATIONS_PAGE_SIZE + 1}–
                      {Math.min(safePage * RESERVATIONS_PAGE_SIZE, filtered.length)} of{" "}
                      {filtered.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="menu-btn-secondary !px-3 !py-2 text-sm disabled:opacity-40"
                        disabled={safePage <= 1}
                        onClick={() => setPage(safePage - 1)}
                      >
                        Previous
                      </button>
                      <span className="min-w-[5rem] text-center text-sm text-white/60">
                        Page {safePage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        className="menu-btn-secondary !px-3 !py-2 text-sm disabled:opacity-40"
                        disabled={safePage >= totalPages}
                        onClick={() => setPage(safePage + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <ReservationDetailsDrawer
        item={selected}
        saving={savingDetails}
        onClose={() => setSelected(null)}
        onSaveDetails={handleSaveDetails}
        onConfirm={(item) => void handleStatusChange(item, "Confirmed")}
        onComplete={(item) => void handleStatusChange(item, "Completed")}
        onNoShow={(item) => void handleStatusChange(item, "No Show")}
        onCancel={(item) => setConfirmAction({ type: "cancel", item })}
      />

      <ConfirmModal
        open={confirmAction?.type === "cancel"}
        title="Cancel Reservation?"
        description={
          confirmAction
            ? `Cancel the reservation for "${confirmAction.item.customerName}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Cancel Reservation"
        cancelLabel="Keep Reservation"
        variant="danger"
        loading={actionLoading}
        onConfirm={() => void handleConfirmCancel()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
