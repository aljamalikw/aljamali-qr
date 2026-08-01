import { supabase } from "@/lib/supabase";
import { fetchDemoRequests } from "@/lib/demo-requests/fetchDemoRequests";
import { fetchPayments, sumPaidThisMonth } from "@/lib/admin/payments";
import { fetchSubscriptions } from "@/lib/admin/subscriptions";

export type AdminAnalyticsData = {
  totalRestaurants: number;
  activeRestaurants: number;
  inactiveRestaurants: number;
  totalScans: number;
  scansLast30Days: number;
  averageQrScans: number;
  dailyScans: { date: string; count: number }[];
  restaurantsOverTime: { date: string; count: number }[];
  newRegistrations30d: number;
  trialConversions: number;
  trialConversionRate: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  suspendedSubscriptions: number;
  mrr: number;
  arr: number;
  monthlyRevenue: number;
  growthPercent: number;
  planDistribution: { plan: string; count: number }[];
  averageMenuSize: number;
  reservationsTotal: number;
  ordersTotal: number;
  topRestaurants: { name: string; scans: number }[];
  inactiveRestaurantNames: { name: string; id: string }[];
  demosTotal: number;
  demosConverted: number;
  conversionRate: number;
  subscriptionsByPlan: { plan: string; count: number }[];
  demosByStatus: { status: string; count: number }[];
};

const ERROR = "Unable to load analytics. Please try again.";

function emptySeries(days: number): { date: string; count: number }[] {
  const series: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    series.push({
      date: d.toISOString().slice(0, 10),
      count: 0,
    });
  }
  return series;
}

export async function fetchAdminAnalytics(): Promise<
  { ok: true; data: AdminAnalyticsData } | { ok: false; message: string }
> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 29);
    const sinceIso = since.toISOString();
    const prevSince = new Date();
    prevSince.setDate(prevSince.getDate() - 59);
    const mid = new Date();
    mid.setDate(mid.getDate() - 29);

    const [
      restaurantsResult,
      scansCountResult,
      recentScansResult,
      demosResult,
      subscriptionsResult,
      paymentsResult,
      menuCountResult,
      reservationsCount,
      ordersCount,
      scanByRestaurant,
    ] = await Promise.all([
      supabase
        .from("restaurants")
        .select("id, is_active, restaurant_name, created_at, is_archived"),
      supabase
        .from("qr_code_scans")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("qr_code_scans")
        .select("scanned_at, restaurant_id")
        .gte("scanned_at", sinceIso)
        .order("scanned_at", { ascending: true }),
      fetchDemoRequests(),
      fetchSubscriptions(),
      fetchPayments(),
      supabase.from("menu_items").select("restaurant_id"),
      supabase.from("reservations").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase
        .from("qr_code_scans")
        .select("restaurant_id")
        .gte("scanned_at", sinceIso),
    ]);

    if (restaurantsResult.error) {
      return { ok: false, message: restaurantsResult.error.message || ERROR };
    }
    if (scansCountResult.error) {
      return { ok: false, message: scansCountResult.error.message || ERROR };
    }
    if (recentScansResult.error) {
      return { ok: false, message: recentScansResult.error.message || ERROR };
    }
    if (!demosResult.ok) return { ok: false, message: demosResult.message };
    if (!subscriptionsResult.ok) {
      return { ok: false, message: subscriptionsResult.message };
    }
    if (!paymentsResult.ok) {
      return { ok: false, message: paymentsResult.message };
    }

    const restaurants = restaurantsResult.data ?? [];
    const activeRestaurants = restaurants.filter(
      (r) => r.is_active !== false && Boolean(r.restaurant_name?.trim()),
    ).length;
    const inactiveRestaurants = restaurants.filter(
      (r) => r.is_active === false || r.is_archived === true,
    ).length;

    const dailyMap = new Map(emptySeries(30).map((d) => [d.date, 0]));
    for (const row of recentScansResult.data ?? []) {
      const key = String(row.scanned_at).slice(0, 10);
      if (dailyMap.has(key)) {
        dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
      }
    }

    const regSeries = emptySeries(30);
    const regMap = new Map(regSeries.map((d) => [d.date, 0]));
    for (const restaurant of restaurants) {
      const key = String(restaurant.created_at).slice(0, 10);
      if (regMap.has(key)) {
        regMap.set(key, (regMap.get(key) ?? 0) + 1);
      }
    }

    const newRegistrations30d = restaurants.filter(
      (r) => new Date(r.created_at).getTime() >= since.getTime(),
    ).length;
    const prevRegistrations = restaurants.filter((r) => {
      const t = new Date(r.created_at).getTime();
      return t >= prevSince.getTime() && t < mid.getTime();
    }).length;
    const growthPercent =
      prevRegistrations === 0
        ? newRegistrations30d > 0
          ? 100
          : 0
        : Math.round(
            ((newRegistrations30d - prevRegistrations) / prevRegistrations) *
              100,
          );

    const demos = demosResult.data.filter((d) => !d.deletedAt && !d.isArchived);
    const demosConverted = demos.filter(
      (d) => d.status === "Customer" || d.status === "Completed",
    ).length;

    const statusCounts = new Map<string, number>();
    for (const demo of demos) {
      statusCounts.set(demo.status, (statusCounts.get(demo.status) ?? 0) + 1);
    }

    const planCounts = new Map<string, number>();
    for (const sub of subscriptionsResult.data) {
      planCounts.set(sub.plan, (planCounts.get(sub.plan) ?? 0) + 1);
    }

    const activeSubscriptions = subscriptionsResult.data.filter(
      (s) =>
        s.status === "active" ||
        s.status === "trial" ||
        s.status === "grace",
    ).length;
    const expiredSubscriptions = subscriptionsResult.data.filter(
      (s) => s.status === "expired",
    ).length;
    const suspendedSubscriptions = subscriptionsResult.data.filter(
      (s) => s.status === "suspended",
    ).length;

    const mrr = subscriptionsResult.data
      .filter((s) => s.status === "active" || s.status === "grace")
      .reduce((sum, s) => sum + (s.monthlyPrice || 0), 0);
    const arr = mrr * 12;

    const trialConversions = subscriptionsResult.data.filter(
      (s) => s.status === "active",
    ).length;
    const everTrialish = subscriptionsResult.data.length || 1;
    const trialConversionRate = Math.round(
      (trialConversions / everTrialish) * 100,
    );

    const menuRows = menuCountResult.data ?? [];
    const menuByRestaurant = new Map<string, number>();
    for (const row of menuRows) {
      const id = String((row as { restaurant_id: string }).restaurant_id);
      menuByRestaurant.set(id, (menuByRestaurant.get(id) ?? 0) + 1);
    }
    const averageMenuSize =
      menuByRestaurant.size === 0
        ? 0
        : Math.round(
            [...menuByRestaurant.values()].reduce((a, b) => a + b, 0) /
              menuByRestaurant.size,
          );

    const scanCounts = new Map<string, number>();
    for (const row of scanByRestaurant.data ?? []) {
      const id = String(
        (row as { restaurant_id: string | null }).restaurant_id ?? "",
      );
      if (!id) continue;
      scanCounts.set(id, (scanCounts.get(id) ?? 0) + 1);
    }
    const nameById = new Map(
      restaurants.map((r) => [
        r.id as string,
        (r.restaurant_name as string | null)?.trim() || "Unnamed",
      ]),
    );
    const topRestaurants = [...scanCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id, scans]) => ({
        name: nameById.get(id) ?? "Restaurant",
        scans,
      }));

    const averageQrScans =
      restaurants.length === 0
        ? 0
        : Math.round((scansCountResult.count ?? 0) / restaurants.length);

    const monthlyRevenue = sumPaidThisMonth(paymentsResult.data);

    return {
      ok: true,
      data: {
        totalRestaurants: restaurants.length,
        activeRestaurants,
        inactiveRestaurants,
        totalScans: scansCountResult.count ?? 0,
        scansLast30Days: recentScansResult.data?.length ?? 0,
        averageQrScans,
        dailyScans: [...dailyMap.entries()].map(([date, count]) => ({
          date,
          count,
        })),
        restaurantsOverTime: [...regMap.entries()].map(([date, count]) => ({
          date,
          count,
        })),
        newRegistrations30d,
        trialConversions,
        trialConversionRate,
        activeSubscriptions,
        expiredSubscriptions,
        suspendedSubscriptions,
        mrr,
        arr,
        monthlyRevenue,
        growthPercent,
        planDistribution: [...planCounts.entries()].map(([plan, count]) => ({
          plan,
          count,
        })),
        averageMenuSize,
        reservationsTotal: reservationsCount.count ?? 0,
        ordersTotal: ordersCount.count ?? 0,
        topRestaurants,
        inactiveRestaurantNames: restaurants
          .filter((r) => r.is_active === false || r.is_archived === true)
          .slice(0, 12)
          .map((r) => ({
            id: r.id as string,
            name:
              (r.restaurant_name as string | null)?.trim() || "Unnamed restaurant",
          })),
        demosTotal: demos.length,
        demosConverted,
        conversionRate:
          demos.length === 0
            ? 0
            : Math.round((demosConverted / demos.length) * 100),
        subscriptionsByPlan: [...planCounts.entries()].map(([plan, count]) => ({
          plan,
          count,
        })),
        demosByStatus: [...statusCounts.entries()].map(([status, count]) => ({
          status,
          count,
        })),
      },
    };
  } catch {
    return { ok: false, message: ERROR };
  }
}
