import { buildCsv } from "@/lib/utils/csv";
import type { Order, OrderStatus, OrderType, PaymentStatus } from "./types";

export const DEFAULT_ORDERS_PAGE_SIZE = 10;

export type OrderStatusFilter = OrderStatus | "all";
export type OrderTypeFilter = OrderType | "all";
export type PaymentStatusFilter = PaymentStatus | "all";

export type OrderFilters = {
  status?: OrderStatusFilter;
  orderType?: OrderTypeFilter;
  paymentStatus?: PaymentStatusFilter;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

export const LIVE_ORDER_STATUSES: OrderStatus[] = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  Pending: "Pending",
  Accepted: "Accepted",
  Preparing: "Preparing",
  Ready: "Ready",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

export function getOrderStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status] ?? status;
}

const STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  Pending: "border border-amber-500/30 bg-amber-500/10 text-amber-300",
  Accepted: "border border-sky-500/30 bg-sky-500/10 text-sky-300",
  Preparing: "border border-blue-500/30 bg-blue-500/10 text-blue-300",
  Ready: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  Completed: "border border-white/15 bg-white/5 text-white/60",
  Cancelled: "border border-red-500/30 bg-red-500/10 text-red-300",
};

export function getOrderStatusBadgeClass(status: OrderStatus): string {
  return STATUS_BADGE_CLASSES[status] ?? STATUS_BADGE_CLASSES.Pending;
}

const PAYMENT_BADGE_CLASSES: Record<PaymentStatus, string> = {
  Unpaid: "border border-amber-500/30 bg-amber-500/10 text-amber-300",
  Paid: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  Refunded: "border border-white/15 bg-white/5 text-white/60",
  Failed: "border border-red-500/30 bg-red-500/10 text-red-300",
};

export function getPaymentStatusBadgeClass(status: PaymentStatus): string {
  return PAYMENT_BADGE_CLASSES[status] ?? PAYMENT_BADGE_CLASSES.Unpaid;
}

const NEXT_STATUS_FLOW: Partial<Record<OrderStatus, OrderStatus>> = {
  Pending: "Accepted",
  Accepted: "Preparing",
  Preparing: "Ready",
  Ready: "Completed",
};

const NEXT_STATUS_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  Pending: "Accept",
  Accepted: "Start Preparing",
  Preparing: "Mark Ready",
  Ready: "Complete",
};

export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  return NEXT_STATUS_FLOW[status] ?? null;
}

export function getNextOrderStatusActionLabel(status: OrderStatus): string | null {
  return NEXT_STATUS_ACTION_LABEL[status] ?? null;
}

export function canCancelOrder(status: OrderStatus): boolean {
  return status === "Pending" || status === "Accepted" || status === "Preparing";
}

/** Bulk Accept maps to Pending → Accepted only. */
export function canBulkAcceptOrder(status: OrderStatus): boolean {
  return getNextOrderStatus(status) === "Accepted";
}

/** Bulk Cancel reuses the same rules as individual cancellation. */
export function canBulkCancelOrder(status: OrderStatus): boolean {
  return canCancelOrder(status);
}

export type BulkOrderAction = "accept" | "cancel";

export type BulkOrderActionPlan = {
  action: BulkOrderAction;
  selectedOrders: Order[];
  eligibleOrders: Order[];
  ineligibleOrders: Order[];
  selectedCount: number;
  eligibleCount: number;
  ineligibleCount: number;
};

export function buildBulkOrderActionPlan(
  orders: Order[],
  selectedIds: ReadonlySet<string>,
  action: BulkOrderAction,
): BulkOrderActionPlan {
  const selectedOrders = orders.filter((order) => selectedIds.has(order.id));
  const isEligible =
    action === "accept"
      ? (order: Order) => canBulkAcceptOrder(order.status)
      : (order: Order) => canBulkCancelOrder(order.status);
  const eligibleOrders = selectedOrders.filter(isEligible);
  const ineligibleOrders = selectedOrders.filter((order) => !isEligible(order));

  return {
    action,
    selectedOrders,
    eligibleOrders,
    ineligibleOrders,
    selectedCount: selectedOrders.length,
    eligibleCount: eligibleOrders.length,
    ineligibleCount: ineligibleOrders.length,
  };
}

export function partitionSelectedForBulkAccept(
  orders: Order[],
  selectedIds: ReadonlySet<string>,
): { eligible: Order[]; ineligible: Order[] } {
  const selected = orders.filter((order) => selectedIds.has(order.id));
  return {
    eligible: selected.filter((order) => canBulkAcceptOrder(order.status)),
    ineligible: selected.filter((order) => !canBulkAcceptOrder(order.status)),
  };
}

export function partitionSelectedForBulkCancel(
  orders: Order[],
  selectedIds: ReadonlySet<string>,
): { eligible: Order[]; ineligible: Order[] } {
  const selected = orders.filter((order) => selectedIds.has(order.id));
  return {
    eligible: selected.filter((order) => canBulkCancelOrder(order.status)),
    ineligible: selected.filter((order) => !canBulkCancelOrder(order.status)),
  };
}

function matchesSearch(order: Order, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    order.orderNumber.toLowerCase().includes(q) ||
    (order.customerName ?? "").toLowerCase().includes(q) ||
    (order.customerPhone ?? "").toLowerCase().includes(q) ||
    (order.tableNumber ?? "").toLowerCase().includes(q)
  );
}

export function filterOrders(orders: Order[], filters: OrderFilters): Order[] {
  return orders.filter((order) => {
    if (filters.status && filters.status !== "all" && order.status !== filters.status) {
      return false;
    }
    if (filters.orderType && filters.orderType !== "all" && order.orderType !== filters.orderType) {
      return false;
    }
    if (
      filters.paymentStatus &&
      filters.paymentStatus !== "all" &&
      order.paymentStatus !== filters.paymentStatus
    ) {
      return false;
    }
    if (filters.search && !matchesSearch(order, filters.search)) {
      return false;
    }
    if (filters.dateFrom && new Date(order.createdAt) < new Date(filters.dateFrom)) {
      return false;
    }
    if (filters.dateTo && new Date(order.createdAt) > new Date(filters.dateTo)) {
      return false;
    }
    return true;
  });
}

export function isSameDay(isoDate: string, reference: Date = new Date()): boolean {
  const date = new Date(isoDate);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

export function getTodayOrders(orders: Order[]): Order[] {
  const today = new Date();
  return orders.filter((order) => isSameDay(order.createdAt, today));
}

export function getLiveOrders(orders: Order[]): Order[] {
  return orders.filter((order) => LIVE_ORDER_STATUSES.includes(order.status));
}

export type PaginationResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number = DEFAULT_ORDERS_PAGE_SIZE,
): PaginationResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export type OrderKpis = {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  pendingCount: number;
  acceptedCount: number;
  preparingCount: number;
  readyCount: number;
  completedCount: number;
  cancelledCount: number;
};

export function computeOrderKpis(orders: Order[]): OrderKpis {
  const completedOrCounted = orders.filter((order) => order.status !== "Cancelled");
  const totalRevenue = completedOrCounted.reduce((sum, order) => sum + order.grandTotal, 0);

  return {
    totalOrders: orders.length,
    totalRevenue,
    avgOrderValue: completedOrCounted.length > 0 ? totalRevenue / completedOrCounted.length : 0,
    pendingCount: orders.filter((o) => o.status === "Pending").length,
    acceptedCount: orders.filter((o) => o.status === "Accepted").length,
    preparingCount: orders.filter((o) => o.status === "Preparing").length,
    readyCount: orders.filter((o) => o.status === "Ready").length,
    completedCount: orders.filter((o) => o.status === "Completed").length,
    cancelledCount: orders.filter((o) => o.status === "Cancelled").length,
  };
}

export function exportOrdersToCsv(orders: Order[]): string {
  const headers = [
    "Order Number",
    "Type",
    "Status",
    "Payment Status",
    "Customer",
    "Phone",
    "Table",
    "Items",
    "Subtotal",
    "Tax",
    "Discount",
    "Grand Total",
    "Currency",
    "Created At",
  ];

  const rows = orders.map((order) => [
    order.orderNumber,
    order.orderType,
    order.status,
    order.paymentStatus,
    order.customerName ?? "",
    order.customerPhone ?? "",
    order.tableNumber ?? "",
    String(order.items.reduce((sum, item) => sum + item.quantity, 0)),
    order.subtotal.toFixed(3),
    order.taxAmount.toFixed(3),
    order.discountAmount.toFixed(3),
    order.grandTotal.toFixed(3),
    order.currency,
    new Date(order.createdAt).toISOString(),
  ]);

  return buildCsv(headers, rows);
}

export function formatTimeAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getElapsedLabel(iso: string, nowMs: number = Date.now()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "0m";
  const diffMs = Math.max(0, nowMs - date.getTime());
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  const seconds = Math.floor((diffMs % 60000) / 1000);
  if (totalMinutes === 0) return `${seconds}s`;
  return `${minutes}m`;
}

export function isMissingTableError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /relation .* does not exist|could not find the table/i.test(error.message ?? "");
}
