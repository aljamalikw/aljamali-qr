import type { DateRange } from "@/lib/intelligence/ranges";

export type ChartPoint = {
  key: string;
  label: string;
  value: number;
  secondary?: number;
};

export type BiKpis = {
  revenueToday: number;
  revenueYesterday: number;
  ordersToday: number;
  reservationsToday: number;
  averageOrderValue: number;
  returningCustomers: number;
  newCustomers: number;
  loyaltyMembers: number;
  pendingReservations: number;
  cancelledReservations: number;
  marketingCampaigns: number;
  customerGrowth: number;
  currency: string;
};

export type BiPerformance = {
  topItems: Array<{ name: string; quantity: number; revenue: number }>;
  worstItems: Array<{ name: string; quantity: number; revenue: number }>;
  topCategories: Array<{ name: string; quantity: number; revenue: number }>;
  averageSpend: number;
  repeatCustomerPct: number;
  firstTimeCustomerPct: number;
};

export type BiDashboardData = {
  kpis: BiKpis;
  revenueSeries: ChartPoint[];
  ordersSeries: ChartPoint[];
  reservationsSeries: ChartPoint[];
  categoryPie: ChartPoint[];
  topItemsBar: ChartPoint[];
  customerGrowthSeries: ChartPoint[];
  performance: BiPerformance;
  range: DateRange;
};

export type InsightSeverity = "success" | "warning" | "opportunity" | "info";

export type RestaurantInsight = {
  id: string;
  severity: InsightSeverity;
  title: string;
  body: string;
  icon: InsightSeverity;
};

export type MultiRestaurantRow = {
  restaurantId: string;
  restaurantName: string;
  revenue: number;
  orders: number;
  reservations: number;
  customers: number;
  loyaltyMembers: number;
  campaigns: number;
  averageRating: number | null;
  reviewCount: number;
};

export type GlobalSearchResult = {
  id: string;
  type:
    | "customer"
    | "restaurant"
    | "order"
    | "reservation"
    | "campaign"
    | "reward"
    | "menu_item"
    | "category";
  title: string;
  subtitle: string;
  href: string;
};
