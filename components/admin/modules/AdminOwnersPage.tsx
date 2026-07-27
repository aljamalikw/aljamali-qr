"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { DemoRequestPagination } from "@/components/admin/demo-requests/DemoRequestPagination";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { exportOwnersToCsv, fetchOwners, type OwnerItem } from "@/lib/admin/owners";
import { formatDemoDate, paginateDemoRequests } from "@/lib/demo-requests/utils";
import { csvTimestamp, downloadCsv } from "@/lib/utils/csv";

const PAGE_SIZE = 10;

type StatusFilter = "all" | "active" | "suspended";

export function AdminOwnersPage() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const ownerIdParam = searchParams.get("ownerId");

  const [items, setItems] = useState<OwnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [ownerFilter, setOwnerFilter] = useState<string | null>(ownerIdParam);
  const [selected, setSelected] = useState<OwnerItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchOwners();
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
  }, [search, status, ownerFilter]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (ownerFilter && item.ownerId !== ownerFilter) return false;
      if (status === "active" && !item.isActive) return false;
      if (status === "suspended" && item.isActive) return false;
      if (!query) return true;
      return (
        (item.restaurantName?.toLowerCase().includes(query) ?? false) ||
        (item.email?.toLowerCase().includes(query) ?? false) ||
        (item.phone?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [items, search, status, ownerFilter]);

  const { pageItems, totalPages, page: safePage } = useMemo(
    () => paginateDemoRequests(filtered, page, PAGE_SIZE),
    [filtered, page],
  );

  const handleExport = () => {
    if (filtered.length === 0) {
      showToast("No rows available to export", "error");
      return;
    }
    const csv = exportOwnersToCsv(filtered);
    downloadCsv(`restaurant-owners-${csvTimestamp()}.csv`, csv);
    showToast(`Exported ${filtered.length} owners`);
  };

  return (
    <AdminPlaceholder
      title="Restaurant Owners"
      description="CRM view of every restaurant owner account."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search owner, restaurant, email, or phone…"
              aria-label="Search restaurant owners"
              className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              aria-label="Filter by status"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-gold/30 focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            {ownerFilter ? (
              <button
                type="button"
                onClick={() => setOwnerFilter(null)}
                className="menu-btn-secondary shrink-0 !px-3 !py-2 text-xs"
              >
                Clear owner filter
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-white/45">
              {loading ? "Loading…" : `${filtered.length} owner${filtered.length === 1 ? "" : "s"}`}
            </p>
            <button
              type="button"
              onClick={handleExport}
              className="menu-btn-secondary shrink-0"
            >
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} />
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-white/50">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="menu-btn-primary mt-6"
            >
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-white/50">
              {search.trim() || status !== "all" || ownerFilter
                ? "No owners match your filters."
                : "No restaurant owners yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-gold/10">
                    {["Restaurant", "Email", "Phone", "Plan", "Status", "Joined", "Actions"].map(
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
                  {pageItems.map((item) => (
                    <tr
                      key={item.ownerId}
                      className="table-row-hover border-b border-white/5"
                    >
                      <td className="px-3 py-3 text-sm text-white">
                        {item.restaurantName?.trim() || "Unnamed restaurant"}
                        {item.city ? (
                          <p className="mt-0.5 text-xs text-white/40">{item.city}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/70">
                        {item.email ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/70">
                        {item.phone ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/70">
                        {item.plan ?? "Starter"}
                      </td>
                      <td
                        className={`px-3 py-3 text-sm ${item.isActive ? "text-emerald-300" : "text-red-300"}`}
                      >
                        {item.isActive ? "Active" : "Suspended"}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/50">
                        {formatDemoDate(item.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                          onClick={() => setSelected(item)}
                        >
                          View
                        </button>
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

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <div
            className="dashboard-card w-full max-w-md rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-xl font-bold text-white">
              {selected.restaurantName?.trim() || "Unnamed restaurant"}
            </h2>
            <div className="mt-4 space-y-2 text-sm text-white/70">
              <p>Email: {selected.email ?? "—"}</p>
              <p>Phone: {selected.phone ?? "—"}</p>
              <p>Plan: {selected.plan ?? "Starter"}</p>
              <p>Status: {selected.isActive ? "Active" : "Suspended"}</p>
              <p>City: {selected.city ?? "—"}</p>
              <p>Joined: {formatDemoDate(selected.createdAt)}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="menu-btn-secondary mt-6 w-full"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </AdminPlaceholder>
  );
}
