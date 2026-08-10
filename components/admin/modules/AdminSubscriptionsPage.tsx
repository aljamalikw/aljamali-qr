"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { DemoRequestPagination } from "@/components/admin/demo-requests/DemoRequestPagination";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  bulkUpdateSubscriptionStatus,
  exportOwnerSubscriptionsToCsv,
  fetchOwnerSubscriptionAccounts,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
  updateOwnerSubscription,
  type OwnerSubscriptionAccount,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "@/lib/admin/subscriptions";
import {
  formatDemoDate,
  paginateDemoRequests,
} from "@/lib/demo-requests/utils";
import {
  formatPlanPriceLabel,
  getPlanMonthlyAmount,
} from "@/lib/subscriptions/plans";
import { getCatalogMonthlyPrices } from "@/lib/subscriptions/pricing";
import { csvTimestamp, downloadCsv } from "@/lib/utils/csv";

const PAGE_SIZE = 10;

function statusClass(status: SubscriptionStatus): string {
  switch (status) {
    case "active":
      return "text-emerald-300";
    case "trial":
      return "text-sky-300";
    case "grace":
      return "text-amber-200";
    case "suspended":
      return "text-orange-300";
    case "expired":
      return "text-amber-300";
    case "cancelled":
      return "text-red-300";
    default:
      return "text-white/60";
  }
}

function restaurantCountLabel(count: number): string {
  return `${count} Restaurant${count === 1 ? "" : "s"}`;
}

export function AdminSubscriptionsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<OwnerSubscriptionAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SubscriptionStatus | "all">("all");
  const [plan, setPlan] = useState<SubscriptionPlan | "all">("all");
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<OwnerSubscriptionAccount | null>(null);
  const [nextPlan, setNextPlan] = useState<SubscriptionPlan>("Starter");
  const [nextStatus, setNextStatus] = useState<SubscriptionStatus>("active");
  const [saving, setSaving] = useState(false);
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<Set<string>>(
    new Set(),
  );
  const [bulkStatus, setBulkStatus] = useState<SubscriptionStatus | null>(null);
  const [bulkTarget, setBulkTarget] = useState<SubscriptionStatus>("active");
  const [actionLoading, setActionLoading] = useState(false);
  const planPrices = getCatalogMonthlyPrices();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchOwnerSubscriptionAccounts();
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
  }, [search, status, plan]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (plan !== "all" && item.plan !== plan) return false;
      if (!query) return true;

      const ownerNameMatch =
        item.ownerName?.toLowerCase().includes(query) ?? false;
      const ownerEmailMatch =
        item.ownerEmail?.toLowerCase().includes(query) ?? false;
      const restaurantMatch = item.restaurants.some((restaurant) =>
        (restaurant.restaurantName ?? "").toLowerCase().includes(query),
      );

      return ownerNameMatch || ownerEmailMatch || restaurantMatch;
    });
  }, [items, search, status, plan]);

  const { pageItems, totalPages, page: safePage } = useMemo(
    () => paginateDemoRequests(filtered, page, PAGE_SIZE),
    [filtered, page],
  );

  const openEdit = (item: OwnerSubscriptionAccount) => {
    setEditing(item);
    setNextPlan(item.plan);
    setNextStatus(item.status);
  };

  const toggleExpanded = useCallback((ownerId: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(ownerId)) next.delete(ownerId);
      else next.add(ownerId);
      return next;
    });
  }, []);

  const handleConfirm = async () => {
    if (!editing) return;
    setSaving(true);
    const result = await updateOwnerSubscription({
      ownerId: editing.ownerId,
      subscriptionIds: editing.subscriptionIds,
      restaurantIds: editing.restaurantIds,
      plan: nextPlan,
      status: nextStatus,
      monthlyPrice: getPlanMonthlyAmount(nextPlan) ?? planPrices[nextPlan],
    });
    setSaving(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setEditing(null);
    await load();
    showToast("Owner subscription updated");
  };

  const toggleSelect = useCallback((ownerId: string) => {
    setSelectedOwnerIds((previous) => {
      const next = new Set(previous);
      if (next.has(ownerId)) next.delete(ownerId);
      else next.add(ownerId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedOwnerIds((previous) => {
      const pageIds = pageItems.map((item) => item.ownerId);
      const allSelected = pageIds.every((id) => previous.has(id));
      if (allSelected) {
        const next = new Set(previous);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...previous, ...pageIds]);
    });
  }, [pageItems]);

  const selectedSubscriptionIds = useMemo(() => {
    const ids: string[] = [];
    for (const item of items) {
      if (!selectedOwnerIds.has(item.ownerId)) continue;
      ids.push(...item.subscriptionIds);
    }
    return ids;
  }, [items, selectedOwnerIds]);

  const handleBulkStatusConfirm = async () => {
    if (!bulkStatus || selectedSubscriptionIds.length === 0) return;
    const ownerCount = selectedOwnerIds.size;
    setActionLoading(true);
    const result = await bulkUpdateSubscriptionStatus(
      selectedSubscriptionIds,
      bulkTarget,
    );
    setActionLoading(false);
    setBulkStatus(null);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setSelectedOwnerIds(new Set());
    await load();
    showToast(`Updated ${ownerCount} owner subscription(s) to ${bulkTarget}`);
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      showToast("No rows available to export", "error");
      return;
    }
    const csv = exportOwnerSubscriptionsToCsv(filtered);
    downloadCsv(`subscriptions-${csvTimestamp()}.csv`, csv);
    showToast(`Exported ${filtered.length} owner subscriptions`);
  };

  const allPageSelected =
    pageItems.length > 0 &&
    pageItems.every((item) => selectedOwnerIds.has(item.ownerId));

  return (
    <AdminPlaceholder
      title="Subscriptions"
      description="Track owner plans, renewals, and restaurants under each account."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search owner, email, or restaurant…"
            aria-label="Search subscriptions"
            className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={plan}
              onChange={(e) =>
                setPlan(e.target.value as SubscriptionPlan | "all")
              }
              aria-label="Filter by plan"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
            >
              <option value="all">All plans</option>
              {SUBSCRIPTION_PLANS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as SubscriptionStatus | "all")
              }
              aria-label="Filter by status"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
            >
              <option value="all">All statuses</option>
              {SUBSCRIPTION_STATUSES.map((s) => (
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
          <div className="py-12 text-center">
            <p className="text-sm text-white/50">
              {search || status !== "all" || plan !== "all"
                ? "No subscriptions match your filters."
                : "No subscriptions yet."}
            </p>
          </div>
        ) : (
          <>
            {selectedOwnerIds.size > 0 ? (
              <div className="dashboard-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
                <p className="text-sm text-white/70">
                  {selectedOwnerIds.size} owner
                  {selectedOwnerIds.size === 1 ? "" : "s"} selected
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={bulkTarget}
                    onChange={(e) =>
                      setBulkTarget(e.target.value as SubscriptionStatus)
                    }
                    aria-label="Bulk status target"
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                  >
                    {SUBSCRIPTION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="menu-btn-secondary"
                    onClick={() => setBulkStatus(bulkTarget)}
                  >
                    Apply Status
                  </button>
                  <button
                    type="button"
                    className="menu-btn-secondary"
                    onClick={() => setSelectedOwnerIds(new Set())}
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left">
                <thead>
                  <tr className="border-b border-gold/10">
                    <th className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all owners on this page"
                        className="h-4 w-4 accent-gold"
                      />
                    </th>
                    {[
                      "Owner",
                      "Plan",
                      "Price",
                      "Status",
                      "Renewal",
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
                          <td className="px-3 py-3 align-top">
                            <input
                              type="checkbox"
                              checked={selectedOwnerIds.has(item.ownerId)}
                              onChange={() => toggleSelect(item.ownerId)}
                              aria-label={`Select ${ownerLabel}`}
                              className="mt-1 h-4 w-4 accent-gold"
                            />
                          </td>
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
                                  {item.ownerEmail ?? "—"}
                                </span>
                              </span>
                            </button>
                          </td>
                          <td className="px-3 py-3 text-sm text-white/70">
                            {item.plan}
                          </td>
                          <td className="px-3 py-3 text-sm text-white/70">
                            {formatPlanPriceLabel(item.plan)}
                          </td>
                          <td
                            className={`px-3 py-3 text-sm capitalize ${statusClass(item.status)}`}
                          >
                            {item.status}
                          </td>
                          <td className="px-3 py-3 text-sm text-white/50">
                            {formatDemoDate(item.renewalDate)}
                          </td>
                          <td className="px-3 py-3 text-sm text-white/70">
                            {restaurantCountLabel(item.restaurantCount)}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                              onClick={() => openEdit(item)}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                        {expanded ? (
                          <tr className="border-b border-white/5 bg-black/20">
                            <td />
                            <td colSpan={7} className="px-3 py-3">
                              <p className="mb-2 text-[11px] uppercase tracking-wider text-white/35">
                                Restaurants under this account
                              </p>
                              <ul className="space-y-1.5">
                                {item.restaurants.map((restaurant) => (
                                  <li
                                    key={restaurant.restaurantId}
                                    className="flex items-center gap-2 text-sm text-white/70"
                                  >
                                    <span
                                      className="text-gold/70"
                                      aria-hidden="true"
                                    >
                                      •
                                    </span>
                                    <span>
                                      {restaurant.restaurantName?.trim() ||
                                        "Unnamed restaurant"}
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

      <ConfirmModal
        open={Boolean(editing)}
        title="Update Owner Subscription"
        description={
          editing ? (
            <div className="space-y-3 text-left">
              <div>
                <p className="text-sm text-white/80">
                  {editing.ownerName?.trim() || "Unnamed owner"}
                </p>
                <p className="mt-0.5 text-xs text-white/45">
                  {editing.ownerEmail ?? "—"} ·{" "}
                  {restaurantCountLabel(editing.restaurantCount)}
                </p>
                <p className="mt-2 text-xs text-white/40">
                  Changes apply to every restaurant under this owner account.
                </p>
              </div>
              <label className="block text-xs uppercase tracking-wider text-white/40">
                Plan
                <select
                  value={nextPlan}
                  onChange={(e) =>
                    setNextPlan(e.target.value as SubscriptionPlan)
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                >
                  {SUBSCRIPTION_PLANS.map((p) => (
                    <option key={p} value={p}>
                      {p} — {formatPlanPriceLabel(p)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs uppercase tracking-wider text-white/40">
                Status
                <select
                  value={nextStatus}
                  onChange={(e) =>
                    setNextStatus(e.target.value as SubscriptionStatus)
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                >
                  {SUBSCRIPTION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null
        }
        confirmLabel="Save"
        loading={saving}
        onConfirm={() => void handleConfirm()}
        onCancel={() => setEditing(null)}
      />

      <ConfirmModal
        open={Boolean(bulkStatus)}
        title="Update Selected Owner Subscriptions?"
        description={`${selectedOwnerIds.size} owner account(s) (${selectedSubscriptionIds.length} restaurant subscription row(s)) will be set to "${bulkTarget}".`}
        confirmLabel="Apply"
        variant={bulkTarget === "cancelled" ? "danger" : "default"}
        loading={actionLoading}
        onConfirm={() => void handleBulkStatusConfirm()}
        onCancel={() => setBulkStatus(null)}
      />
    </AdminPlaceholder>
  );
}
