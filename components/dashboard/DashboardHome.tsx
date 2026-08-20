"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardCard } from "./ui/DashboardCard";
import { ActivityFeed } from "./ActivityFeed";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import { fetchQrCodes } from "@/lib/qr-codes/fetchQrCodes";
import { fetchMenuItems } from "@/lib/menu-items/fetchMenuItems";
import { fetchCategories } from "@/lib/categories/fetchCategories";
import { fetchAnalyticsDashboard } from "@/lib/qr-analytics";
import type { AnalyticsDashboardData } from "@/lib/qr-analytics";
import type { Restaurant } from "@/lib/restaurants/types";
import type { ActivityItem } from "@/lib/dashboard/types";
import { getOnboardingProgress } from "@/lib/onboarding/progress";
import { isRestaurantSetupComplete } from "@/lib/restaurants/setup";
import { formatDemoDateTime } from "@/lib/demo-requests/utils";
import { fetchPublishedAnnouncementsForOwner } from "@/lib/announcements/owner-queries";
import type { AnnouncementItem } from "@/lib/announcements/types";
import { useSubscriptionAccess } from "@/components/dashboard/SubscriptionAccessProvider";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { isAdminRole } from "@/lib/auth/roles";
import { planAllowsBusinessIntelligence } from "@/lib/subscriptions/plans";
import { BusinessIntelligenceDashboard } from "@/components/dashboard/intelligence/BusinessIntelligenceDashboard";

type Announcement = Pick<
  AnnouncementItem,
  "id" | "title" | "message" | "createdAt"
>;

type DashboardData = {
  restaurant: Restaurant | null;
  qrCount: number;
  menuCount: number;
  categoryCount: number;
  analytics: AnalyticsDashboardData | null;
  announcements: Announcement[];
};

const EMPTY_DATA: DashboardData = {
  restaurant: null,
  qrCount: 0,
  menuCount: 0,
  categoryCount: 0,
  analytics: null,
  announcements: [],
};

const QUICK_ACTIONS = [
  { label: "Create QR", href: "/dashboard/qr-codes" },
  { label: "Add Menu Item", href: "/dashboard/menu-items" },
  { label: "View Analytics", href: "/dashboard/analytics" },
  { label: "Restaurant Settings", href: "/dashboard/settings" },
  { label: "Subscription", href: "/dashboard/subscription" },
  { label: "Support", href: "/dashboard/support" },
] as const;

async function fetchPublishedAnnouncements(): Promise<Announcement[]> {
  const items = await fetchPublishedAnnouncementsForOwner();
  return items.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    message: item.message,
    createdAt: item.createdAt,
  }));
}

function buildRecentActivity(
  analytics: AnalyticsDashboardData | null,
): ActivityItem[] {
  if (!analytics) return [];

  const activities: ActivityItem[] = [];

  if (analytics.overview.scansToday > 0) {
    activities.push({
      id: "scans-today",
      title: "Today's scans",
      description: `${analytics.overview.scansToday} QR scan${analytics.overview.scansToday === 1 ? "" : "s"} recorded today.`,
      time: "Today",
      type: "scan",
    });
  }

  for (const qr of analytics.topQrCodes.slice(0, 3)) {
    if (qr.scans <= 0) continue;
    activities.push({
      id: `qr-${qr.id}`,
      title: qr.name,
      description: `${qr.scans} total scan${qr.scans === 1 ? "" : "s"} — one of your most scanned QR codes.`,
      time: "All time",
      type: "scan",
    });
  }

  if (analytics.mostScannedQr && analytics.mostScannedQr.scans > 0) {
    const existing = activities.some(
      (item) => item.id === `top-${analytics.mostScannedQr!.id}`,
    );
    if (!existing) {
      activities.push({
        id: `top-${analytics.mostScannedQr.id}`,
        title: "Top performer",
        description: `${analytics.mostScannedQr.name} leads with ${analytics.mostScannedQr.scans} scans.`,
        time: "All time",
        type: "view",
      });
    }
  }

  return activities.slice(0, 5);
}

export function DashboardHome() {
  const { access, loading: accessLoading } = useSubscriptionAccess();
  const { role, loading: authLoading } = useAuthUser();
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  const showBi =
    !accessLoading &&
    !authLoading &&
    (isAdminRole(role) || planAllowsBusinessIntelligence(access.locationPlan));

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    const restaurantPromise = fetchUserRestaurant();
    const analyticsPromise = restaurantPromise.then((restaurant) =>
      restaurant?.id
        ? fetchAnalyticsDashboard(restaurant.id, restaurant.timezone)
        : Promise.resolve({ ok: false as const, message: "" }),
    );

    const [
      restaurant,
      qrResult,
      menuResult,
      categoriesResult,
      analyticsResult,
      announcements,
    ] = await Promise.all([
      restaurantPromise,
      fetchQrCodes(),
      fetchMenuItems(),
      fetchCategories(),
      analyticsPromise,
      fetchPublishedAnnouncements(),
    ]);

    setData({
      restaurant,
      qrCount: qrResult.ok ? qrResult.data.length : 0,
      menuCount: menuResult.ok ? menuResult.data.length : 0,
      categoryCount: categoriesResult.ok ? categoriesResult.data.length : 0,
      analytics: analyticsResult.ok ? analyticsResult.data : null,
      announcements,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const restaurantName =
    data.restaurant?.restaurant_name?.trim() || "Your Restaurant";
  const isActive = Boolean(data.restaurant?.restaurant_name?.trim());
  const analytics = data.analytics;
  const onboardingIncomplete =
    Boolean(data.restaurant) && !isRestaurantSetupComplete(data.restaurant);
  const onboardingPercent = getOnboardingProgress(data.restaurant).percent;

  const kpis = useMemo(
    () => [
      {
        label: "QR Codes Created",
        value: String(data.qrCount),
      },
      {
        label: "Menu Items",
        value: String(data.menuCount),
      },
      {
        label: "Categories",
        value: String(data.categoryCount),
      },
      {
        label: "Today's Scans",
        value: String(analytics?.overview.scansToday ?? 0),
      },
      {
        label: "Weekly Scans",
        value: String(analytics?.overview.scansThisWeek ?? 0),
      },
      {
        label: "Monthly Scans",
        value: String(analytics?.overview.scansThisMonth ?? 0),
      },
      {
        label: "Top Scanned QR",
        value: analytics?.mostScannedQr
          ? `${analytics.mostScannedQr.name} (${analytics.mostScannedQr.scans})`
          : "—",
      },
    ],
    [analytics, data.categoryCount, data.menuCount, data.qrCount],
  );

  const recentActivity = useMemo(
    () => buildRecentActivity(analytics),
    [analytics],
  );

  const announcementsBlock =
    !loading && data.announcements.length > 0 ? (
      <DashboardCard delay={0.2} className="p-5 sm:p-6">
        <h2 className="font-serif text-xl font-bold text-white">
          Announcements
        </h2>
        <p className="mt-1 text-sm text-white/45">
          Updates from the Aljamali QR team
        </p>
        <div className="mt-5 space-y-3">
          {data.announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="rounded-xl border border-white/5 bg-black/20 p-4"
            >
              <p className="font-medium text-white">
                {announcement.title ?? "Announcement"}
              </p>
              {announcement.message ? (
                <p className="mt-1 text-sm text-white/50">
                  {announcement.message}
                </p>
              ) : null}
              {announcement.createdAt ? (
                <p className="mt-2 text-xs text-white/35">
                  {formatDemoDateTime(announcement.createdAt)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </DashboardCard>
    ) : null;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Welcome back
        </p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
          {loading ? "Dashboard Overview" : restaurantName}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-gold">
            {access.plan || "Starter"}
          </span>
          <span
            className={`rounded-full border px-3 py-1 ${
              isActive
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-white/10 bg-white/5 text-white/45"
            }`}
          >
            {isActive ? "Active" : "Incomplete"}
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-white/50 sm:text-base">
          {showBi
            ? "Business intelligence, guest trends, and restaurant performance in one place."
            : "Track scans, menu performance, and guest activity across your restaurant."}
        </p>
      </motion.div>

      {!loading && onboardingIncomplete ? (
        <DashboardCard className="flex flex-col gap-4 border-gold/25 bg-gold/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
              Setup in progress
            </p>
            <p className="mt-2 text-sm text-white/80 sm:text-base">
              Complete your restaurant setup ({onboardingPercent}%)
            </p>
          </div>
          <Link
            href="/restaurant/setup"
            className="menu-btn-primary inline-flex shrink-0"
          >
            Continue Setup
          </Link>
        </DashboardCard>
      ) : null}

      {showBi ? (
        <>
          <BusinessIntelligenceDashboard />
          {announcementsBlock}
          <DashboardCard delay={0.3} className="p-5 sm:p-6">
            <h2 className="font-serif text-xl font-bold text-white">
              Quick Actions
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Manage your restaurant in one click
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {QUICK_ACTIONS.map((action, index) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                    index === 0
                      ? "border-gold/15 bg-gold/5 text-gold hover:border-gold/30 hover:bg-gold/10"
                      : "border-white/10 text-white/70 hover:border-gold/20 hover:text-gold"
                  }`}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </DashboardCard>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 7 }).map((_, i) => (
                  <StatCardSkeleton key={i} />
                ))
              : kpis.map((kpi, index) => (
                  <DashboardCard
                    key={kpi.label}
                    delay={index * 0.05}
                    className="p-5 sm:p-6"
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/45 sm:text-[11px]">
                      {kpi.label}
                    </p>
                    <p
                      className={`mt-3 font-serif font-bold text-white ${
                        kpi.label === "Top Scanned QR"
                          ? "text-lg sm:text-xl"
                          : "text-3xl sm:text-4xl"
                      }`}
                    >
                      {kpi.value}
                    </p>
                  </DashboardCard>
                ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              {!loading && recentActivity.length > 0 ? (
                <ActivityFeed activities={recentActivity} />
              ) : (
                <DashboardCard
                  delay={0.15}
                  hover={false}
                  className="p-5 sm:p-6"
                >
                  <h2 className="font-serif text-xl font-bold text-white">
                    Recent Activity
                  </h2>
                  <p className="mt-1 text-sm text-white/45">
                    Scan activity will appear here once guests start using your
                    QR codes.
                  </p>
                </DashboardCard>
              )}

              {announcementsBlock}
            </div>

            <div className="space-y-6">
              <DashboardCard delay={0.3} className="p-5 sm:p-6">
                <h2 className="font-serif text-xl font-bold text-white">
                  Quick Actions
                </h2>
                <p className="mt-1 text-sm text-white/45">
                  Manage your restaurant in one click
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  {QUICK_ACTIONS.map((action, index) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                        index === 0
                          ? "border-gold/15 bg-gold/5 text-gold hover:border-gold/30 hover:bg-gold/10"
                          : "border-white/10 text-white/70 hover:border-gold/20 hover:text-gold"
                      }`}
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </DashboardCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
