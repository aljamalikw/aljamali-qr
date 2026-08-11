"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { DemoRequestPagination } from "@/components/admin/demo-requests/DemoRequestPagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  downloadCsv,
  exportPaymentsToCsv,
  fetchPayments,
  filterPayments,
  formatPaymentAmount,
  PAYMENT_STATUSES,
  type PaymentItem,
  type PaymentStatus,
} from "@/lib/admin/payments";
import {
  formatDemoDate,
  paginateDemoRequests,
} from "@/lib/demo-requests/utils";

const PAGE_SIZE = 10;

function statusClass(status: PaymentStatus): string {
  switch (status) {
    case "paid":
      return "text-emerald-300";
    case "pending":
      return "text-amber-300";
    case "overdue":
      return "text-orange-300";
    case "refunded":
      return "text-sky-300";
    default:
      return "text-white/60";
  }
}

export function AdminPaymentsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchPayments();
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
  }, [search, status]);

  const filtered = useMemo(
    () => filterPayments(items, { search, status }),
    [items, search, status],
  );

  const counts = useMemo(() => {
    const base = {
      invoices: items.length,
      paid: 0,
      pending: 0,
      overdue: 0,
      refunded: 0,
    };
    for (const item of items) {
      base[item.status] += 1;
    }
    return base;
  }, [items]);

  const { pageItems, totalPages, page: safePage } = useMemo(
    () => paginateDemoRequests(filtered, page, PAGE_SIZE),
    [filtered, page],
  );

  const handleExport = () => {
    if (filtered.length === 0) {
      showToast("No rows available to export", "error");
      return;
    }
    const csv = exportPaymentsToCsv(filtered);
    downloadCsv(`payments-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    showToast(`Exported ${filtered.length} payments`);
  };

  return (
    <AdminPlaceholder
      title="Payments"
      description="Invoices and payment states across the platform."
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              ["Invoices", counts.invoices],
              ["Paid", counts.paid],
              ["Pending", counts.pending],
              ["Overdue", counts.overdue],
              ["Refunded", counts.refunded],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-gold/15 bg-black/25 p-4 text-center"
            >
              <p className="text-xs uppercase tracking-[0.15em] text-white/40">
                {label}
              </p>
              <p className="mt-2 font-serif text-2xl text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice, restaurant, or method…"
            aria-label="Search payments"
            className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as PaymentStatus | "all")
              }
              aria-label="Filter by status"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
            >
              <option value="all">All statuses</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="menu-btn-secondary"
              onClick={handleExport}
            >
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-white/50">{error}</p>
            <button
              type="button"
              className="menu-btn-primary mt-6"
              onClick={() => void load()}
            >
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={
              search || status !== "all"
                ? "No matching payments"
                : "No payment records yet"
            }
            description={
              search || status !== "all"
                ? "Try adjusting your search or status filter."
                : "Successful and pending payments will appear here."
            }
            className="border-0 bg-transparent"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-gold/10">
                    {[
                      "Invoice",
                      "Restaurant",
                      "Amount",
                      "Method",
                      "Status",
                      "Paid",
                      "Created",
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
                        {item.invoiceNumber ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/70">
                        {item.restaurantName ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/70">
                        {formatPaymentAmount(item.amount, item.currency)}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/50">
                        {item.paymentMethod ?? "—"}
                      </td>
                      <td
                        className={`px-3 py-3 text-sm capitalize ${statusClass(item.status)}`}
                      >
                        {item.status}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/50">
                        {formatDemoDate(item.paidAt)}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/50">
                        {formatDemoDate(item.createdAt)}
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
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </AdminPlaceholder>
  );
}
