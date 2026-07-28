import { supabase } from "@/lib/supabase";
import { fetchDemoRequests } from "@/lib/demo-requests/fetchDemoRequests";
import type { DemoRequestItem } from "@/lib/demo-requests/types";
import type { Restaurant } from "@/lib/restaurants/types";
import {
  fetchPayments,
  formatPaymentAmount,
  sumPaidThisMonth,
  type PaymentItem,
} from "@/lib/admin/payments";
import { fetchSupportTickets } from "@/lib/admin/support";
import { fetchSubscriptions } from "@/lib/admin/subscriptions";

export type PlatformStats = {
  totalRestaurants: number;
  activeRestaurants: number;
  inactiveRestaurants: number;
  totalOwners: number;
  demoRequests: number;
  scheduledDemos: number;
  completedDemos: number;
  activeSubscriptions: number;
  monthlyRevenue: string;
  pendingSupportTickets: number;
  recentDemoRequests: DemoRequestItem[];
  upcomingFollowUps: DemoRequestItem[];
  recentRestaurants: Restaurant[];
  recentPayments: PaymentItem[];
};

const EMPTY: PlatformStats = {
  totalRestaurants: 0,
  activeRestaurants: 0,
  inactiveRestaurants: 0,
  totalOwners: 0,
  demoRequests: 0,
  scheduledDemos: 0,
  completedDemos: 0,
  activeSubscriptions: 0,
  monthlyRevenue: "KD 0.000",
  pendingSupportTickets: 0,
  recentDemoRequests: [],
  upcomingFollowUps: [],
  recentRestaurants: [],
  recentPayments: [],
};

export async function fetchPlatformStats(): Promise<
  { ok: true; data: PlatformStats } | { ok: false; message: string }
> {
  try {
    const [
      restaurantsResult,
      ownersResult,
      demosResult,
      subscriptionsResult,
      paymentsResult,
      ticketsResult,
    ] = await Promise.all([
      supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "restaurant_owner"),
      fetchDemoRequests(),
      fetchSubscriptions(),
      fetchPayments(),
      fetchSupportTickets(),
    ]);

    if (restaurantsResult.error) {
      return {
        ok: false,
        message:
          restaurantsResult.error.message || "Unable to load restaurants.",
      };
    }

    if (!demosResult.ok) {
      return { ok: false, message: demosResult.message };
    }

    const restaurants = (restaurantsResult.data ?? []) as Restaurant[];
    const demos = demosResult.data;
    const activeDemos = demos.filter((d) => !d.deletedAt && !d.isArchived);

    const activeRestaurants = restaurants.filter(
      (r) => r.is_active !== false && Boolean(r.restaurant_name?.trim()),
    ).length;
    const inactiveRestaurants = Math.max(
      restaurants.length - activeRestaurants,
      0,
    );

    const subscriptions = subscriptionsResult.ok
      ? subscriptionsResult.data
      : [];
    const payments = paymentsResult.ok ? paymentsResult.data : [];
    const tickets = ticketsResult.ok ? ticketsResult.data : [];

    const activeSubscriptions = subscriptions.filter(
      (s) =>
        s.status === "active" ||
        s.status === "trial" ||
        s.status === "grace",
    ).length;

    const monthlyRevenueAmount = sumPaidThisMonth(payments);

    return {
      ok: true,
      data: {
        totalRestaurants: restaurants.length,
        activeRestaurants,
        inactiveRestaurants,
        totalOwners: ownersResult.count ?? restaurants.length,
        demoRequests: activeDemos.length,
        scheduledDemos: activeDemos.filter((d) => d.status === "Scheduled")
          .length,
        completedDemos: activeDemos.filter((d) => d.status === "Completed")
          .length,
        activeSubscriptions,
        monthlyRevenue: formatPaymentAmount(monthlyRevenueAmount, "KWD"),
        pendingSupportTickets: tickets.filter(
          (t) => t.status === "Open" || t.status === "In Progress",
        ).length,
        recentDemoRequests: [...demos]
          .filter((d) => !d.deletedAt)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 5),
        upcomingFollowUps: [...activeDemos]
          .filter((d) => d.nextFollowUpAt)
          .sort(
            (a, b) =>
              new Date(a.nextFollowUpAt!).getTime() -
              new Date(b.nextFollowUpAt!).getTime(),
          )
          .slice(0, 5),
        recentRestaurants: restaurants.slice(0, 5),
        recentPayments: payments.slice(0, 5),
      },
    };
  } catch {
    return { ok: false, message: "Unable to load platform statistics." };
  }
}

export async function fetchAdminRestaurants(): Promise<
  { ok: true; data: Restaurant[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, message: error.message };
    }

    return { ok: true, data: (data ?? []) as Restaurant[] };
  } catch {
    return { ok: false, message: "Unable to load restaurants." };
  }
}

export { EMPTY };
