import { mapOrderRow } from "@/lib/orders/mappers";
import type { Order, OrderRecord, OrderStatus, OrderType } from "@/lib/orders/types";
import { ORDER_STATUSES, ORDER_TYPES } from "@/lib/orders/types";
import { isMissingTableError } from "@/lib/orders/utils";
import { supabase } from "@/lib/supabase";
import type {
  DailyOrderPoint,
  OrderAnalyticsData,
  OrderAnalyticsRange,
  OrderPeakHourPoint,
  TopSellingItem,
} from "./types";

const QUERY_ERROR = "Unable to load order analytics. Please try again.";

const RANGE_DAYS: Record<OrderAnalyticsRange, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

function emptyAnalyticsData(): OrderAnalyticsData {
  const ordersByStatus = Object.fromEntries(
    ORDER_STATUSES.map((status) => [status, 0]),
  ) as Record<OrderStatus, number>;
  const ordersByType = Object.fromEntries(
    ORDER_TYPES.map((type) => [type, 0]),
  ) as Record<OrderType, number>;

  return {
    overview: {
      totalOrders: 0,
      totalRevenue: 0,
      ordersToday: 0,
      revenueToday: 0,
      avgOrderValue: 0,
    },
    ordersByStatus,
    ordersByType,
    topSellingItems: [],
    peakHours: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${hour.toString().padStart(2, "0")}:00`,
      orders: 0,
    })),
    dailyOrders: [],
  };
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildDailyOrderSeries(orders: Order[], rangeDays: number): DailyOrderPoint[] {
  const buckets = new Map<string, DailyOrderPoint>();
  const now = new Date();

  for (let i = rangeDays - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, {
      date: key,
      label: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      orders: 0,
      revenue: 0,
    });
  }

  for (const order of orders) {
    if (order.status === "Cancelled") continue;
    const key = new Date(order.createdAt).toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.orders += 1;
      bucket.revenue += order.grandTotal;
    }
  }

  return Array.from(buckets.values());
}

function buildPeakHourSeries(orders: Order[]): OrderPeakHourPoint[] {
  const counts = new Array(24).fill(0);
  for (const order of orders) {
    if (order.status === "Cancelled") continue;
    const hour = new Date(order.createdAt).getHours();
    counts[hour] += 1;
  }
  return counts.map((orderCount, hour) => ({
    hour,
    label: `${hour.toString().padStart(2, "0")}:00`,
    orders: orderCount,
  }));
}

function buildTopSellingItems(orders: Order[]): TopSellingItem[] {
  const totals = new Map<string, TopSellingItem>();

  for (const order of orders) {
    if (order.status === "Cancelled") continue;
    for (const item of order.items) {
      const key = item.menuItemId ?? item.itemName;
      const existing = totals.get(key);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.lineTotal;
      } else {
        totals.set(key, {
          menuItemId: item.menuItemId,
          name: item.itemName,
          quantity: item.quantity,
          revenue: item.lineTotal,
        });
      }
    }
  }

  return Array.from(totals.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
}

export async function fetchOrderAnalytics(
  restaurantId: string,
  range: OrderAnalyticsRange = "month",
): Promise<{ ok: true; data: OrderAnalyticsData } | { ok: false; message: string }> {
  try {
    if (!restaurantId) return { ok: true, data: emptyAnalyticsData() };

    const rangeDays = RANGE_DAYS[range];
    const rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - rangeDays);

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", rangeStart.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingTableError(error)) return { ok: true, data: emptyAnalyticsData() };
      return { ok: false, message: error.message || QUERY_ERROR };
    }

    const orders = ((data ?? []) as OrderRecord[]).map(mapOrderRow);
    const nonCancelled = orders.filter((order) => order.status !== "Cancelled");
    const today = new Date();
    const todaysOrders = nonCancelled.filter((order) => isSameDay(new Date(order.createdAt), today));

    const totalRevenue = nonCancelled.reduce((sum, order) => sum + order.grandTotal, 0);
    const revenueToday = todaysOrders.reduce((sum, order) => sum + order.grandTotal, 0);

    const ordersByStatus = Object.fromEntries(
      ORDER_STATUSES.map((status) => [status, orders.filter((o) => o.status === status).length]),
    ) as Record<OrderStatus, number>;

    const ordersByType = Object.fromEntries(
      ORDER_TYPES.map((type) => [type, orders.filter((o) => o.orderType === type).length]),
    ) as Record<OrderType, number>;

    return {
      ok: true,
      data: {
        overview: {
          totalOrders: orders.length,
          totalRevenue,
          ordersToday: todaysOrders.length,
          revenueToday,
          avgOrderValue: nonCancelled.length > 0 ? totalRevenue / nonCancelled.length : 0,
        },
        ordersByStatus,
        ordersByType,
        topSellingItems: buildTopSellingItems(orders),
        peakHours: buildPeakHourSeries(orders),
        dailyOrders: buildDailyOrderSeries(orders, rangeDays),
      },
    };
  } catch {
    return { ok: false, message: QUERY_ERROR };
  }
}
