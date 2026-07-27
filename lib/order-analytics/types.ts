import type { OrderStatus, OrderType } from "@/lib/orders/types";

export type OrderAnalyticsRange = "week" | "month" | "quarter" | "year";

export type OrderAnalyticsOverview = {
  totalOrders: number;
  totalRevenue: number;
  ordersToday: number;
  revenueToday: number;
  avgOrderValue: number;
};

export type TopSellingItem = {
  menuItemId: string | null;
  name: string;
  quantity: number;
  revenue: number;
};

export type OrderPeakHourPoint = {
  hour: number;
  label: string;
  orders: number;
};

export type DailyOrderPoint = {
  date: string;
  label: string;
  orders: number;
  revenue: number;
};

export type OrderAnalyticsData = {
  overview: OrderAnalyticsOverview;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByType: Record<OrderType, number>;
  topSellingItems: TopSellingItem[];
  peakHours: OrderPeakHourPoint[];
  dailyOrders: DailyOrderPoint[];
};
