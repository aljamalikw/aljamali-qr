"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { DemoRequestPagination } from "@/components/admin/demo-requests/DemoRequestPagination";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { restaurantCountLabel } from "@/lib/admin/group-by-owner";
import {
  exportOwnerAccountsToCsv,
  fetchOwnerAccounts,
  type OwnerAccount,
} from "@/lib/admin/owners";
import { formatDemoDate, paginateDemoRequests } from "@/lib/demo-requests/utils";
import { csvTimestamp, downloadCsv } from "@/lib/utils/csv";

const PAGE_SIZE = 10;

type StatusFilter = "all" | "active" | "suspended";

export function AdminOwnersPage() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const ownerIdParam = searchParams.get("ownerId");

  const [items, setItems] = useState<OwnerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [ownerFilter, setOwnerFilter] = useState<string | null>(ownerIdParam);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchOwnerAccounts();
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
        (item.ownerName?.toLowerCase().includes(query) ?? false) ||
        (item.email?.toLowerCase().includes(query) ?? false) ||
        (item.phone?.toLowerCase().includes(query) ?? false) ||
        item.restaurants.some((restaurant) =>
          (restaurant.restaurantName ?? "").toLowerCase().includes(query),
        )
      );
    });
  }, [items, search, status, ownerFilter]);

  const { pageItems, totalPages, page: safePage } = useMemo(
    () => paginateDemoRequests(filtered, page, PAGE_SIZE),
    [filtered, page],
  );

  const toggleExpanded = useCallback((ownerId: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(ownerId)) next.delete(ownerId);
      else next.add(ownerId);
      return next;
    });
  }, []);

  const handleExport = () => {
    if (filtered.length === 0) {
      showToast("No rows available to export", "error");
      return;
    }
    const csv = exportOwnerAccountsToCsv(filtered);
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
              placeholder="Search owner, email, phone, or restaurant…"
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
              {loading
                ? "Loading…"
                : `${filtered.length} owner${filtered.length === 1 ? "" : "s"}`}
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
              <table className="w-full min-w-[1020px] text-left">
                <thead>
                  <tr className="border-b border-gold/10">
                    {[
                      "Owner",
                      "Phone",
                      "Plan",
                      "Status",
                      "Joined",
                      "Restaurants",
                      "Actions",
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
                  {pageItems.map((item) => {
                    const expanded = expandedIds.has(item.ownerId);
                    const ownerLabel =
                      item.ownerName?.trim() || "Unnamed owner";

                    return (
                      <Fragment key={item.ownerId}>
                        <tr className="table-row-hover border-b border-white/5">
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => toggleExpanded(item.ownerId)}
                              aria-expanded={expanded}
                              className="flex max-w-xs items-start gap-2 text-start"
                            >
                              <span
                                className="mt-0.5 inline-block w-3 shrink-0 text-gold/80"
                                aria-hidden="true"
                              >
                                {expanded ? "▼" : "▶"}
                              </span>
                              <span>
                                <span className="block text-sm font-medium text-white">
                                  {ownerLabel}
                                </span>
                                <span className="mt-0.5 block text-xs text-white/40">
                                  {item.email ?? "—"}
                                </span>
                              </span>
                            </button>
                          </td>
                          <td className="px-3 py-3 text-sm text-white/70">
                            {item.phone ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-sm text-white/70">
                            {item.plan}
                          </td>
                          <td
                            className={`px-3 py-3 text-sm ${item.isActive ? "text-emerald-300" : "text-red-300"}`}
                          >
                            {item.isActive ? "Active" : "Suspended"}
                          </td>
                          <td className="px-3 py-3 text-sm text-white/50">
                            {formatDemoDate(item.joinedAt)}
                          </td>
                          <td className="px-3 py-3 text-sm text-white/70">
                            {restaurantCountLabel(item.restaurantCount)}
                          </td>
                          <td className="px-3 py-3">
                            <Link
                              href={`/admin/owners/${item.ownerId}`}
                              className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                        {expanded ? (
                          <tr className="border-b border-white/5 bg-black/20">
                            <td colSpan={7} className="px-3 py-3">
                              <p className="mb-2 text-[11px] uppercase tracking-wider text-white/35">
                                Restaurants under this account
                              </p>
                              <ul className="space-y-2">
                                {item.restaurants.map((restaurant) => (
                                  <li
                                    key={restaurant.restaurantId}
                                    className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70"
                                  >
                                    <span className="text-gold/70" aria-hidden="true">
                                      •
                                    </span>
                                    <span className="font-medium text-white/85">
                                      {restaurant.restaurantName?.trim() ||
                                        "Unnamed restaurant"}
                                    </span>
                                    <span className="text-xs text-white/40">
                                      {restaurant.slug
                                        ? `/${restaurant.slug}`
                                        : "No slug"}
                                    </span>
                                    <span
                                      className={
                                        restaurant.isActive
                                          ? "text-xs text-emerald-300/80"
                                          : "text-xs text-red-300/80"
                                      }
                                    >
                                      {restaurant.isActive
                                        ? "Active"
                                        : "Suspended"}
                                    </span>
                                    <span className="text-xs text-white/40">
                                      Created {formatDemoDate(restaurant.createdAt)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
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
