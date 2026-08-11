"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListPanelSkeleton, StatCardSkeleton } from "@/components/ui/Skeleton";
import { DemoRequestStatusBadge } from "@/components/admin/demo-requests/DemoRequestStatusBadge";
import {
  fetchPlatformStats,
  type PlatformStats,
} from "@/lib/admin/platform-stats";
import { formatPaymentAmount } from "@/lib/admin/payments";
import {
  formatDemoDate,
  formatDemoDateTime,
} from "@/lib/demo-requests/utils";

const KPI_LABELS = [
  "Total Restaurants",
  "Active Restaurants",
  "Inactive Restaurants",
  "Total Restaurant Owners",
  "Demo Requests",
  "Scheduled Demos",
  "Completed Demos",
  "Active Subscriptions",
  "Monthly Revenue",
  "Pending Support Tickets",
] as const;

function getKpiValue(
  stats: PlatformStats,
  label: (typeof KPI_LABELS)[number],
): string {
  switch (label) {
    case "Total Restaurants":
      return String(stats.totalRestaurants);
    case "Active Restaurants":
      return String(stats.activeRestaurants);
    case "Inactive Restaurants":
      return String(stats.inactiveRestaurants);
    case "Total Restaurant Owners":
      return String(stats.totalOwners);
    case "Demo Requests":
      return String(stats.demoRequests);
    case "Scheduled Demos":
      return String(stats.scheduledDemos);
    case "Completed Demos":
      return String(stats.completedDemos);
    case "Active Subscriptions":
      return String(stats.activeSubscriptions);
    case "Monthly Revenue":
      return stats.monthlyRevenue;
    case "Pending Support Tickets":
      return String(stats.pendingSupportTickets);
    default:
      return "0";
  }
}

export function AdminDashboardHome() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchPlatformStats();
    if (!result.ok) {
      setError(result.message);
      setStats(null);
    } else {
      setStats(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  if (error && !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Monitor demos, restaurants, subscriptions and platform health.
          </p>
        </div>
        <div className="dashboard-card flex flex-col items-center rounded-2xl px-6 py-16 text-center">
          <h2 className="font-serif text-xl font-bold text-white">
            Unable to load dashboard
          </h2>
          <p className="mt-2 max-w-md text-sm text-white/50">{error}</p>
          <button
            type="button"
            onClick={() => void loadStats()}
            className="menu-btn-primary mt-6"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-white/45">
          Monitor demos, restaurants, subscriptions and platform health.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? KPI_LABELS.map((label) => <StatCardSkeleton key={label} />)
          : stats &&
            KPI_LABELS.map((label, index) => (
              <DashboardCard key={label} delay={index * 0.03} className="p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/45">
                  {label}
                </p>
                <p className="mt-2 font-serif text-2xl font-bold text-white">
                  {getKpiValue(stats, label)}
                </p>
              </DashboardCard>
            ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardCard className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-white">Recent Demo Requests</h2>
            <Link
              href="/admin/demo-requests"
              className="text-sm text-gold hover:text-gold-light"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <ListPanelSkeleton rows={3} />
            ) : stats?.recentDemoRequests.length === 0 ? (
              <EmptyState
                compact
                title="No demo requests"
                description="Demo requests will appear here as they come in."
                actionLabel="Open demos"
                actionHref="/admin/demo-requests"
                className="border-0 bg-transparent shadow-none"
              />
            ) : (
              stats?.recentDemoRequests.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {item.restaurantName}
                    </p>
                    <p className="truncate text-xs text-white/40">
                      {item.contactPerson} · {formatDemoDate(item.preferredDate)}
                    </p>
                  </div>
                  <DemoRequestStatusBadge status={item.status} />
                </div>
              ))
            )}
          </div>
        </DashboardCard>

        <DashboardCard className="p-5 sm:p-6">
          <h2 className="mb-4 font-serif text-xl text-white">
            Upcoming Follow-ups
          </h2>
          <div className="space-y-3">
            {loading ? (
              <ListPanelSkeleton rows={3} />
            ) : stats?.upcomingFollowUps.length === 0 ? (
              <EmptyState
                compact
                title="No follow-ups"
                description="Scheduled follow-ups will show here."
                className="border-0 bg-transparent shadow-none"
              />
            ) : (
              stats?.upcomingFollowUps.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/5 bg-black/20 px-3 py-3"
                >
                  <p className="text-sm font-medium text-white">
                    {item.restaurantName}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    {formatDemoDateTime(item.nextFollowUpAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </DashboardCard>

        <DashboardCard className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-white">Recent Restaurants</h2>
            <Link
              href="/admin/restaurants"
              className="text-sm text-gold hover:text-gold-light"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <ListPanelSkeleton rows={3} />
            ) : stats?.recentRestaurants.length === 0 ? (
              <EmptyState
                compact
                title="No restaurants yet"
                description="Restaurants appear after owners complete onboarding."
                actionLabel="View restaurants"
                actionHref="/admin/restaurants"
                className="border-0 bg-transparent shadow-none"
              />
            ) : (
              stats?.recentRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="rounded-xl border border-white/5 bg-black/20 px-3 py-3"
                >
                  <p className="truncate text-sm font-medium text-white">
                    {restaurant.restaurant_name?.trim() || "Unnamed restaurant"}
                  </p>
                  <p className="mt-1 truncate text-xs text-white/40">
                    {restaurant.email ?? "No email"} ·{" "}
                    {formatDemoDate(restaurant.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </DashboardCard>

        <DashboardCard className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-white">Recent Payments</h2>
            <Link
              href="/admin/payments"
              className="text-sm text-gold hover:text-gold-light"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <ListPanelSkeleton rows={3} />
            ) : !stats?.recentPayments.length ? (
              <EmptyState
                compact
                title="No payments yet"
                description="Recent payment activity will show here."
                actionLabel="View payments"
                actionHref="/admin/payments"
                className="border-0 bg-transparent shadow-none"
              />
            ) : (
              stats.recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {payment.restaurantName ?? "Restaurant"}
                    </p>
                    <p className="truncate text-xs text-white/40">
                      {payment.invoiceNumber ?? "No invoice"} ·{" "}
                      {formatDemoDate(payment.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gold">
                      {formatPaymentAmount(payment.amount, payment.currency)}
                    </p>
                    <p className="text-xs capitalize text-white/40">
                      {payment.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
