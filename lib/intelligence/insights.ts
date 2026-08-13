import { pctChange, resolveIntelligenceRange } from "@/lib/intelligence/ranges";
import type { RestaurantInsight } from "@/lib/intelligence/types";
import { supabase } from "@/lib/supabase";

type InsightContext = {
  restaurantId: string;
  restaurantName: string;
};

/**
 * Rule-based Restaurant Insights engine (no external AI).
 * Add new generators to INSIGHT_GENERATORS to extend.
 */
type InsightGenerator = (
  ctx: InsightContext & {
    orders: Array<{
      id: string;
      status: string;
      grand_total: number | string;
      created_at: string;
    }>;
    items: Array<{
      order_id: string;
      item_name: string;
      quantity: number;
    }>;
    customers: Array<{
      id: string;
      last_visit: string | null;
      birthday: string | null;
      loyalty_points: number;
      metadata: Record<string, unknown> | null;
      total_orders: number;
    }>;
    reservations: Array<{
      reservation_date: string;
      created_at: string;
      status: string;
    }>;
  },
) => RestaurantInsight[];

function n(v: number | string | null | undefined): number {
  return Number(v ?? 0) || 0;
}

function weekBounds(offsetWeeks = 0): { start: Date; end: Date } {
  const end = new Date();
  end.setDate(end.getDate() - offsetWeeks * 7);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function inBounds(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

const revenueTrend: InsightGenerator = ({ orders }) => {
  const thisWeek = weekBounds(0);
  const lastWeek = weekBounds(1);
  const sum = (start: Date, end: Date) =>
    orders
      .filter(
        (o) =>
          o.status !== "Cancelled" && inBounds(o.created_at, start, end),
      )
      .reduce((s, o) => s + n(o.grand_total), 0);
  const current = sum(thisWeek.start, thisWeek.end);
  const previous = sum(lastWeek.start, lastWeek.end);
  const change = pctChange(current, previous);
  if (change == null) return [];
  if (change > 0) {
    return [
      {
        id: "revenue-up",
        severity: "success",
        icon: "success",
        title: "Revenue is growing",
        body: `Revenue increased ${change}% compared to last week.`,
      },
    ];
  }
  if (change < 0) {
    return [
      {
        id: "revenue-down",
        severity: "warning",
        icon: "warning",
        title: "Revenue dipped this week",
        body: `Revenue decreased ${Math.abs(change)}% compared to last week.`,
      },
    ];
  }
  return [
    {
      id: "revenue-flat",
      severity: "info",
      icon: "info",
      title: "Revenue is steady",
      body: "Revenue is about the same as last week.",
    },
  ];
};

const busiestHour: InsightGenerator = ({ orders }) => {
  const today = resolveIntelligenceRange("today");
  const counts = new Array(24).fill(0);
  for (const o of orders) {
    if (o.status === "Cancelled") continue;
    const t = new Date(o.created_at);
    if (t < today.start || t > today.end) continue;
    counts[t.getHours()] += 1;
  }
  let bestHour = 0;
  let bestCount = 0;
  counts.forEach((c, h) => {
    if (c > bestCount) {
      bestCount = c;
      bestHour = h;
    }
  });
  if (bestCount === 0) return [];
  const label =
    bestHour === 0
      ? "12 AM"
      : bestHour < 12
        ? `${bestHour} AM`
        : bestHour === 12
          ? "12 PM"
          : `${bestHour - 12} PM`;
  return [
    {
      id: "busiest-hour",
      severity: "info",
      icon: "info",
      title: "Busiest hour today",
      body: `Your busiest hour today was ${label} (${bestCount} orders).`,
    },
  ];
};

const itemTrends: InsightGenerator = ({ orders, items }) => {
  const thisWeek = weekBounds(0);
  const lastWeek = weekBounds(1);
  const orderWeek = new Map<string, 0 | 1>();
  for (const o of orders) {
    if (inBounds(o.created_at, thisWeek.start, thisWeek.end)) {
      orderWeek.set(o.id, 0);
    } else if (inBounds(o.created_at, lastWeek.start, lastWeek.end)) {
      orderWeek.set(o.id, 1);
    }
  }
  const qty = new Map<string, [number, number]>();
  for (const item of items) {
    const w = orderWeek.get(item.order_id);
    if (w == null) continue;
    const name = item.item_name?.trim();
    if (!name) continue;
    const row = qty.get(name) ?? [0, 0];
    row[w] += Number(item.quantity ?? 0) || 0;
    qty.set(name, row);
  }
  const insights: RestaurantInsight[] = [];
  for (const [name, [cur, prev]] of qty) {
    if (prev < 3 && cur < 3) continue;
    const change = pctChange(cur, prev);
    if (change == null || Math.abs(change) < 10) continue;
    if (change >= 20) {
      insights.push({
        id: `item-up-${name}`,
        severity: "success",
        icon: "success",
        title: `${name} is trending up`,
        body: `${name} sales increased ${change}%.`,
      });
    } else if (change <= -10) {
      insights.push({
        id: `item-down-${name}`,
        severity: "warning",
        icon: "warning",
        title: `${name} slowed down`,
        body: `${name} sales dropped ${Math.abs(change)}%.`,
      });
    }
  }
  return insights.slice(0, 4);
};

const inactiveCustomers: InsightGenerator = ({ customers }) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const inactive = customers.filter((c) => {
    if (!c.last_visit) return Number(c.total_orders) > 0;
    return new Date(c.last_visit).getTime() < cutoff.getTime();
  }).length;
  if (inactive < 3) return [];
  return [
    {
      id: "inactive-customers",
      severity: "opportunity",
      icon: "opportunity",
      title: "Win-back opportunity",
      body: `You have ${inactive} inactive customers (no visit in 30+ days).`,
    },
  ];
};

const birthdaysThisWeek: InsightGenerator = ({ customers }) => {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  let count = 0;
  for (const c of customers) {
    if (!c.birthday) continue;
    const b = new Date(c.birthday);
    const thisYear = new Date(now.getFullYear(), b.getMonth(), b.getDate());
    if (thisYear >= now && thisYear <= end) count += 1;
  }
  if (count === 0) return [];
  return [
    {
      id: "birthdays",
      severity: "opportunity",
      icon: "opportunity",
      title: "Birthdays this week",
      body: `${count} birthday${count === 1 ? "" : "s"} this week — a great time for a loyalty offer.`,
    },
  ];
};

const nearReward: InsightGenerator = ({ customers }) => {
  const near = customers.filter((c) => {
    const pts = Number(c.loyalty_points ?? 0);
    return pts >= 80 && pts < 100;
  }).length;
  if (near === 0) return [];
  return [
    {
      id: "near-reward",
      severity: "opportunity",
      icon: "opportunity",
      title: "Customers close to a reward",
      body: `${near} customer${near === 1 ? " is" : "s are"} close to their next reward.`,
    },
  ];
};

const fridayReservations: InsightGenerator = ({ reservations }) => {
  const counts = new Array(7).fill(0);
  for (const r of reservations) {
    if (String(r.status).toLowerCase().includes("cancel")) continue;
    const d = new Date(
      r.reservation_date.length <= 10
        ? `${r.reservation_date}T12:00:00`
        : r.reservation_date,
    );
    counts[d.getDay()] += 1;
  }
  const max = Math.max(...counts);
  if (max === 0) return [];
  const day = counts.indexOf(max);
  const names = [
    "Sundays",
    "Mondays",
    "Tuesdays",
    "Wednesdays",
    "Thursdays",
    "Fridays",
    "Saturdays",
  ];
  return [
    {
      id: "reservation-peak-day",
      severity: "info",
      icon: "info",
      title: "Reservation peak day",
      body: `Reservations are highest on ${names[day]}.`,
    },
  ];
};

const aovTrend: InsightGenerator = ({ orders }) => {
  const thisWeek = weekBounds(0);
  const lastWeek = weekBounds(1);
  const avg = (start: Date, end: Date) => {
    const rows = orders.filter(
      (o) => o.status !== "Cancelled" && inBounds(o.created_at, start, end),
    );
    if (rows.length === 0) return 0;
    return rows.reduce((s, o) => s + n(o.grand_total), 0) / rows.length;
  };
  const cur = avg(thisWeek.start, thisWeek.end);
  const prev = avg(lastWeek.start, lastWeek.end);
  const change = pctChange(cur, prev);
  if (change == null || Math.abs(change) < 3) return [];
  return [
    {
      id: "aov-trend",
      severity: change > 0 ? "success" : "warning",
      icon: change > 0 ? "success" : "warning",
      title:
        change > 0
          ? "Average order value is increasing"
          : "Average order value softened",
      body:
        change > 0
          ? `Average order value is up ${change}% vs last week.`
          : `Average order value is down ${Math.abs(change)}% vs last week.`,
    },
  ];
};

const comboSuggestion: InsightGenerator = ({ items, orders }) => {
  const recentIds = new Set(
    orders
      .filter((o) => o.status !== "Cancelled")
      .slice(0, 200)
      .map((o) => o.id),
  );
  const byOrder = new Map<string, Set<string>>();
  for (const item of items) {
    if (!recentIds.has(item.order_id)) continue;
    const name = item.item_name?.trim().toLowerCase();
    if (!name) continue;
    const set = byOrder.get(item.order_id) ?? new Set();
    set.add(name);
    byOrder.set(item.order_id, set);
  }
  let burgerFries = 0;
  for (const set of byOrder.values()) {
    const hasBurger = [...set].some((n) => n.includes("burger"));
    const hasFries = [...set].some(
      (n) => n.includes("fries") || n.includes("chips"),
    );
    if (hasBurger && hasFries) burgerFries += 1;
  }
  if (burgerFries < 3) return [];
  return [
    {
      id: "combo-burger-fries",
      severity: "opportunity",
      icon: "opportunity",
      title: "Combo meal opportunity",
      body: `Most customers who order burgers also add fries (${burgerFries} recent orders). Consider creating a combo meal.`,
    },
  ];
};

export const INSIGHT_GENERATORS: InsightGenerator[] = [
  revenueTrend,
  busiestHour,
  itemTrends,
  inactiveCustomers,
  birthdaysThisWeek,
  nearReward,
  fridayReservations,
  aovTrend,
  comboSuggestion,
];

export async function generateRestaurantInsights(
  restaurantId: string,
  restaurantName = "your restaurant",
): Promise<
  { ok: true; data: RestaurantInsight[] } | { ok: false; message: string }
> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 60);

    const [ordersResult, itemsResult, customersResult, reservationsResult] =
      await Promise.all([
        supabase
          .from("orders")
          .select("id, status, grand_total, created_at")
          .eq("restaurant_id", restaurantId)
          .gte("created_at", since.toISOString())
          .order("created_at", { ascending: false })
          .limit(3000),
        supabase
          .from("order_items")
          .select("order_id, item_name, quantity")
          .eq("restaurant_id", restaurantId)
          .limit(6000),
        supabase
          .from("customers")
          .select(
            "id, last_visit, birthday, loyalty_points, metadata, total_orders",
          )
          .eq("restaurant_id", restaurantId)
          .limit(5000),
        supabase
          .from("reservations")
          .select("reservation_date, created_at, status")
          .eq("restaurant_id", restaurantId)
          .gte("created_at", since.toISOString())
          .limit(2000),
      ]);

    if (ordersResult.error) {
      return {
        ok: false,
        message: ordersResult.error.message || "Unable to generate insights.",
      };
    }

    const ctx = {
      restaurantId,
      restaurantName,
      orders: (ordersResult.data ?? []) as Array<{
        id: string;
        status: string;
        grand_total: number | string;
        created_at: string;
      }>,
      items: (itemsResult.data ?? []) as Array<{
        order_id: string;
        item_name: string;
        quantity: number;
      }>,
      customers: (customersResult.data ?? []) as Array<{
        id: string;
        last_visit: string | null;
        birthday: string | null;
        loyalty_points: number;
        metadata: Record<string, unknown> | null;
        total_orders: number;
      }>,
      reservations: (reservationsResult.data ?? []) as Array<{
        reservation_date: string;
        created_at: string;
        status: string;
      }>,
    };

    const insights = INSIGHT_GENERATORS.flatMap((gen) => {
      try {
        return gen(ctx);
      } catch {
        return [];
      }
    });

    return { ok: true, data: insights.slice(0, 12) };
  } catch {
    return { ok: false, message: "Unable to generate insights." };
  }
}
