import {
  formatMoney,
  pctChange,
  percent,
  resolveIntelligenceRange,
  toIsoDate,
  type DateRange,
  type IntelligenceRangeId,
} from "@/lib/intelligence/ranges";
import type {
  BiDashboardData,
  BiKpis,
  BiPerformance,
  ChartPoint,
} from "@/lib/intelligence/types";
import { supabase } from "@/lib/supabase";

const ERROR = "Unable to load business intelligence.";

type OrderRow = {
  id: string;
  status: string;
  grand_total: number | string;
  currency: string | null;
  created_at: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_name: string | null;
};

type OrderItemRow = {
  order_id: string;
  item_name: string;
  menu_item_id: string | null;
  quantity: number;
  line_total: number | string;
};

type ReservationRow = {
  id: string;
  status: string;
  reservation_date: string;
  created_at: string;
};

type CustomerRow = {
  id: string;
  created_at: string;
  first_visit: string | null;
  last_visit: string | null;
  total_orders: number;
  loyalty_points: number;
  metadata: Record<string, unknown> | null;
  birthday: string | null;
};

function num(v: number | string | null | undefined): number {
  return Number(v ?? 0) || 0;
}

function inRange(iso: string, range: DateRange): boolean {
  const t = new Date(iso).getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return toIsoDate(d);
}

function buildDaySeries(
  range: DateRange,
  fill: (key: string, label: string) => ChartPoint,
): ChartPoint[] {
  const points: ChartPoint[] = [];
  const cursor = new Date(range.start);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    const key = toIsoDate(cursor);
    const label = cursor.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    points.push(fill(key, label));
    cursor.setDate(cursor.getDate() + 1);
  }
  return points;
}

function isLoyaltyMember(c: CustomerRow): boolean {
  const meta = c.metadata ?? {};
  const loyalty =
    meta.loyalty && typeof meta.loyalty === "object"
      ? (meta.loyalty as Record<string, unknown>)
      : {};
  return loyalty.enrolled === true || Number(c.loyalty_points ?? 0) > 0;
}

export async function fetchBusinessIntelligence(input: {
  restaurantId: string;
  rangeId?: IntelligenceRangeId;
  customStart?: string | null;
  customEnd?: string | null;
}): Promise<
  { ok: true; data: BiDashboardData } | { ok: false; message: string }
> {
  try {
    const range = resolveIntelligenceRange(
      input.rangeId ?? "30d",
      input.customStart,
      input.customEnd,
    );

    const lookbackStart = new Date(range.start);
    lookbackStart.setDate(lookbackStart.getDate() - 400);

    const [
      ordersResult,
      itemsResult,
      reservationsResult,
      customersResult,
      campaignsResult,
      menuItemsResult,
    ] = await Promise.all([
      supabase
        .from("orders")
        .select(
          "id, status, grand_total, currency, created_at, customer_phone, customer_email, customer_name",
        )
        .eq("restaurant_id", input.restaurantId)
        .gte("created_at", lookbackStart.toISOString())
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase
        .from("order_items")
        .select("order_id, item_name, menu_item_id, quantity, line_total")
        .eq("restaurant_id", input.restaurantId)
        .limit(8000),
      supabase
        .from("reservations")
        .select("id, status, reservation_date, created_at")
        .eq("restaurant_id", input.restaurantId)
        .gte("created_at", lookbackStart.toISOString())
        .limit(3000),
      supabase
        .from("customers")
        .select(
          "id, created_at, first_visit, last_visit, total_orders, loyalty_points, metadata, birthday",
        )
        .eq("restaurant_id", input.restaurantId)
        .limit(5000),
      supabase
        .from("marketing_campaigns")
        .select("id, created_at, status")
        .eq("restaurant_id", input.restaurantId)
        .limit(500),
      supabase
        .from("menu_items")
        .select("id, category_id, categories(name)")
        .eq("restaurant_id", input.restaurantId)
        .limit(2000),
    ]);

    if (ordersResult.error) {
      return { ok: false, message: ordersResult.error.message || ERROR };
    }

    const orders = (ordersResult.data ?? []) as OrderRow[];
    const items = (itemsResult.data ?? []) as OrderItemRow[];
    const reservations = (reservationsResult.data ?? []) as ReservationRow[];
    const customers = (customersResult.data ?? []) as CustomerRow[];
    const campaigns = (campaignsResult.data ?? []) as Array<{
      id: string;
      created_at: string;
      status: string;
    }>;

    const categoryByMenuItem = new Map<string, string>();
    for (const row of (menuItemsResult.data ?? []) as Array<{
      id: string;
      categories: { name: string } | { name: string }[] | null;
    }>) {
      const cat = Array.isArray(row.categories)
        ? row.categories[0]
        : row.categories;
      if (cat?.name) categoryByMenuItem.set(row.id, cat.name);
    }

    const today = resolveIntelligenceRange("today");
    const yesterday = resolveIntelligenceRange("yesterday");

    const completedLike = (o: OrderRow) =>
      o.status !== "Cancelled" && o.status !== "Pending";

    const revenueIn = (r: DateRange) =>
      orders
        .filter((o) => completedLike(o) && inRange(o.created_at, r))
        .reduce((sum, o) => sum + num(o.grand_total), 0);

    const ordersIn = (r: DateRange) =>
      orders.filter((o) => o.status !== "Cancelled" && inRange(o.created_at, r))
        .length;

    // Revenue KPIs exclude Pending + Cancelled; order counts exclude Cancelled only.
    const rangeRevenueOrders = orders.filter(
      (o) => completedLike(o) && inRange(o.created_at, range),
    );
    const rangeOrders = orders.filter(
      (o) => o.status !== "Cancelled" && inRange(o.created_at, range),
    );
    const rangeRevenue = rangeRevenueOrders.reduce(
      (sum, o) => sum + num(o.grand_total),
      0,
    );

    const currency =
      orders.find((o) => o.currency)?.currency?.trim() || "KWD";

    const newCustomers = customers.filter((c) =>
      inRange(c.created_at, range),
    ).length;
    const returningCustomers = customers.filter(
      (c) => Number(c.total_orders ?? 0) >= 2,
    ).length;
    const loyaltyMembers = customers.filter(isLoyaltyMember).length;

    const pendingReservations = reservations.filter((r) => {
      const s = r.status.toLowerCase();
      return s === "pending" || s === "confirmed" || s === "booked";
    }).length;
    const cancelledReservations = reservations.filter((r) =>
      r.status.toLowerCase().includes("cancel"),
    ).length;
    const reservationsToday = reservations.filter((r) =>
      inRange(
        r.reservation_date.length <= 10
          ? `${r.reservation_date}T12:00:00`
          : r.reservation_date,
        today,
      ),
    ).length;

    const customersBefore = customers.filter(
      (c) => new Date(c.created_at).getTime() < range.start.getTime(),
    ).length;
    const customerGrowth = newCustomers;

    const kpis: BiKpis = {
      revenueToday: revenueIn(today),
      revenueYesterday: revenueIn(yesterday),
      ordersToday: ordersIn(today),
      reservationsToday,
      averageOrderValue:
        rangeRevenueOrders.length > 0
          ? rangeRevenue / rangeRevenueOrders.length
          : 0,
      returningCustomers,
      newCustomers,
      loyaltyMembers,
      pendingReservations,
      cancelledReservations,
      marketingCampaigns: campaigns.filter((c) =>
        inRange(c.created_at, range),
      ).length,
      customerGrowth,
      currency,
    };

    const revenueByDay = new Map<string, number>();
    const ordersByDay = new Map<string, number>();
    for (const o of rangeRevenueOrders) {
      const key = dayKey(o.created_at);
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + num(o.grand_total));
    }
    for (const o of rangeOrders) {
      const key = dayKey(o.created_at);
      ordersByDay.set(key, (ordersByDay.get(key) ?? 0) + 1);
    }

    const revenueSeries = buildDaySeries(range, (key, label) => ({
      key,
      label,
      value: revenueByDay.get(key) ?? 0,
    }));

    const ordersSeries = buildDaySeries(range, (key, label) => ({
      key,
      label,
      value: ordersByDay.get(key) ?? 0,
    }));

    const reservationsByDay = new Map<string, number>();
    for (const r of reservations) {
      if (!inRange(r.created_at, range)) continue;
      const key = dayKey(r.created_at);
      reservationsByDay.set(key, (reservationsByDay.get(key) ?? 0) + 1);
    }
    const reservationsSeries = buildDaySeries(range, (key, label) => ({
      key,
      label,
      value: reservationsByDay.get(key) ?? 0,
    }));

    const orderIdsInRange = new Set(rangeOrders.map((o) => o.id));
    const itemAgg = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();
    const catAgg = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();

    for (const item of items) {
      if (!orderIdsInRange.has(item.order_id)) continue;
      const name = item.item_name?.trim() || "Item";
      const cat =
        (item.menu_item_id
          ? categoryByMenuItem.get(item.menu_item_id)
          : null) || "Uncategorized";
      const qty = Number(item.quantity ?? 0) || 0;
      const rev = num(item.line_total);
      const prev = itemAgg.get(name) ?? { name, quantity: 0, revenue: 0 };
      prev.quantity += qty;
      prev.revenue += rev;
      itemAgg.set(name, prev);
      const cprev = catAgg.get(cat) ?? { name: cat, quantity: 0, revenue: 0 };
      cprev.quantity += qty;
      cprev.revenue += rev;
      catAgg.set(cat, cprev);
    }

    const sortedItems = Array.from(itemAgg.values()).sort(
      (a, b) => b.quantity - a.quantity,
    );
    const sortedCats = Array.from(catAgg.values()).sort(
      (a, b) => b.quantity - a.quantity,
    );

    const categoryPie: ChartPoint[] = sortedCats.slice(0, 8).map((c) => ({
      key: c.name,
      label: c.name,
      value: c.quantity,
      secondary: c.revenue,
    }));

    const topItemsBar: ChartPoint[] = sortedItems.slice(0, 10).map((i) => ({
      key: i.name,
      label: i.name.length > 18 ? `${i.name.slice(0, 16)}…` : i.name,
      value: i.quantity,
      secondary: i.revenue,
    }));

    const growthByDay = new Map<string, number>();
    for (const c of customers) {
      if (!inRange(c.created_at, range)) continue;
      const key = dayKey(c.created_at);
      growthByDay.set(key, (growthByDay.get(key) ?? 0) + 1);
    }
    const customerGrowthSeries = buildDaySeries(range, (key, label) => ({
      key,
      label,
      value: growthByDay.get(key) ?? 0,
    }));

    const withOrders = customers.filter((c) => Number(c.total_orders) > 0);
    const repeat = withOrders.filter((c) => Number(c.total_orders) >= 2).length;
    const first = withOrders.filter((c) => Number(c.total_orders) === 1).length;

    const performance: BiPerformance = {
      topItems: sortedItems.slice(0, 10),
      worstItems: [...sortedItems].reverse().slice(0, 10),
      topCategories: sortedCats.slice(0, 10),
      averageSpend: kpis.averageOrderValue,
      repeatCustomerPct: percent(repeat, withOrders.length),
      firstTimeCustomerPct: percent(first, withOrders.length),
    };

    void customersBefore;
    void formatMoney;
    void pctChange;

    return {
      ok: true,
      data: {
        kpis,
        revenueSeries,
        ordersSeries,
        reservationsSeries,
        categoryPie,
        topItemsBar,
        customerGrowthSeries,
        performance,
        range,
      },
    };
  } catch {
    return { ok: false, message: ERROR };
  }
}

/** Hourly order counts for today (or provided range day). */
export function buildHourlyOrdersSeries(
  orders: Array<{ created_at: string; status: string }>,
  day: DateRange,
): ChartPoint[] {
  const counts = new Array(24).fill(0);
  for (const o of orders) {
    if (o.status === "Cancelled") continue;
    if (!inRange(o.created_at, day)) continue;
    counts[new Date(o.created_at).getHours()] += 1;
  }
  return counts.map((value, hour) => ({
    key: String(hour),
    label: `${hour.toString().padStart(2, "0")}:00`,
    value,
  }));
}
