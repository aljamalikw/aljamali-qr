"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { DemoRequestPagination } from "@/components/admin/demo-requests/DemoRequestPagination";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchAdminRestaurants } from "@/lib/admin/platform-stats";
import {
  RESTAURANT_STATUS_FILTERS,
  bulkSetRestaurantsActive,
  changeRestaurantPlan,
  exportRestaurantsToCsv,
  getRestaurantStatusFilter,
  setRestaurantActive,
  type RestaurantStatusFilter,
} from "@/lib/admin/restaurants";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "@/lib/admin/subscriptions";
import {
  formatDemoDate,
  paginateDemoRequests,
} from "@/lib/demo-requests/utils";
import { csvTimestamp, downloadCsv } from "@/lib/utils/csv";
import type { Restaurant } from "@/lib/restaurants/types";

const PAGE_SIZE = 10;

type ConfirmAction =
  | { type: "activate" | "suspend"; restaurant: Restaurant }
  | null;

type BulkAction = "activate" | "suspend" | null;

const STATUS_LABELS: Record<RestaurantStatusFilter, string> = {
  active: "Active",
  suspended: "Suspended",
  incomplete: "Incomplete",
};

const STATUS_CLASSES: Record<RestaurantStatusFilter, string> = {
  active: "text-emerald-300",
  suspended: "text-red-300",
  incomplete: "text-amber-300",
};

export function AdminRestaurantsPage() {
  const { showToast } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RestaurantStatusFilter | "all">("all");
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [planTarget, setPlanTarget] = useState<Restaurant | null>(null);
  const [nextPlan, setNextPlan] = useState<SubscriptionPlan>("Starter");
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchAdminRestaurants();
    if (!result.ok) {
      setError(result.message);
      setRestaurants([]);
    } else {
      setRestaurants(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const filteredRestaurants = useMemo(() => {
    const query = search.trim().toLowerCase();
    return restaurants.filter((restaurant) => {
      if (status !== "all" && getRestaurantStatusFilter(restaurant) !== status) {
        return false;
      }
      if (!query) return true;
      const name = restaurant.restaurant_name?.toLowerCase() ?? "";
      const email = restaurant.email?.toLowerCase() ?? "";
      const plan = restaurant.subscription_plan?.toLowerCase() ?? "";
      return (
        name.includes(query) || email.includes(query) || plan.includes(query)
      );
    });
  }, [restaurants, search, status]);

  const { pageItems, totalPages, page: safePage } = useMemo(
    () => paginateDemoRequests(filteredRestaurants, page, PAGE_SIZE),
    [filteredRestaurants, page],
  );

  const replaceRestaurant = (updated: Restaurant) => {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
    );
  };

  const handleConfirmActive = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    const isActive = confirmAction.type === "activate";
    const result = await setRestaurantActive(
      confirmAction.restaurant.id,
      isActive,
    );
    setActionLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    replaceRestaurant(result.data);
    setConfirmAction(null);
    showToast(isActive ? "Restaurant activated" : "Restaurant suspended");
  };

  const handleChangePlan = async () => {
    if (!planTarget) return;
    setActionLoading(true);
    const result = await changeRestaurantPlan(planTarget.id, nextPlan);
    setActionLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    replaceRestaurant({
      ...planTarget,
      subscription_plan: nextPlan,
    });
    setPlanTarget(null);
    showToast(`Plan updated to ${nextPlan}`);
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

  const handleBulkConfirm = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    setActionLoading(true);
    const result = await bulkSetRestaurantsActive(
      [...selectedIds],
      bulkAction === "activate",
    );
    setActionLoading(false);
    setBulkAction(null);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setSelectedIds(new Set());
    await loadRestaurants();
    showToast(
      bulkAction === "activate"
        ? `Activated ${selectedIds.size} restaurants`
        : `Suspended ${selectedIds.size} restaurants`,
    );
  };

  const handleExport = () => {
    if (filteredRestaurants.length === 0) {
      showToast("No rows available to export", "error");
      return;
    }
    const csv = exportRestaurantsToCsv(filteredRestaurants);
    downloadCsv(`restaurants-${csvTimestamp()}.csv`, csv);
    showToast(`Exported ${filteredRestaurants.length} restaurants`);
  };

  if (error) {
    return (
      <AdminPlaceholder
        title="Restaurants"
        description="Manage every restaurant on the Aljamali QR platform."
      >
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-sm text-white/50">{error}</p>
          <button
            type="button"
            onClick={() => void loadRestaurants()}
            className="menu-btn-primary mt-6"
          >
            Try Again
          </button>
        </div>
      </AdminPlaceholder>
    );
  }

  const allPageSelected =
    pageItems.length > 0 && pageItems.every((item) => selectedIds.has(item.id));

  return (
    <AdminPlaceholder
      title="Restaurants"
      description="Manage every restaurant on the Aljamali QR platform."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by restaurant name, email, or plan…"
              aria-label="Search restaurants"
              className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
            />
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as RestaurantStatusFilter | "all")
              }
              aria-label="Filter by status"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-gold/30 focus:outline-none"
            >
              <option value="all">All statuses</option>
              {RESTAURANT_STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-white/45">
              {loading
                ? "Loading…"
                : `${filteredRestaurants.length} restaurant${filteredRestaurants.length === 1 ? "" : "s"}`}
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
        ) : filteredRestaurants.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-white/50">
              {search.trim() || status !== "all"
                ? "No restaurants match your search."
                : "No restaurants registered yet."}
            </p>
          </div>
        ) : (
          <>
            {selectedIds.size > 0 ? (
              <div className="dashboard-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
                <p className="text-sm text-white/70">
                  {selectedIds.size} selected
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="menu-btn-secondary"
                    onClick={() => setBulkAction("activate")}
                  >
                    Bulk Activate
                  </button>
                  <button
                    type="button"
                    className="menu-btn-danger"
                    onClick={() => setBulkAction("suspend")}
                  >
                    Bulk Suspend
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
              <table className="w-full min-w-[1020px] text-left">
                <thead>
                  <tr className="border-b border-gold/10">
                    <th className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all restaurants on this page"
                        className="h-4 w-4 accent-gold"
                      />
                    </th>
                    {[
                      "Restaurant",
                      "Owner",
                      "Plan",
                      "Status",
                      "Created",
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
                  {pageItems.map((restaurant) => {
                    const statusValue = getRestaurantStatusFilter(restaurant);
                    const isSuspended = restaurant.is_active === false;

                    return (
                      <tr
                        key={restaurant.id}
                        className="table-row-hover border-b border-white/5"
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(restaurant.id)}
                            onChange={() => toggleSelect(restaurant.id)}
                            aria-label={`Select ${restaurant.restaurant_name ?? "restaurant"}`}
                            className="h-4 w-4 accent-gold"
                          />
                        </td>
                        <td className="px-3 py-3 text-sm text-white">
                          {restaurant.restaurant_name?.trim() ||
                            "Unnamed restaurant"}
                        </td>
                        <td className="px-3 py-3 text-sm text-white/70">
                          {restaurant.email ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-sm text-white/70">
                          {restaurant.subscription_plan ?? "Starter"}
                        </td>
                        <td
                          className={`px-3 py-3 text-sm ${STATUS_CLASSES[statusValue]}`}
                        >
                          {STATUS_LABELS[statusValue]}
                        </td>
                        <td className="px-3 py-3 text-sm text-white/50">
                          {formatDemoDate(restaurant.created_at)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/admin/owners?ownerId=${restaurant.owner_id}`}
                              className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                            >
                              View Owner
                            </Link>
                            <button
                              type="button"
                              className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                              onClick={() => {
                                setPlanTarget(restaurant);
                                setNextPlan(
                                  (restaurant.subscription_plan as SubscriptionPlan) ||
                                    "Starter",
                                );
                              }}
                            >
                              Change Plan
                            </button>
                            {isSuspended ? (
                              <button
                                type="button"
                                className="menu-btn-primary !px-2.5 !py-1.5 text-xs"
                                onClick={() =>
                                  setConfirmAction({
                                    type: "activate",
                                    restaurant,
                                  })
                                }
                              >
                                Activate
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="menu-btn-danger !px-2.5 !py-1.5 text-xs"
                                onClick={() =>
                                  setConfirmAction({
                                    type: "suspend",
                                    restaurant,
                                  })
                                }
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <DemoRequestPagination
              page={safePage}
              totalPages={totalPages}
              totalItems={filteredRestaurants.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmAction?.type === "activate"}
        title="Activate Restaurant?"
        description="This restaurant will regain full platform access."
        confirmLabel="Activate"
        loading={actionLoading}
        onConfirm={() => void handleConfirmActive()}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        open={confirmAction?.type === "suspend"}
        title="Suspend Restaurant?"
        description="The restaurant will be marked inactive until reactivated."
        confirmLabel="Suspend"
        variant="danger"
        loading={actionLoading}
        onConfirm={() => void handleConfirmActive()}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        open={Boolean(planTarget)}
        title="Change Subscription"
        description={
          planTarget ? (
            <div className="space-y-3 text-left">
              <p className="text-sm text-white/60">
                {planTarget.restaurant_name?.trim() || "Restaurant"}
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
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <option key={plan} value={plan}>
                      {plan}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null
        }
        confirmLabel="Update Plan"
        loading={actionLoading}
        onConfirm={() => void handleChangePlan()}
        onCancel={() => setPlanTarget(null)}
      />

      <ConfirmModal
        open={bulkAction === "activate"}
        title="Activate Selected Restaurants?"
        description={`${selectedIds.size} restaurant(s) will regain full platform access.`}
        confirmLabel="Activate"
        loading={actionLoading}
        onConfirm={() => void handleBulkConfirm()}
        onCancel={() => setBulkAction(null)}
      />

      <ConfirmModal
        open={bulkAction === "suspend"}
        title="Suspend Selected Restaurants?"
        description={`${selectedIds.size} restaurant(s) will be marked inactive.`}
        confirmLabel="Suspend"
        variant="danger"
        loading={actionLoading}
        onConfirm={() => void handleBulkConfirm()}
        onCancel={() => setBulkAction(null)}
      />
    </AdminPlaceholder>
  );
}
