import { supabase } from "@/lib/supabase";
import { fetchDemoRequests } from "@/lib/demo-requests/fetchDemoRequests";
import { fetchPayments, sumPaidThisMonth } from "@/lib/admin/payments";
import { fetchSubscriptions } from "@/lib/admin/subscriptions";

export type AdminAnalyticsData = {
  totalRestaurants: number;
  activeRestaurants: number;
  totalScans: number;
  scansLast30Days: number;
  dailyScans: { date: string; count: number }[];
  demosTotal: number;
  demosConverted: number;
  conversionRate: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
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

    const [
      restaurantsResult,
      scansCountResult,
      recentScansResult,
      demosResult,
      subscriptionsResult,
      paymentsResult,
    ] = await Promise.all([
      supabase.from("restaurants").select("id, is_active, restaurant_name"),
      supabase
        .from("qr_code_scans")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("qr_code_scans")
        .select("scanned_at")
        .gte("scanned_at", sinceIso)
        .order("scanned_at", { ascending: true }),
      fetchDemoRequests(),
      fetchSubscriptions(),
      fetchPayments(),
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

    const dailyMap = new Map(emptySeries(30).map((d) => [d.date, 0]));
    for (const row of recentScansResult.data ?? []) {
      const key = String(row.scanned_at).slice(0, 10);
      if (dailyMap.has(key)) {
        dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
      }
    }

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

    return {
      ok: true,
      data: {
        totalRestaurants: restaurants.length,
        activeRestaurants,
        totalScans: scansCountResult.count ?? 0,
        scansLast30Days: recentScansResult.data?.length ?? 0,
        dailyScans: [...dailyMap.entries()].map(([date, count]) => ({
          date,
          count,
        })),
        demosTotal: demos.length,
        demosConverted,
        conversionRate:
          demos.length === 0
            ? 0
            : Math.round((demosConverted / demos.length) * 100),
        activeSubscriptions,
        monthlyRevenue: sumPaidThisMonth(paymentsResult.data),
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
