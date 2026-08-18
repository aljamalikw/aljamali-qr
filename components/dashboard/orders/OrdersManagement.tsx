"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchOrderAnalytics } from "@/lib/order-analytics/queries";
import type { OrderAnalyticsData, OrderAnalyticsRange } from "@/lib/order-analytics/types";
import { fetchOrders } from "@/lib/orders/fetchOrders";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/orders/types";
import { ORDER_STATUSES, ORDER_TYPES } from "@/lib/orders/types";
import { updateOrderStatus, updatePaymentStatus } from "@/lib/orders/updateOrderStatus";
import {
  DEFAULT_ORDERS_PAGE_SIZE,
  type OrderStatusFilter,
  type OrderTypeFilter,
  computeOrderKpis,
  exportOrdersToCsv,
  filterOrders,
  getLiveOrders,
  getNextOrderStatus,
  getTodayOrders,
  paginate,
  partitionSelectedForBulkAccept,
  partitionSelectedForBulkCancel,
} from "@/lib/orders/utils";
import { OnlineOrderingFeatureGate } from "@/components/dashboard/OnlineOrderingFeatureGate";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { supabase } from "@/lib/supabase";
import { csvTimestamp, downloadCsv } from "@/lib/utils/csv";
import { OrderAnalyticsSection } from "./OrderAnalyticsSection";
import { OrderBulkActionsBar } from "./OrderBulkActionsBar";
import { OrderDetailsDrawer } from "./OrderDetailsDrawer";
import { OrderKpiCards } from "./OrderKpiCards";
import { OrderTable } from "./OrderTable";

type OrdersTab = "today" | "live" | "history";
type BulkConfirmAction = "accept" | "cancel";

const TABS: { id: OrdersTab; label: string }[] = [
  { id: "today", label: "Today's Orders" },
  { id: "live", label: "Live Orders" },
  { id: "history", label: "History" },
];

/** Public entry — Starter sees upgrade card; Pro/Enterprise see orders UI. */
export function OrdersManagement() {
  return (
    <OnlineOrderingFeatureGate>
      <OrdersManagementContent />
    </OnlineOrderingFeatureGate>
  );
}

function OrdersManagementContent() {
  const { showToast } = useToast();
  const { restaurant, loading: restaurantLoading } = useRestaurant();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<OrdersTab>("today");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatusFilter>("all");
  const [orderType, setOrderType] = useState<OrderTypeFilter>("all");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Order | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [bulkConfirm, setBulkConfirm] = useState<BulkConfirmAction | null>(
    null,
  );
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSnapshot, setBulkSnapshot] = useState<{
    action: BulkConfirmAction;
    eligible: Order[];
    ineligibleCount: number;
    selectedCount: number;
  } | null>(null);

  const [analytics, setAnalytics] = useState<OrderAnalyticsData | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState<OrderAnalyticsRange>("month");
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!restaurant?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await fetchOrders(restaurant.id);
    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      setOrders([]);
      return;
    }
    setOrders(result.data);
  }, [restaurant?.id]);

  const loadAnalytics = useCallback(async () => {
    if (!restaurant?.id) {
      setAnalyticsLoading(false);
      return;
    }
    setAnalyticsLoading(true);
    const result = await fetchOrderAnalytics(restaurant.id, analyticsRange);
    setAnalyticsLoading(false);
    if (result.ok) setAnalytics(result.data);
  }, [restaurant?.id, analyticsRange]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setSelected(null);
    setConfirmCancel(null);
    setSelectedOrderIds(new Set());
    setBulkConfirm(null);
  }, [restaurant?.id]);

  useEffect(() => {
    setSelectedOrderIds(new Set());
    setBulkConfirm(null);
  }, [tab]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    if (!restaurant?.id) return;

    const channel = supabase
      .channel(`orders-dashboard-${restaurant.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        () => {
          void loadOrders();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [restaurant?.id, loadOrders]);

  useEffect(() => {
    setPage(1);
  }, [search, status, orderType, tab]);

  const replaceOrder = useCallback((updated: Order) => {
    setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)));
    setSelected((current) => (current?.id === updated.id ? updated : current));
  }, []);

  const todayOrders = useMemo(() => getTodayOrders(orders), [orders]);
  const liveOrders = useMemo(() => getLiveOrders(orders), [orders]);
  const kpis = useMemo(() => computeOrderKpis(orders), [orders]);
  const todayKpis = useMemo(() => computeOrderKpis(todayOrders), [todayOrders]);

  const baseList = tab === "today" ? todayOrders : tab === "live" ? liveOrders : orders;

  const filtered = useMemo(
    () => filterOrders(baseList, { search, status, orderType }),
    [baseList, search, status, orderType],
  );

  const { items: pageItems, totalPages, page: safePage } = useMemo(
    () => paginate(filtered, page, DEFAULT_ORDERS_PAGE_SIZE),
    [filtered, page],
  );

  const hasFilters = search.trim().length > 0 || status !== "all" || orderType !== "all";

  const selectedCount = selectedOrderIds.size;

  const allVisibleSelected =
    pageItems.length > 0 && pageItems.every((order) => selectedOrderIds.has(order.id));

  const someVisibleSelected = pageItems.some((order) =>
    selectedOrderIds.has(order.id),
  );

  const toggleSelectOrder = useCallback((orderId: string, checked: boolean) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(orderId);
      else next.delete(orderId);
      return next;
    });
  }, []);

  const toggleSelectAllVisible = useCallback(
    (checked: boolean) => {
      setSelectedOrderIds((prev) => {
        const next = new Set(prev);
        for (const order of pageItems) {
          if (checked) next.add(order.id);
          else next.delete(order.id);
        }
        return next;
      });
    },
    [pageItems],
  );

  const clearSelection = useCallback(() => {
    setSelectedOrderIds(new Set());
    setBulkConfirm(null);
  }, []);

  const bulkAcceptPartition = useMemo(
    () => partitionSelectedForBulkAccept(orders, selectedOrderIds),
    [orders, selectedOrderIds],
  );

  const bulkCancelPartition = useMemo(
    () => partitionSelectedForBulkCancel(orders, selectedOrderIds),
    [orders, selectedOrderIds],
  );

  const executeBulkStatusUpdate = useCallback(
    async (
      targetStatus: OrderStatus,
      eligible: Order[],
      ineligibleCount: number,
    ) => {
      setBulkLoading(true);
      const successes: Order[] = [];
      const failures: Array<{ orderNumber: string; message: string }> = [];

      for (const order of eligible) {
        const result = await updateOrderStatus(order.id, targetStatus);
        if (result.ok) {
          successes.push(result.data);
          replaceOrder(result.data);
        } else {
          failures.push({
            orderNumber: order.orderNumber,
            message: result.message,
          });
        }
      }

      setBulkLoading(false);
      setBulkConfirm(null);
      setBulkSnapshot(null);
      clearSelection();
      void loadOrders();

      const actionLabel = targetStatus === "Accepted" ? "accepted" : "cancelled";
      const skippedMessage =
        ineligibleCount > 0
          ? ` ${ineligibleCount} ${ineligibleCount === 1 ? "order was" : "orders were"} skipped because ${ineligibleCount === 1 ? "it is" : "they are"} not eligible for ${targetStatus === "Accepted" ? "acceptance" : "cancellation"}.`
          : "";
      if (successes.length > 0 && failures.length === 0) {
        showToast(
          `${successes.length} ${successes.length === 1 ? "order" : "orders"} ${actionLabel} successfully.${skippedMessage}`,
        );
        return;
      }
      if (successes.length > 0 && failures.length > 0) {
        const failedNumbers = failures.map((f) => f.orderNumber).join(", ");
        showToast(
          `${successes.length} ${successes.length === 1 ? "order" : "orders"} ${actionLabel} successfully.${skippedMessage} ${failures.length} ${failures.length === 1 ? "order could" : "orders could"} not be ${targetStatus === "Accepted" ? "accepted" : "cancelled"} (${failedNumbers}).`,
          "error",
        );
        return;
      }
      const failedNumbers = failures.map((f) => f.orderNumber).join(", ");
      showToast(
        failures.length === 1
          ? `Order ${failedNumbers} could not be ${targetStatus === "Accepted" ? "accepted" : "cancelled"}.${skippedMessage}`
          : `No eligible orders were updated. Failed: ${failedNumbers}.${skippedMessage}`,
        "error",
      );
    },
    [clearSelection, loadOrders, replaceOrder, showToast],
  );

  const openBulkAcceptConfirm = useCallback(() => {
    const { eligible, ineligible } = bulkAcceptPartition;
    if (eligible.length === 0) {
      showToast(
        ineligible.length === 1
          ? "The selected order cannot be accepted."
          : "None of the selected orders can be accepted.",
        "error",
      );
      return;
    }
    setBulkSnapshot({
      action: "accept",
      eligible: [...eligible],
      ineligibleCount: ineligible.length,
      selectedCount,
    });
    setBulkConfirm("accept");
  }, [bulkAcceptPartition, selectedCount, showToast]);

  const openBulkCancelConfirm = useCallback(() => {
    const { eligible, ineligible } = bulkCancelPartition;
    if (eligible.length === 0) {
      showToast(
        ineligible.length === 1
          ? "The selected order cannot be cancelled."
          : "None of the selected orders can be cancelled.",
        "error",
      );
      return;
    }
    setBulkSnapshot({
      action: "cancel",
      eligible: [...eligible],
      ineligibleCount: ineligible.length,
      selectedCount,
    });
    setBulkConfirm("cancel");
  }, [bulkCancelPartition, selectedCount, showToast]);

  const handleConfirmBulkAction = useCallback(async () => {
    if (!bulkSnapshot) return;
    const { action, eligible, ineligibleCount } = bulkSnapshot;
    const targetStatus: OrderStatus = action === "accept" ? "Accepted" : "Cancelled";
    await executeBulkStatusUpdate(targetStatus, eligible, ineligibleCount);
  }, [bulkSnapshot, executeBulkStatusUpdate]);

  const bulkConfirmCopy = useMemo(() => {
    if (!bulkSnapshot || bulkConfirm === null) return null;
    const { action, eligible, ineligibleCount, selectedCount: snapTotal } = bulkSnapshot;
    const eligibleCount = eligible.length;

    if (action === "accept") {
      const main =
        ineligibleCount > 0
          ? `${eligibleCount} of ${snapTotal} selected ${snapTotal === 1 ? "order can" : "orders can"} be accepted.`
          : `Accept ${eligibleCount} selected ${eligibleCount === 1 ? "order" : "orders"}?`;
      const note =
        ineligibleCount > 0
          ? `${ineligibleCount} selected ${ineligibleCount === 1 ? "order cannot" : "orders cannot"} be accepted because of ${ineligibleCount === 1 ? "its" : "their"} current status.`
          : null;
      return {
        title: "Accept Orders",
        description: note ? (
          <>
            {main}
            <br />
            <span className="mt-2 block text-white/65">{note}</span>
          </>
        ) : (
          main
        ),
        confirmLabel: `Accept ${eligibleCount} ${eligibleCount === 1 ? "Order" : "Orders"}`,
        loadingConfirmLabel: `Accepting ${eligibleCount} ${eligibleCount === 1 ? "Order" : "Orders"}...`,
        cancelLabel: "Cancel",
        variant: "default" as const,
      };
    }

    const main =
      ineligibleCount > 0
        ? `${eligibleCount} of ${snapTotal} selected ${snapTotal === 1 ? "order can" : "orders can"} be cancelled.`
        : `Cancel ${eligibleCount} selected ${eligibleCount === 1 ? "order" : "orders"}?`;
    const note =
      ineligibleCount > 0
        ? `${ineligibleCount} selected ${ineligibleCount === 1 ? "order cannot" : "orders cannot"} be cancelled because of ${ineligibleCount === 1 ? "its" : "their"} current status.`
        : null;
    return {
      title: "Cancel Orders",
      description: note ? (
        <>
          {main}
          <br />
          <span className="mt-2 block text-white/65">{note}</span>
        </>
      ) : (
        main
      ),
      confirmLabel: `Cancel ${eligibleCount} ${eligibleCount === 1 ? "Order" : "Orders"}`,
      loadingConfirmLabel: `Cancelling ${eligibleCount} ${eligibleCount === 1 ? "Order" : "Orders"}...`,
      cancelLabel: "Keep Orders",
      variant: "danger" as const,
    };
  }, [bulkConfirm, bulkSnapshot]);

  const handleAdvanceStatus = useCallback(
    async (order: Order) => {
      const nextStatus = getNextOrderStatus(order.status);
      if (!nextStatus) return;
      setActionLoading(true);
      const result = await updateOrderStatus(order.id, nextStatus);
      setActionLoading(false);

      if (!result.ok) {
        showToast(result.message, "error");
        return;
      }
      replaceOrder(result.data);
      showToast(`Order ${order.orderNumber} marked ${nextStatus}`);
    },
    [replaceOrder, showToast],
  );

  const handleCancelOrder = useCallback(
    async (order: Order) => {
      setActionLoading(true);
      const result = await updateOrderStatus(order.id, "Cancelled" as OrderStatus);
      setActionLoading(false);

      if (!result.ok) {
        showToast(result.message, "error");
        return;
      }
      replaceOrder(result.data);
      showToast(`Order ${order.orderNumber} cancelled`);
      setConfirmCancel(null);
      setSelected(null);
    },
    [replaceOrder, showToast],
  );

  const handlePaymentStatusChange = useCallback(
    async (order: Order, paymentStatus: PaymentStatus) => {
      const result = await updatePaymentStatus(order.id, paymentStatus);
      if (!result.ok) {
        showToast(result.message, "error");
        return;
      }
      replaceOrder(result.data);
      showToast(`Payment marked ${paymentStatus}`);
    },
    [replaceOrder, showToast],
  );

  const handleExport = useCallback(() => {
    if (filtered.length === 0) {
      showToast("No rows available to export", "error");
      return;
    }
    const csv = exportOrdersToCsv(filtered);
    downloadCsv(`orders-${csvTimestamp()}.csv`, csv);
    showToast(`Exported ${filtered.length} orders`);
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
        <p className="text-sm text-white/50">Complete restaurant onboarding to manage orders.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-white/45">
            Manage online orders submitted from your public menu.
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
        <OrderKpiCards
          currency={restaurant.currency}
          todayOrders={todayKpis.totalOrders}
          todayRevenue={todayKpis.totalRevenue}
          liveOrders={liveOrders.length}
          totalRevenue={kpis.totalRevenue}
        />
      )}

      {error ? (
        <div className="dashboard-card rounded-2xl p-8 text-center">
          <p className="text-sm text-white/50">{error}</p>
          <button type="button" onClick={() => void loadOrders()} className="menu-btn-primary mt-4">
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 rounded-xl border border-gold/10 bg-surface p-1.5">
            {TABS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setTab(option.id)}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                  tab === option.id ? "bg-gold text-black" : "text-white/60 hover:text-white"
                }`}
              >
                {option.label}
                {option.id === "live" && liveOrders.length > 0 && (
                  <span className="ms-1.5 rounded-full bg-black/20 px-1.5 py-0.5 text-[10px]">
                    {liveOrders.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order #, customer, phone, or table…"
                aria-label="Search orders"
                className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatusFilter)}
                aria-label="Filter by status"
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-gold/30 focus:outline-none"
              >
                <option value="all">All statuses</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as OrderTypeFilter)}
                aria-label="Filter by type"
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-gold/30 focus:outline-none"
              >
                <option value="all">All types</option>
                {ORDER_TYPES.map((typeOption) => (
                  <option key={typeOption} value={typeOption}>
                    {typeOption}
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
                    ? "No orders match your filters."
                    : "No orders yet. Share your menu link to start receiving orders."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <OrderBulkActionsBar
                  selectedCount={selectedCount}
                  bulkLoading={bulkLoading}
                  onAcceptSelected={openBulkAcceptConfirm}
                  onCancelSelected={openBulkCancelConfirm}
                  onClearSelection={clearSelection}
                />
                <div className="dashboard-card overflow-hidden rounded-2xl">
                  <OrderTable
                    items={pageItems}
                    selectedIds={selectedOrderIds}
                    onToggleSelect={toggleSelectOrder}
                    onToggleSelectAllVisible={toggleSelectAllVisible}
                    allVisibleSelected={allVisibleSelected}
                    someVisibleSelected={someVisibleSelected}
                    onRowClick={setSelected}
                    onAdvanceStatus={(order) => void handleAdvanceStatus(order)}
                  />
                <div className="border-t border-white/5 px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-white/45">
                      Showing {(safePage - 1) * DEFAULT_ORDERS_PAGE_SIZE + 1}–
                      {Math.min(safePage * DEFAULT_ORDERS_PAGE_SIZE, filtered.length)} of{" "}
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
            </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-white">Order Analytics</h2>
            <div className="flex rounded-xl border border-gold/15 bg-surface p-1">
              {(["week", "month", "quarter", "year"] as OrderAnalyticsRange[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAnalyticsRange(option)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors duration-200 ${
                    analyticsRange === option ? "bg-gold text-black" : "text-white/60 hover:text-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {analyticsLoading ? (
            <TableSkeleton rows={4} />
          ) : analytics ? (
            <OrderAnalyticsSection data={analytics} currency={restaurant.currency} />
          ) : (
            <div className="dashboard-card rounded-2xl p-8 text-center">
              <p className="text-sm text-white/50">Analytics data is not available yet.</p>
            </div>
          )}
        </>
      )}

      <OrderDetailsDrawer
        order={selected}
        restaurant={restaurant}
        onClose={() => setSelected(null)}
        onAdvanceStatus={(order) => void handleAdvanceStatus(order)}
        onCancel={(order) => setConfirmCancel(order)}
        onPaymentStatusChange={(order, paymentStatus) =>
          void handlePaymentStatusChange(order, paymentStatus)
        }
        onCopyFeedbackLink={(order) => {
          void navigator.clipboard.writeText(
            `${window.location.origin}/review/${order.id}`,
          );
          showToast("Feedback link copied");
        }}
      />

      <ConfirmModal
        open={confirmCancel !== null}
        title="Cancel Order?"
        description={
          confirmCancel
            ? `Cancel order "${confirmCancel.orderNumber}" for ${confirmCancel.customerName}? This cannot be undone.`
            : ""
        }
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        variant="danger"
        loading={actionLoading}
        onConfirm={() => confirmCancel && void handleCancelOrder(confirmCancel)}
        onCancel={() => setConfirmCancel(null)}
      />

      <ConfirmModal
        open={bulkConfirm !== null}
        title={bulkConfirmCopy?.title ?? "Confirm bulk action"}
        description={bulkConfirmCopy?.description ?? ""}
        confirmLabel={bulkConfirmCopy?.confirmLabel ?? "Confirm"}
        loadingConfirmLabel={bulkConfirmCopy?.loadingConfirmLabel}
        cancelLabel={bulkConfirmCopy?.cancelLabel ?? "Cancel"}
        variant={bulkConfirmCopy?.variant ?? "default"}
        loading={bulkLoading}
        onConfirm={() => void handleConfirmBulkAction()}
        onCancel={() => {
          setBulkConfirm(null);
          setBulkSnapshot(null);
        }}
      />
    </div>
  );
}
