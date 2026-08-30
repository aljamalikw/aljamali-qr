"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { ManageRestaurantDrawer } from "@/components/admin/restaurants/ManageRestaurantDrawer";
import { DemoRequestPagination } from "@/components/admin/demo-requests/DemoRequestPagination";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchIsSuperAdmin } from "@/lib/auth/get-user-role";
import { startImpersonation } from "@/lib/admin/impersonation-client";
import {
  RESTAURANT_STATUS_FILTERS,
  permanentlyDeleteRestaurant,
  permanentlyRemoveOwnerAccount,
  exportRestaurantsToCsv,
  fetchAdminRestaurantManagementRows,
  getRestaurantManagementKpis,
  groupRestaurantManagementByOwner,
  setRestaurantActive,
  setRestaurantArchived,
  type AdminRestaurantManagementRow,
  type RestaurantStatusFilter,
} from "@/lib/admin/restaurants";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  formatTrialCountdown,
} from "@/lib/admin/restaurant-status";
import { restaurantCountLabel } from "@/lib/admin/group-by-owner";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "@/lib/admin/subscriptions";
import {
  formatCoveredRestaurantUsage,
  formatPlanPriceLabel,
  normalizePlanId,
} from "@/lib/subscriptions/plans";
import {
  formatDemoDate,
  paginateDemoRequests,
} from "@/lib/demo-requests/utils";
import { supabase } from "@/lib/supabase";
import { csvTimestamp, downloadCsv } from "@/lib/utils/csv";

const PAGE_SIZE = 10;
const REMOVE_OWNER_CONFIRM_PHRASE = "Yes, permanently remove account";

type DeletedRestaurantRecord = {
  restaurantId: string;
  restaurantName: string | null;
  ownerId: string;
  ownerName: string | null;
  email: string | null;
  canRemoveOwner: boolean;
  ownerAccountRemoved: boolean;
};

type MenuAction =
  | "view"
  | "manage"
  | "impersonate"
  | "suspend"
  | "activate"
  | "archive"
  | "delete";

type PendingAction =
  | {
      type: "suspend" | "activate" | "archive";
      restaurant: AdminRestaurantManagementRow;
    }
  | null;

function StatusBadge({ status }: { status: RestaurantStatusFilter }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function CoverageBadge({ covered }: { covered: boolean }) {
  return covered ? (
    <span className="inline-flex rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
      Covered
    </span>
  ) : (
    <span className="inline-flex rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200">
      Not covered
    </span>
  );
}

function RenewalCell({
  renewalDate,
  historicalTrialEndsAt,
}: {
  renewalDate: string | null;
  historicalTrialEndsAt: string | null;
}) {
  const renewal = formatTrialCountdown(renewalDate);
  const historical =
    historicalTrialEndsAt && historicalTrialEndsAt !== renewalDate
      ? formatTrialCountdown(historicalTrialEndsAt)
      : null;
  return (
    <div>
      <p className="text-sm text-white/70">{renewal.dateLabel}</p>
      {renewal.remainingLabel ? (
        <p className="mt-0.5 text-xs text-white/40">{renewal.remainingLabel}</p>
      ) : null}
      {historical ? (
        <p className="mt-1 text-[11px] text-white/30">
          Historical trial: {historical.dateLabel}
        </p>
      ) : null}
    </div>
  );
}

export function AdminRestaurantsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<AdminRestaurantManagementRow[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RestaurantStatusFilter | "all">("all");
  const [plan, setPlan] = useState<SubscriptionPlan | "all">("all");
  const [page, setPage] = useState(1);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewTarget, setViewTarget] =
    useState<AdminRestaurantManagementRow | null>(null);
  const [manageTarget, setManageTarget] =
    useState<AdminRestaurantManagementRow | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<AdminRestaurantManagementRow | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deletedRecords, setDeletedRecords] = useState<DeletedRestaurantRecord[]>(
    [],
  );
  const [removeOwnerTarget, setRemoveOwnerTarget] =
    useState<DeletedRestaurantRecord | null>(null);
  const [removeOwnerConfirm, setRemoveOwnerConfirm] = useState("");
  const [impersonateTarget, setImpersonateTarget] =
    useState<AdminRestaurantManagementRow | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    async function gate() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      const isSuper = await fetchIsSuperAdmin(user);
      if (!mounted) return;
      setCurrentUserId(user?.id ?? null);
      setAllowed(isSuper);
    }
    void gate();
    return () => {
      mounted = false;
    };
  }, []);

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchAdminRestaurantManagementRows();
    if (!result.ok) {
      setError(result.message);
      setRestaurants([]);
    } else {
      setRestaurants(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (allowed) void loadRestaurants();
  }, [allowed, loadRestaurants]);

  useEffect(() => {
    setPage(1);
  }, [search, status, plan]);

  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpenId]);

  const ownerGroupsAll = useMemo(
    () => groupRestaurantManagementByOwner(restaurants),
    [restaurants],
  );

  const ownerGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ownerGroupsAll.filter((group) => {
      if (plan !== "all" && group.plan !== plan) return false;
      if (
        status !== "all" &&
        !group.restaurants.some((restaurant) => restaurant.status === status)
      ) {
        return false;
      }
      if (!query) return true;
      return (
        (group.ownerName?.toLowerCase().includes(query) ?? false) ||
        (group.email?.toLowerCase().includes(query) ?? false) ||
        group.plan.toLowerCase().includes(query) ||
        group.restaurants.some(
          (restaurant) =>
            restaurant.restaurantName?.toLowerCase().includes(query) ?? false,
        )
      );
    });
  }, [ownerGroupsAll, search, status, plan]);

  const filteredRestaurants = useMemo(
    () => ownerGroups.flatMap((group) => group.restaurants),
    [ownerGroups],
  );

  const kpis = useMemo(
    () => getRestaurantManagementKpis(restaurants),
    [restaurants],
  );

  const { pageItems, totalPages, page: safePage } = useMemo(
    () => paginateDemoRequests(ownerGroups, page, PAGE_SIZE),
    [ownerGroups, page],
  );

  const toggleExpanded = useCallback((ownerId: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(ownerId)) next.delete(ownerId);
      else next.add(ownerId);
      return next;
    });
  }, []);

  const beginDelete = (restaurant: AdminRestaurantManagementRow) => {
    if (currentUserId && restaurant.ownerId === currentUserId) {
      showToast("You cannot permanently delete your own restaurant.", "error");
      return;
    }
    setDeleteTarget(restaurant);
    setDeleteConfirmName("");
    setManageTarget(null);
  };

  const handleMenuAction = (
    action: MenuAction,
    restaurant: AdminRestaurantManagementRow,
  ) => {
    setMenuOpenId(null);
    switch (action) {
      case "view":
        setViewTarget(restaurant);
        break;
      case "manage":
        setManageTarget(restaurant);
        break;
      case "impersonate":
        setImpersonateTarget(restaurant);
        break;
      case "suspend":
        setPendingAction({ type: "suspend", restaurant });
        break;
      case "activate":
        setPendingAction({ type: "activate", restaurant });
        break;
      case "archive":
        setPendingAction({ type: "archive", restaurant });
        break;
      case "delete":
        beginDelete(restaurant);
        break;
      default:
        break;
    }
  };

  const handleConfirmPending = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    const { type, restaurant } = pendingAction;

    let result:
      | { ok: true; data: { id: string } }
      | { ok: false; message: string };

    if (type === "archive") {
      result = await setRestaurantArchived(restaurant.id, true);
    } else {
      result = await setRestaurantActive(restaurant.id, type === "activate");
    }

    setActionLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    await loadRestaurants();
    setPendingAction(null);
    showToast(
      type === "activate"
        ? "Restaurant activated"
        : type === "suspend"
          ? "Restaurant suspended"
          : "Restaurant archived",
    );
  };

  const handleDeletePermanently = async () => {
    if (!deleteTarget) return;

    const expected = (deleteTarget.restaurantName ?? "").trim();
    const typed = deleteConfirmName.trim();
    if (!expected || typed !== expected) {
      showToast("Type the restaurant name exactly to confirm deletion.", "error");
      return;
    }
    if (currentUserId && deleteTarget.ownerId === currentUserId) {
      showToast("You cannot permanently delete your own restaurant.", "error");
      return;
    }

    setActionLoading(true);
    const result = await permanentlyDeleteRestaurant(
      deleteTarget.id,
      deleteConfirmName,
      currentUserId,
      deleteTarget.ownerId,
    );
    setActionLoading(false);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    const remainingForOwner = restaurants.filter(
      (row) =>
        row.ownerId === deleteTarget.ownerId && row.id !== deleteTarget.id,
    );
    const record: DeletedRestaurantRecord = {
      restaurantId: deleteTarget.id,
      restaurantName: deleteTarget.restaurantName,
      ownerId: deleteTarget.ownerId,
      ownerName: deleteTarget.ownerName,
      email: deleteTarget.email,
      canRemoveOwner: remainingForOwner.length === 0,
      ownerAccountRemoved: false,
    };

    setRestaurants((prev) => prev.filter((row) => row.id !== deleteTarget.id));
    setDeletedRecords((prev) => [
      record,
      ...prev.filter((item) => item.restaurantId !== record.restaurantId),
    ]);
    setDeleteTarget(null);
    setDeleteConfirmName("");
    showToast("Restaurant permanently deleted");
  };

  const handleRemoveOwnerAccount = async () => {
    if (!removeOwnerTarget) return;
    if (removeOwnerConfirm.trim() !== REMOVE_OWNER_CONFIRM_PHRASE) {
      showToast(
        `Type “${REMOVE_OWNER_CONFIRM_PHRASE}” to confirm.`,
        "error",
      );
      return;
    }
    if (currentUserId && removeOwnerTarget.ownerId === currentUserId) {
      showToast("You cannot permanently remove your own account.", "error");
      return;
    }

    setActionLoading(true);
    const result = await permanentlyRemoveOwnerAccount(
      removeOwnerTarget.ownerId,
      removeOwnerTarget.restaurantId,
    );
    setActionLoading(false);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    setDeletedRecords((prev) =>
      prev.map((item) =>
        item.ownerId === removeOwnerTarget.ownerId
          ? { ...item, ownerAccountRemoved: true, canRemoveOwner: false }
          : item,
      ),
    );
    setRemoveOwnerTarget(null);
    setRemoveOwnerConfirm("");
    showToast("Owner account permanently removed");
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

  const runImpersonation = async (restaurant: AdminRestaurantManagementRow) => {
    setActionLoading(true);
    const result = await startImpersonation(
      restaurant.id,
      "Login as Restaurant",
    );
    setActionLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setImpersonateTarget(null);
    setManageTarget(null);
    router.push("/dashboard");
  };

  const kpiCards: { label: string; value: string }[] = [
    { label: "Restaurants", value: String(kpis.restaurants) },
    { label: "Active", value: String(kpis.active) },
    { label: "Trial", value: String(kpis.trial) },
    { label: "Suspended", value: String(kpis.suspended) },
    { label: "Archived", value: String(kpis.archived) },
    { label: "Expired", value: String(kpis.expired) },
    {
      label: "Monthly Revenue (MRR)",
      value: `${kpis.mrr.toFixed(kpis.mrr % 1 === 0 ? 0 : 2)} KWD`,
    },
    { label: "Total QR Codes", value: String(kpis.totalQrCodes) },
  ];

  if (allowed === null) {
    return (
      <AdminPlaceholder
        title="Restaurant Management"
        description="Super Admin control center for every restaurant on the platform."
      >
        <TableSkeleton rows={4} />
      </AdminPlaceholder>
    );
  }

  if (!allowed) {
    return (
      <AdminPlaceholder
        title="Restaurant Management"
        description="Super Admin control center for every restaurant on the platform."
      >
        <div className="py-16 text-center">
          <p className="font-serif text-xl text-white">Super Admin access required</p>
          <p className="mt-2 text-sm text-white/50">
            Only Super Admins can manage restaurants from this page.
          </p>
          <Link href="/admin/dashboard" className="menu-btn-secondary mt-6 inline-flex">
            Back to Dashboard
          </Link>
        </div>
      </AdminPlaceholder>
    );
  }

  if (error) {
    return (
      <AdminPlaceholder
        title="Restaurant Management"
        description="Super Admin control center for every restaurant on the platform."
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

  return (
    <AdminPlaceholder
      title="Restaurant Management"
      description="Search, filter, and manage every restaurant with Super Admin controls."
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card, index) => (
            <DashboardCard key={card.label} delay={index * 0.03} className="p-4 sm:p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/45">
                {card.label}
              </p>
              <p className="mt-2.5 font-serif text-2xl font-bold text-white sm:text-3xl">
                {card.value}
              </p>
            </DashboardCard>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search restaurant, owner, or email…"
              aria-label="Search restaurants"
              className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
            />
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as RestaurantStatusFilter | "all")
              }
              aria-label="Filter by status"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
            >
              <option value="all">All statuses</option>
              {RESTAURANT_STATUS_FILTERS.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
            <select
              value={plan}
              onChange={(event) =>
                setPlan(event.target.value as SubscriptionPlan | "all")
              }
              aria-label="Filter by plan"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
            >
              <option value="all">All plans</option>
              {SUBSCRIPTION_PLANS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-white/45">
              {loading
                ? "Loading…"
                : `${ownerGroups.length} owner${ownerGroups.length === 1 ? "" : "s"} · ${filteredRestaurants.length} restaurant${filteredRestaurants.length === 1 ? "" : "s"}`}
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

        {deletedRecords.length > 0 ? (
          <section className="rounded-2xl border border-red-500/20 bg-black/30 p-4 sm:p-5">
            <h2 className="font-serif text-lg font-semibold text-white">
              Recently deleted
            </h2>
            <p className="mt-1 text-sm text-white/50">
              These restaurants are no longer active. Remove the owner account
              only when you want that email available for a new registration.
            </p>
            <div className="mt-4 space-y-3">
              {deletedRecords.map((record) => (
                <div
                  key={record.restaurantId}
                  className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {record.restaurantName || "Unnamed restaurant"}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-white/50">
                      {record.ownerName || "Owner"}
                      {record.email ? ` · ${record.email}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/55">
                        Restaurant: Deleted
                      </span>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                          record.ownerAccountRemoved
                            ? "border-white/20 bg-white/5 text-white/50"
                            : "border-amber-500/35 bg-amber-500/10 text-amber-200"
                        }`}
                      >
                        Owner Account:{" "}
                        {record.ownerAccountRemoved ? "Removed" : "Still exists"}
                      </span>
                    </div>
                  </div>
                  {record.ownerAccountRemoved ? (
                    <p className="shrink-0 text-sm text-white/45">
                      Email is available for a new registration.
                    </p>
                  ) : record.canRemoveOwner ? (
                    <button
                      type="button"
                      className="menu-btn-danger shrink-0"
                      disabled={actionLoading}
                      onClick={() => {
                        setRemoveOwnerTarget(record);
                        setRemoveOwnerConfirm("");
                      }}
                    >
                      Permanently Remove Owner Account
                    </button>
                  ) : (
                    <p className="shrink-0 text-sm text-white/45">
                      This owner still has other restaurants.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {loading ? (
          <TableSkeleton rows={6} />
        ) : ownerGroups.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-white/50">
              {search.trim() || status !== "all" || plan !== "all"
                ? "No restaurants match your filters."
                : "No restaurants registered yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-gold/15 bg-black/25">
              <table className="w-full min-w-[980px] text-left">
                <thead>
                  <tr className="border-b border-gold/10">
                    {["Owner", "Email", "Plan", "Restaurants", "Details"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((group) => {
                    const expanded = expandedIds.has(group.ownerId);
                    const ownerLabel =
                      group.ownerName?.trim() || "Unnamed owner";

                    return (
                      <Fragment key={group.ownerId}>
                        <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-4 py-3.5">
                            <button
                              type="button"
                              onClick={() => toggleExpanded(group.ownerId)}
                              aria-expanded={expanded}
                              className="flex max-w-xs items-start gap-2 text-start"
                            >
                              <span
                                className="mt-0.5 inline-block w-3 shrink-0 text-gold/80"
                                aria-hidden="true"
                              >
                                {expanded ? "▼" : "▶"}
                              </span>
                              <span className="font-medium text-white">
                                {ownerLabel}
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-white/60">
                            {group.email || "—"}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gold">
                            {group.plan}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-white/70">
                            {restaurantCountLabel(group.restaurantCount)}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-white/40">
                            {expanded
                              ? "Hide restaurants"
                              : "Show restaurants & actions"}
                          </td>
                        </tr>
                        {expanded ? (
                          <tr className="border-b border-white/5 bg-black/30">
                            <td colSpan={5} className="px-4 py-3">
                              <div className="mb-4 grid gap-3 rounded-xl border border-gold/15 bg-black/40 p-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-white/35">
                                    Owner
                                  </p>
                                  <p className="mt-1 text-sm text-white">
                                    {ownerLabel}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-white/35">
                                    Plan
                                  </p>
                                  <p className="mt-1 text-sm text-gold">
                                    {group.plan}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-white/35">
                                    Price
                                  </p>
                                  <p className="mt-1 text-sm text-white/80">
                                    {formatPlanPriceLabel(
                                      normalizePlanId(group.plan),
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-white/35">
                                    Subscription
                                  </p>
                                  <p className="mt-1 text-sm capitalize text-white/80">
                                    {group.subscriptionStatus ?? "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-white/35">
                                    Renewal
                                  </p>
                                  <p className="mt-1 text-sm text-white/80">
                                    {formatDemoDate(group.renewalDate)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-white/35">
                                    Covered
                                  </p>
                                  <p className="mt-1 text-sm text-white/80">
                                    {formatCoveredRestaurantUsage(
                                      group.plan,
                                      group.coveredCount,
                                      group.restaurantCount,
                                    )}
                                  </p>
                                </div>
                              </div>
                              <p className="mb-3 text-[11px] uppercase tracking-wider text-white/35">
                                Restaurants
                              </p>
                              <div className="overflow-x-auto rounded-xl border border-white/5">
                                <table className="w-full min-w-[1100px] text-left">
                                  <thead>
                                    <tr className="border-b border-white/5">
                                      {[
                                        "Restaurant Name",
                                        "Slug",
                                        "Coverage",
                                        "Status",
                                        "Created Date",
                                        "Renewal",
                                        "Active QR Codes",
                                        "Actions",
                                      ].map((heading) => (
                                        <th
                                          key={heading}
                                          className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/35"
                                        >
                                          {heading}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.restaurants.map((restaurant) => {
                                      const isOwn =
                                        Boolean(currentUserId) &&
                                        restaurant.ownerId === currentUserId;
                                      const displayName =
                                        restaurant.restaurantName?.trim() ||
                                        "Unnamed restaurant";
                                      return (
                                        <tr
                                          key={restaurant.id}
                                          className="border-b border-white/5 last:border-0"
                                        >
                                          <td className="px-3 py-3">
                                            <p className="font-medium text-white">
                                              {displayName}
                                            </p>
                                          </td>
                                          <td className="px-3 py-3 text-sm text-white/45">
                                            {restaurant.slug
                                              ? `/${restaurant.slug}`
                                              : "—"}
                                          </td>
                                          <td className="px-3 py-3">
                                            <CoverageBadge
                                              covered={restaurant.isCovered}
                                            />
                                            {!restaurant.isCovered ? (
                                              <p className="mt-1 text-[11px] text-white/35">
                                                Upgrade required
                                              </p>
                                            ) : null}
                                          </td>
                                          <td className="px-3 py-3">
                                            <StatusBadge
                                              status={restaurant.status}
                                            />
                                          </td>
                                          <td className="px-3 py-3 text-sm text-white/55">
                                            {formatDemoDate(restaurant.createdAt)}
                                          </td>
                                          <td className="px-3 py-3">
                                            <RenewalCell
                                              renewalDate={restaurant.renewalDate}
                                              historicalTrialEndsAt={
                                                restaurant.historicalTrialEndsAt
                                              }
                                            />
                                          </td>
                                          <td className="px-3 py-3 font-serif text-gold">
                                            {restaurant.activeQrCodes}
                                          </td>
                                          <td className="relative px-3 py-3">
                                            <button
                                              type="button"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                setMenuOpenId((current) =>
                                                  current === restaurant.id
                                                    ? null
                                                    : restaurant.id,
                                                );
                                              }}
                                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-black/30 text-gold hover:border-gold/40"
                                              aria-label={`Actions for ${displayName}`}
                                              aria-haspopup="menu"
                                              aria-expanded={
                                                menuOpenId === restaurant.id
                                              }
                                            >
                                              <span className="text-lg leading-none">
                                                ⋮
                                              </span>
                                            </button>
                                            {menuOpenId === restaurant.id ? (
                                              <div
                                                className="absolute end-3 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-gold/20 bg-[#111] py-1 shadow-2xl"
                                                role="menu"
                                                onClick={(event) =>
                                                  event.stopPropagation()
                                                }
                                              >
                                                {(
                                                  [
                                                    {
                                                      action: "view" as const,
                                                      label: "View",
                                                    },
                                                    {
                                                      action: "manage" as const,
                                                      label: "Manage",
                                                    },
                                                    {
                                                      action:
                                                        "impersonate" as const,
                                                      label: "Impersonate",
                                                    },
                                                    restaurant.isActive
                                                      ? {
                                                          action:
                                                            "suspend" as const,
                                                          label: "Suspend",
                                                        }
                                                      : {
                                                          action:
                                                            "activate" as const,
                                                          label: "Activate",
                                                        },
                                                    {
                                                      action: "archive" as const,
                                                      label: "Archive",
                                                    },
                                                    {
                                                      action: "delete" as const,
                                                      label:
                                                        "Delete Permanently",
                                                    },
                                                  ] as const
                                                ).map(({ action, label }) => (
                                                  <button
                                                    key={action}
                                                    type="button"
                                                    role="menuitem"
                                                    disabled={
                                                      action === "delete" &&
                                                      isOwn
                                                    }
                                                    onClick={() =>
                                                      handleMenuAction(
                                                        action,
                                                        restaurant,
                                                      )
                                                    }
                                                    className={`block w-full px-3 py-2.5 text-start text-sm transition-colors ${
                                                      action === "delete"
                                                        ? "text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                                                        : "text-white/75 hover:bg-gold/10 hover:text-gold"
                                                    }`}
                                                  >
                                                    {label}
                                                  </button>
                                                ))}
                                              </div>
                                            ) : null}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
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
              totalItems={ownerGroups.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {viewTarget ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setViewTarget(null)}
          />
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-s border-gold/20 bg-[#0d0d0d] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gold">
                  Restaurant
                </p>
                <h2 className="mt-2 font-serif text-2xl font-bold text-white">
                  {viewTarget.restaurantName || "Unnamed restaurant"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
              >
                ✕
              </button>
            </div>
            <dl className="mt-8 space-y-4 text-sm">
              {[
                ["Owner", viewTarget.ownerName || "—"],
                ["Email", viewTarget.email || "—"],
                ["Phone", viewTarget.phone || "—"],
                ["Plan", viewTarget.ownerPlan || viewTarget.plan],
                [
                  "Coverage",
                  viewTarget.isCovered ? "Covered" : "Not covered",
                ],
                ["Status", STATUS_LABELS[viewTarget.status]],
                ["Created", formatDemoDate(viewTarget.createdAt)],
                ["Renewal", formatDemoDate(viewTarget.renewalDate)],
                [
                  "Historical trial",
                  formatDemoDate(viewTarget.historicalTrialEndsAt),
                ],
                ["Active QR Codes", String(viewTarget.activeQrCodes)],
                ["City", viewTarget.city || "—"],
                ["Slug", viewTarget.slug ? `/${viewTarget.slug}` : "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/5 bg-black/30 px-4 py-3"
                >
                  <dt className="text-[11px] uppercase tracking-wider text-white/40">
                    {label}
                  </dt>
                  <dd className="mt-1 text-white/85">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-auto flex gap-3 pt-6">
              <button
                type="button"
                className="menu-btn-secondary flex-1"
                onClick={() => {
                  setManageTarget(viewTarget);
                  setViewTarget(null);
                }}
              >
                Manage
              </button>
              {viewTarget.slug ? (
                <Link
                  href={`/menu/${viewTarget.slug}`}
                  target="_blank"
                  className="menu-btn-primary flex-1 text-center"
                >
                  Open Menu
                </Link>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      {manageTarget ? (
        <ManageRestaurantDrawer
          restaurant={manageTarget}
          currentUserId={currentUserId}
          onClose={() => setManageTarget(null)}
          onChanged={loadRestaurants}
          onRequestAction={(action, restaurant) => {
            if (action === "delete") {
              beginDelete(restaurant);
              return;
            }
            setPendingAction({ type: action, restaurant });
          }}
          onImpersonateContinue={() => {
            setManageTarget(null);
            router.push("/dashboard");
          }}
        />
      ) : null}

      {removeOwnerTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            aria-label="Close"
            onClick={() =>
              !actionLoading
                ? (setRemoveOwnerTarget(null), setRemoveOwnerConfirm(""))
                : undefined
            }
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-red-500/25 bg-[#0d0d0d] p-6 shadow-2xl sm:p-8">
            <h2 className="text-center font-serif text-xl font-bold text-white">
              Permanently Remove Owner Account
            </h2>
            <div className="mt-5 grid gap-2 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
              <p className="flex justify-between gap-3">
                <span className="text-white/45">Restaurant</span>
                <span className="text-white">
                  {removeOwnerTarget.restaurantName || "—"}
                </span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-white/45">Owner</span>
                <span className="text-white">
                  {removeOwnerTarget.ownerName || "—"}
                </span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-white/45">Email</span>
                <span className="text-white">
                  {removeOwnerTarget.email || "—"}
                </span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-white/45">Restaurant</span>
                <span className="text-white/70">Deleted</span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-white/45">Owner Account</span>
                <span className="text-amber-200">Still exists</span>
              </p>
            </div>
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
              <p className="font-medium text-red-200">This action is permanent.</p>
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-red-200/75">
                <li>The owner will no longer be able to log in.</li>
                <li>
                  Their authentication account will be removed from Supabase.
                </li>
                <li>
                  This email will become available for a completely new
                  registration.
                </li>
              </ul>
              <p className="mt-3 font-medium text-red-100">
                This cannot be undone.
              </p>
            </div>
            <label className="mt-5 block text-sm">
              <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/40">
                Type the confirmation phrase
              </span>
              <input
                value={removeOwnerConfirm}
                onChange={(event) => setRemoveOwnerConfirm(event.target.value)}
                placeholder={REMOVE_OWNER_CONFIRM_PHRASE}
                className="w-full rounded-xl border border-red-500/20 bg-black/40 px-3 py-2.5 text-white placeholder:text-white/25 focus:border-red-400/40 focus:outline-none"
              />
            </label>
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                className="menu-btn-secondary flex-1"
                disabled={actionLoading}
                onClick={() => {
                  setRemoveOwnerTarget(null);
                  setRemoveOwnerConfirm("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="menu-btn-danger flex-1 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={
                  actionLoading ||
                  removeOwnerConfirm.trim() !== REMOVE_OWNER_CONFIRM_PHRASE
                }
                onClick={() => void handleRemoveOwnerAccount()}
              >
                {actionLoading
                  ? "Removing…"
                  : "Yes, permanently remove account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            aria-label="Close"
            onClick={() =>
              !actionLoading
                ? (setDeleteTarget(null), setDeleteConfirmName(""))
                : undefined
            }
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-red-500/25 bg-[#0d0d0d] p-6 shadow-2xl sm:p-8">
            <h2 className="text-center font-serif text-xl font-bold text-white">
              Delete Permanently
            </h2>
            <div className="mt-5 grid gap-2 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
              <p className="flex justify-between gap-3">
                <span className="text-white/45">Restaurant Name</span>
                <span className="text-white">
                  {deleteTarget.restaurantName || "—"}
                </span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-white/45">Owner</span>
                <span className="text-white">
                  {deleteTarget.ownerName || "—"}
                </span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-white/45">Current Plan</span>
                <span className="text-gold">{deleteTarget.ownerPlan || deleteTarget.plan}</span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-white/45">Created</span>
                <span className="text-white">
                  {formatDemoDate(deleteTarget.createdAt)}
                </span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-white/45">Renewal</span>
                <span className="text-white">
                  {formatDemoDate(deleteTarget.renewalDate)}
                </span>
              </p>
            </div>
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
              <p className="font-medium text-red-200">
                This action permanently deletes:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-red-200/75">
                <li>Restaurant</li>
                <li>Categories</li>
                <li>Menu Items</li>
                <li>QR Codes</li>
                <li>Reservations</li>
                <li>Orders</li>
                <li>Subscriptions</li>
                <li>Analytics</li>
                <li>Invoices</li>
              </ul>
              <p className="mt-3 font-medium text-red-100">
                This cannot be undone.
              </p>
            </div>
            <label className="mt-5 block text-sm">
              <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/40">
                Type the restaurant name to confirm
              </span>
              <input
                value={deleteConfirmName}
                onChange={(event) => setDeleteConfirmName(event.target.value)}
                placeholder={deleteTarget.restaurantName ?? ""}
                className="w-full rounded-xl border border-red-500/20 bg-black/40 px-3 py-2.5 text-white placeholder:text-white/25 focus:border-red-400/40 focus:outline-none"
              />
            </label>
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                className="menu-btn-secondary flex-1"
                disabled={actionLoading}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteConfirmName("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="menu-btn-danger flex-1 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={actionLoading}
                onClick={() => void handleDeletePermanently()}
              >
                {actionLoading ? "Deleting…" : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(pendingAction)}
        title={
          pendingAction?.type === "activate"
            ? "Activate Restaurant"
            : pendingAction?.type === "suspend"
              ? "Suspend Restaurant"
              : "Archive Restaurant"
        }
        description={
          pendingAction
            ? pendingAction.type === "activate"
              ? `Activate ${pendingAction.restaurant.restaurantName || "this restaurant"} and restore platform access?`
              : pendingAction.type === "suspend"
                ? `Suspend ${pendingAction.restaurant.restaurantName || "this restaurant"}? Owners will lose dashboard access until reactivated.`
                : `Archive ${pendingAction.restaurant.restaurantName || "this restaurant"}? It will be soft-hidden from active management lists.`
            : null
        }
        confirmLabel={
          pendingAction?.type === "activate"
            ? "Activate"
            : pendingAction?.type === "suspend"
              ? "Suspend"
              : "Archive"
        }
        variant={pendingAction?.type === "activate" ? "default" : "danger"}
        loading={actionLoading}
        onConfirm={() => void handleConfirmPending()}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmModal
        open={Boolean(impersonateTarget)}
        title={`Login as ${impersonateTarget?.restaurantName?.trim() || "Restaurant"}?`}
        description="You will temporarily access this restaurant's dashboard. All actions are logged."
        confirmLabel="Continue"
        cancelLabel="Cancel"
        loading={actionLoading}
        onConfirm={() => {
          if (impersonateTarget) void runImpersonation(impersonateTarget);
        }}
        onCancel={() => setImpersonateTarget(null)}
      />
    </AdminPlaceholder>
  );
}
