"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { DemoRequestPagination } from "@/components/admin/demo-requests/DemoRequestPagination";
import { ReservationStatusBadge } from "@/components/dashboard/reservations/ReservationStatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchAllReservations } from "@/lib/reservations/fetchReservations";
import type {
  ReservationStatusFilter,
  ReservationTypeFilter,
  ReservationWithRestaurant,
} from "@/lib/reservations/types";
import {
  RESERVATIONS_PAGE_SIZE,
  RESERVATION_STATUS_FILTERS,
  RESERVATION_TYPE_FILTERS,
  computeReservationKpis,
  exportReservationsWithRestaurantToCsv,
  filterReservations,
  formatReservationDateShort,
  paginateReservations,
} from "@/lib/reservations/utils";
import { csvTimestamp, downloadCsv } from "@/lib/utils/csv";

export function AdminReservationsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<ReservationWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReservationStatusFilter>("all");
  const [type, setType] = useState<ReservationTypeFilter>("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchAllReservations();
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      setItems([]);
      return;
    }
    setItems(result.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status, type]);

  const kpis = useMemo(() => computeReservationKpis(items), [items]);

  const filtered = useMemo(() => {
    const base = filterReservations(items, {
      search,
      status,
      type,
      dateFrom: "",
      dateTo: "",
    });
    const query = search.trim().toLowerCase();
    if (!query) return base;
    return base.filter(
      (item) =>
        item.restaurantName?.toLowerCase().includes(query) ||
        item.customerName.toLowerCase().includes(query) ||
        item.mobileNumber.toLowerCase().includes(query) ||
        (item.email?.toLowerCase().includes(query) ?? false),
    );
  }, [items, search, status, type]);

  const { pageItems, totalPages, page: safePage } = useMemo(
    () => paginateReservations(filtered, page, RESERVATIONS_PAGE_SIZE),
    [filtered, page],
  );

  const handleExport = () => {
    if (filtered.length === 0) {
      showToast("No rows available to export", "error");
      return;
    }
    const csv = exportReservationsWithRestaurantToCsv(filtered);
    downloadCsv(`reservations-${csvTimestamp()}.csv`, csv);
    showToast(`Exported ${filtered.length} reservations`);
  };

  return (
    <AdminPlaceholder
      title="Reservations"
      description="Overview of table reservations across every restaurant on the platform."
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Today", value: kpis.today },
            { label: "Upcoming", value: kpis.upcoming },
            { label: "Pending", value: kpis.pending },
            { label: "Cancelled", value: kpis.cancelled },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-gold/10 bg-black/20 p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/45">
                {card.label}
              </p>
              <p className="mt-2 font-serif text-2xl font-bold text-white">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurant, customer, mobile, or email…"
            aria-label="Search reservations"
            className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ReservationStatusFilter)}
              aria-label="Filter by status"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
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
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
            >
              {RESERVATION_TYPE_FILTERS.map((tOption) => (
                <option key={tOption} value={tOption}>
                  {tOption === "all" ? "All types" : tOption}
                </option>
              ))}
            </select>
            <button type="button" className="menu-btn-secondary" onClick={handleExport}>
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-white/50">{error}</p>
            <button type="button" className="menu-btn-primary mt-6" onClick={() => void load()}>
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-white/50">
              {search || status !== "all" || type !== "all"
                ? "No reservations match your filters."
                : "No reservations yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left">
                <thead>
                  <tr className="border-b border-gold/10">
                    {[
                      "Restaurant",
                      "Customer",
                      "Mobile",
                      "Date & Time",
                      "Guests",
                      "Type",
                      "Status",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-white/40"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => (
                    <tr key={item.id} className="border-b border-white/5">
                      <td className="px-3 py-3 text-sm text-white">
                        {item.restaurantName ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/80">{item.customerName}</td>
                      <td className="px-3 py-3 text-sm text-white/60">{item.mobileNumber}</td>
                      <td className="px-3 py-3 text-sm text-white/70">
                        {formatReservationDateShort(item.reservationDate)} ·{" "}
                        {item.reservationTime}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/70">{item.guests}</td>
                      <td className="px-3 py-3 text-sm text-white/60">{item.reservationType}</td>
                      <td className="px-3 py-3">
                        <ReservationStatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DemoRequestPagination
              page={safePage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={RESERVATIONS_PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </AdminPlaceholder>
  );
}
