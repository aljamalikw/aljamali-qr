"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { DemoRequestPagination } from "@/components/admin/demo-requests/DemoRequestPagination";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  bulkUpdateSubscriptionStatus,
  exportSubscriptionsToCsv,
  fetchSubscriptions,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
  updateSubscription,
  type RestaurantSubscription,
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

export function AdminSubscriptionsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<RestaurantSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SubscriptionStatus | "all">("all");
  const [plan, setPlan] = useState<SubscriptionPlan | "all">("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<RestaurantSubscription | null>(null);
  const [nextPlan, setNextPlan] = useState<SubscriptionPlan>("Starter");
  const [nextStatus, setNextStatus] = useState<SubscriptionStatus>("active");
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<SubscriptionStatus | null>(null);
  const [bulkTarget, setBulkTarget] = useState<SubscriptionStatus>("active");
  const [actionLoading, setActionLoading] = useState(false);
  const planPrices = getCatalogMonthlyPrices();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchSubscriptions();
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
      return (
        (item.restaurantName?.toLowerCase().includes(query) ?? false) ||
        (item.restaurantEmail?.toLowerCase().includes(query) ?? false) ||
        item.plan.toLowerCase().includes(query)
      );
    });
  }, [items, search, status, plan]);

  const { pageItems, totalPages, page: safePage } = useMemo(
    () => paginateDemoRequests(filtered, page, PAGE_SIZE),
    [filtered, page],
  );

  const openEdit = (item: RestaurantSubscription) => {
    setEditing(item);
    setNextPlan(item.plan);
    setNextStatus(item.status);
  };

  const handleConfirm = async () => {
    if (!editing) return;
    setSaving(true);
    const result = await updateSubscription({
      id: editing.id,
      restaurantId: editing.restaurantId,
      plan: nextPlan,
      status: nextStatus,
      monthlyPrice: getPlanMonthlyAmount(nextPlan) ?? planPrices[nextPlan],
    });
    setSaving(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === result.data.id ? result.data : item)),
    );
    setEditing(null);
    showToast("Subscription updated");
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((previous) => {
      const pageIds = pageItems.map((item) => item.id);
      const allSelected = pageIds.every((id) => previous.has(id));
      if (allSelected) {
        const next = new Set(previous);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...previous, ...pageIds]);
    });
  }, [pageItems]);

  const handleBulkStatusConfirm = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setActionLoading(true);
    const result = await bulkUpdateSubscriptionStatus(
      [...selectedIds],
      bulkTarget,
    );
    setActionLoading(false);
    setBulkStatus(null);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setSelectedIds(new Set());
    await load();
    showToast(`Updated ${selectedIds.size} subscription(s) to ${bulkTarget}`);
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      showToast("No rows available to export", "error");
      return;
    }
    const csv = exportSubscriptionsToCsv(filtered);
    downloadCsv(`subscriptions-${csvTimestamp()}.csv`, csv);
    showToast(`Exported ${filtered.length} subscriptions`);
  };

  const allPageSelected =
    pageItems.length > 0 && pageItems.every((item) => selectedIds.has(item.id));

  return (
    <AdminPlaceholder
      title="Subscriptions"
      description="Track plan tiers, renewals and subscription status."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurant, email, or plan…"
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
            {selectedIds.size > 0 ? (
              <div className="dashboard-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
                <p className="text-sm text-white/70">
                  {selectedIds.size} selected
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
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left">
                <thead>
                  <tr className="border-b border-gold/10">
                    <th className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all subscriptions on this page"
                        className="h-4 w-4 accent-gold"
                      />
                    </th>
                    {[
                      "Restaurant",
                      "Plan",
                      "Price",
                      "Status",
                      "Renewal",
                      "Started",
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
                  {pageItems.map((item) => (
                    <tr key={item.id} className="table-row-hover border-b border-white/5">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          aria-label={`Select ${item.restaurantName ?? "subscription"}`}
                          className="h-4 w-4 accent-gold"
                        />
                      </td>
                      <td className="px-3 py-3 text-sm text-white">
                        <p>
                          {item.restaurantName?.trim() || "Unnamed restaurant"}
                        </p>
                        <p className="text-xs text-white/40">
                          {item.restaurantEmail ?? "—"}
                        </p>
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
                      <td className="px-3 py-3 text-sm text-white/50">
                        {formatDemoDate(item.startedAt)}
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

      <ConfirmModal
        open={Boolean(editing)}
        title="Update Subscription"
        description={
          editing ? (
            <div className="space-y-3 text-left">
              <p className="text-sm text-white/60">
                {editing.restaurantName?.trim() || "Restaurant"}
              </p>
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
        title="Update Selected Subscriptions?"
        description={`${selectedIds.size} subscription(s) will be set to "${bulkTarget}".`}
        confirmLabel="Apply"
        variant={bulkTarget === "cancelled" ? "danger" : "default"}
        loading={actionLoading}
        onConfirm={() => void handleBulkStatusConfirm()}
        onCancel={() => setBulkStatus(null)}
      />
    </AdminPlaceholder>
  );
}
