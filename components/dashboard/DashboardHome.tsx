"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { fetchCategories } from "@/lib/categories/fetchCategories";
import { formatPrice } from "@/lib/dashboard/menu/utils";
import type { DashboardMenuItem } from "@/lib/dashboard/menu/types";
import type { ActivityItem } from "@/lib/dashboard/types";
import { formatDemoDateTime } from "@/lib/demo-requests/utils";
import { fetchOrders } from "@/lib/orders/fetchOrders";
import type { Order } from "@/lib/orders/types";
import { fetchMenuItems } from "@/lib/menu-items/fetchMenuItems";
import { fetchQrCodes } from "@/lib/qr-codes/fetchQrCodes";
import {
  fetchAnalyticsDashboard,
  type AnalyticsDashboardData,
} from "@/lib/qr-analytics";
import { fetchReservationsByRestaurant } from "@/lib/reservations/fetchReservations";
import type { ReservationItem } from "@/lib/reservations/types";
import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import type { Restaurant } from "@/lib/restaurants/types";
import { supabase } from "@/lib/supabase";
import { ActivityFeed } from "./ActivityFeed";
import { AnalyticsDailyChart } from "./analytics/AnalyticsDailyChart";
import { OrderStatusBadge } from "./orders/OrderStatusBadge";
import { useSubscriptionAccess } from "./SubscriptionAccessProvider";
import { DashboardCard } from "./ui/DashboardCard";

type Announcement = {
  id: string;
  title?: string | null;
  message?: string | null;
  created_at?: string | null;
};

type DashboardData = {
  restaurant: Restaurant | null;
  qrCount: number;
  menuCount: number;
  categoryCount: number;
  analytics: AnalyticsDashboardData | null;
  announcements: Announcement[];
  orders: Order[];
  reservations: ReservationItem[];
  menuItems: DashboardMenuItem[];
};

const EMPTY_DATA: DashboardData = {
  restaurant: null,
  qrCount: 0,
  menuCount: 0,
  categoryCount: 0,
  analytics: null,
  announcements: [],
  orders: [],
  reservations: [],
  menuItems: [],
};

const QUICK_ACTIONS = [
  { label: "Create QR Code", href: "/dashboard/qr-codes", hint: "Generate table codes" },
  { label: "Add Menu Item", href: "/dashboard/menu-items", hint: "Grow your menu" },
  { label: "Add Category", href: "/dashboard/categories", hint: "Organize dishes" },
  { label: "Reservations", href: "/dashboard/reservations", hint: "Manage bookings" },
  { label: "Orders", href: "/dashboard/orders", hint: "Track kitchen flow" },
  { label: "Analytics", href: "/dashboard/analytics", hint: "Scan insights" },
  { label: "Settings", href: "/dashboard/settings", hint: "Brand & profile" },
  { label: "Support", href: "/dashboard/support", hint: "Get help" },
] as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

async function fetchPublishedAnnouncements(): Promise<Announcement[]> {
  try {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("status", "Published")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) return [];
    return (data ?? []) as Announcement[];
  } catch {
    return [];
  }
}

function isSameDay(iso: string, day = new Date()) {
  const d = new Date(iso);
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  );
}

function greetingForHour(hour: number) {
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function MiniSparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="mt-4 flex h-10 items-end gap-0.5" aria-hidden="true">
      {values.map((value, index) => (
        <motion.div
          key={index}
          className="flex-1 rounded-t-sm bg-gradient-to-t from-gold/25 to-gold"
          initial={{ height: 0 }}
          animate={{ height: `${Math.max((value / max) * 100, 8)}%` }}
          transition={{ duration: 0.45, delay: index * 0.03, ease: easeOut }}
        />
      ))}
    </div>
  );
}

function EmptyBlock({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gold/20 bg-black/20 px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold">
        ✦
      </div>
      <p className="font-serif text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-white/45">{description}</p>
      <Link
        href={href}
        className="mt-5 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition-colors hover:border-gold/50 hover:bg-gold/15"
      >
        {cta}
      </Link>
    </div>
  );
}

function HealthRing({ percent }: { percent: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="relative mx-auto h-24 w-24">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
        />
        <motion.circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="url(#healthGold)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: easeOut }}
        />
        <defs>
          <linearGradient id="healthGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8c547" />
            <stop offset="100%" stopColor="#b8942e" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-serif text-xl font-bold text-gold">{percent}%</span>
      </div>
    </div>
  );
}

function buildRecentActivity(
  analytics: AnalyticsDashboardData | null,
  orders: Order[],
  reservations: ReservationItem[],
  menuCount: number,
  qrCount: number,
): ActivityItem[] {
  const activities: ActivityItem[] = [];

  for (const order of orders.slice(0, 3)) {
    activities.push({
      id: `order-${order.id}`,
      title: `Order ${order.orderNumber}`,
      description: `${order.customerName || "Guest"} · ${formatPrice(order.grandTotal)}`,
      time: formatDemoDateTime(order.createdAt),
      type: "order",
    });
  }

  for (const reservation of reservations.slice(0, 2)) {
    activities.push({
      id: `res-${reservation.id}`,
      title: "Reservation received",
      description: `${reservation.customerName} · ${reservation.guests} guests · ${reservation.reservationDate}`,
      time: reservation.reservationTime,
      type: "update",
    });
  }

  if (analytics?.overview.scansToday) {
    activities.push({
      id: "scans-today",
      title: "Today's scans",
      description: `${analytics.overview.scansToday} QR scan${analytics.overview.scansToday === 1 ? "" : "s"} recorded today.`,
      time: "Today",
      type: "scan",
    });
  }

  if (qrCount > 0) {
    activities.push({
      id: "qr-ready",
      title: "QR codes active",
      description: `${qrCount} QR code${qrCount === 1 ? "" : "s"} ready for guests.`,
      time: "Setup",
      type: "view",
    });
  }

  if (menuCount > 0) {
    activities.push({
      id: "menu-ready",
      title: "Menu updated",
      description: `${menuCount} menu item${menuCount === 1 ? "" : "s"} published on your digital menu.`,
      time: "Setup",
      type: "update",
    });
  }

  return activities.slice(0, 8);
}

export function DashboardHome() {
  const { displayName } = useAuthUser();
  const { access } = useSubscriptionAccess();
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    const restaurantPromise = fetchUserRestaurant();
    const analyticsPromise = restaurantPromise.then((restaurant) =>
      restaurant?.id
        ? fetchAnalyticsDashboard(restaurant.id, restaurant.timezone)
        : Promise.resolve({ ok: false as const, message: "" }),
    );
    const ordersPromise = restaurantPromise.then((restaurant) =>
      restaurant?.id
        ? fetchOrders(restaurant.id)
        : Promise.resolve({ ok: true as const, data: [] as Order[] }),
    );
    const reservationsPromise = restaurantPromise.then((restaurant) =>
      restaurant?.id
        ? fetchReservationsByRestaurant(restaurant.id)
        : Promise.resolve({ ok: true as const, data: [] as ReservationItem[] }),
    );

    const [
      restaurant,
      qrResult,
      menuResult,
      categoriesResult,
      analyticsResult,
      announcements,
      ordersResult,
      reservationsResult,
    ] = await Promise.all([
      restaurantPromise,
      fetchQrCodes(),
      fetchMenuItems(),
      fetchCategories(),
      analyticsPromise,
      fetchPublishedAnnouncements(),
      ordersPromise,
      reservationsPromise,
    ]);

    setData({
      restaurant,
      qrCount: qrResult.ok ? qrResult.data.length : 0,
      menuCount: menuResult.ok ? menuResult.data.length : 0,
      categoryCount: categoriesResult.ok ? categoriesResult.data.length : 0,
      analytics: analyticsResult.ok ? analyticsResult.data : null,
      announcements,
      orders: ordersResult.ok ? ordersResult.data : [],
      reservations: reservationsResult.ok ? reservationsResult.data : [],
      menuItems: menuResult.ok ? menuResult.data : [],
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const restaurantName =
    data.restaurant?.restaurant_name?.trim() || "Your Restaurant";
  const isActive = Boolean(data.restaurant?.is_active ?? data.restaurant?.restaurant_name?.trim());
  const analytics = data.analytics;
  const firstName = displayName?.split(" ")[0] || "there";

  const todayOrders = useMemo(
    () => data.orders.filter((order) => isSameDay(order.createdAt)),
    [data.orders],
  );
  const pendingOrders = todayOrders.filter(
    (order) =>
      order.status === "Pending" ||
      order.status === "Accepted" ||
      order.status === "Preparing",
  ).length;
  const completedOrders = todayOrders.filter(
    (order) => order.status === "Completed" || order.status === "Ready",
  ).length;

  const todayReservations = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return data.reservations.filter((item) => item.reservationDate === today);
  }, [data.reservations]);

  const upcomingReservations = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return data.reservations.filter(
      (item) =>
        item.reservationDate >= today &&
        item.status !== "Cancelled" &&
        item.status !== "Completed" &&
        item.status !== "No Show",
    );
  }, [data.reservations]);

  const revenueToday = useMemo(
    () => todayOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0),
    [todayOrders],
  );

  const revenueMonth = useMemo(() => {
    const nowDate = new Date();
    return data.orders
      .filter((order) => {
        const d = new Date(order.createdAt);
        return (
          d.getFullYear() === nowDate.getFullYear() &&
          d.getMonth() === nowDate.getMonth()
        );
      })
      .reduce((sum, order) => sum + (order.grandTotal || 0), 0);
  }, [data.orders]);

  const sparkline = useMemo(() => {
    const points = analytics?.dailyScans?.slice(-12) ?? [];
    if (points.length === 0) return [2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9];
    return points.map((point) => point.scans);
  }, [analytics]);

  const popularItems = useMemo(() => {
    const counts = new Map<string, { name: string; image: string; count: number }>();

    for (const order of data.orders) {
      for (const item of order.items) {
        const key = item.menuItemId || item.itemName;
        const existing = counts.get(key);
        if (existing) {
          existing.count += item.quantity;
        } else {
          const menuMatch = data.menuItems.find(
            (menuItem) =>
              menuItem.id === item.menuItemId ||
              menuItem.nameEn === item.itemName,
          );
          counts.set(key, {
            name: item.itemName,
            image: menuMatch?.image || "",
            count: item.quantity,
          });
        }
      }
    }

    const ranked = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 5);
    if (ranked.length > 0) return ranked;

    return data.menuItems
      .filter((item) => item.popular || item.chefSpecial || item.recommended)
      .slice(0, 5)
      .map((item) => ({
        name: item.nameEn,
        image: item.image,
        count: 0,
      }));
  }, [data.menuItems, data.orders]);

  const healthChecks = useMemo(() => {
    const restaurant = data.restaurant;
    return [
      {
        label: "Menu complete",
        done: data.menuCount > 0,
      },
      {
        label: "QR active",
        done: data.qrCount > 0,
      },
      {
        label: "Payments connected",
        done: Boolean(restaurant?.online_ordering_enabled),
      },
      {
        label: "Google Maps added",
        done: Boolean(restaurant?.google_maps_url?.trim()),
      },
      {
        label: "Logo uploaded",
        done: Boolean(restaurant?.logo_url?.trim()),
      },
    ];
  }, [data.menuCount, data.qrCount, data.restaurant]);

  const healthPercent = Math.round(
    (healthChecks.filter((item) => item.done).length / healthChecks.length) * 100,
  );

  const recentActivity = useMemo(
    () =>
      buildRecentActivity(
        analytics,
        data.orders,
        data.reservations,
        data.menuCount,
        data.qrCount,
      ),
    [analytics, data.menuCount, data.orders, data.qrCount, data.reservations],
  );

  const daysLeft =
    access.trialDaysLeft ?? access.graceDaysLeft ?? null;

  const recentOrders = data.orders.slice(0, 6);

  return (
    <div className="relative mx-auto max-w-[1400px] space-y-8 pb-8">
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-gold/[0.05] blur-3xl" />
        <div className="absolute right-0 top-40 h-64 w-64 rounded-full bg-gold/[0.04] blur-3xl" />
      </div>

      {/* Greeting header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: easeOut }}
        className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {greetingForHour(now.getHours())}, {firstName}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {loading ? "Dashboard Overview" : "Welcome back"}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm">
            <span className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 font-medium text-gold">
              {restaurantName}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60">
              {access.plan} plan
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${
                isActive
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-white/5 text-white/45"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? "bg-emerald-400" : "bg-white/30"
                }`}
              />
              {isActive ? "Online" : "Setup incomplete"}
            </span>
          </div>
        </div>
        <div className="text-start lg:text-end">
          <p className="text-xs uppercase tracking-[0.16em] text-white/35">
            Local time
          </p>
          <p className="mt-1 font-serif text-xl text-white/80">
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="mt-0.5 text-xs text-white/40">
            {now.toLocaleDateString([], {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </motion.div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <DashboardCard delay={0.05} className="rounded-3xl border border-gold/20 p-5 sm:p-6">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/45">
                QR Scans Today
              </p>
              <p className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">
                <AnimatedCounter value={analytics?.overview.scansToday ?? 0} />
              </p>
              <p className="mt-2 text-sm text-emerald-400">
                {analytics?.overview.scansThisWeek ?? 0} this week
              </p>
              <MiniSparkline values={sparkline} />
            </DashboardCard>

            <DashboardCard delay={0.1} className="rounded-3xl border border-gold/20 p-5 sm:p-6">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/45">
                Orders Today
              </p>
              <p className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">
                <AnimatedCounter value={todayOrders.length} />
              </p>
              <p className="mt-2 text-sm text-white/50">
                <span className="text-amber-300">{pendingOrders} pending</span>
                {" · "}
                <span className="text-emerald-400">{completedOrders} done</span>
              </p>
              <p className="mt-3 text-xs text-white/35">
                {data.orders.length} total orders recorded
              </p>
            </DashboardCard>

            <DashboardCard delay={0.15} className="rounded-3xl border border-gold/20 p-5 sm:p-6">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/45">
                Reservations
              </p>
              <p className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">
                <AnimatedCounter value={todayReservations.length} />
              </p>
              <p className="mt-2 text-sm text-gold/90">
                {upcomingReservations.length} upcoming
              </p>
              <p className="mt-3 text-xs text-white/35">
                Today&apos;s bookings &amp; confirmed guests
              </p>
            </DashboardCard>

            <DashboardCard delay={0.2} className="rounded-3xl border border-gold/20 p-5 sm:p-6">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/45">
                Revenue
              </p>
              <p className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">
                {formatPrice(revenueToday)}
              </p>
              <p className="mt-2 text-sm text-white/50">
                Today ·{" "}
                <span className="text-gold">
                  {formatPrice(revenueMonth)} this month
                </span>
              </p>
              <MiniSparkline
                values={
                  data.orders.length
                    ? [
                        ...data.orders
                          .slice(0, 12)
                          .map((order) => order.grandTotal)
                          .reverse(),
                      ]
                    : sparkline
                }
              />
            </DashboardCard>
          </>
        )}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          {/* Weekly analytics */}
          <DashboardCard delay={0.22} hover={false} className="rounded-3xl border border-gold/20 p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-white sm:text-2xl">
                  Weekly Analytics
                </h2>
                <p className="mt-1 text-sm text-white/45">
                  QR scans across the selected period
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-gold">
                  Scans {analytics?.overview.scansThisWeek ?? 0}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/55">
                  Orders {todayOrders.length}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/55">
                  Reservations {todayReservations.length}
                </span>
              </div>
            </div>
            {!loading && analytics?.dailyScans?.length ? (
              <AnalyticsDailyChart data={analytics.dailyScans} />
            ) : (
              <div className="mt-6">
                <EmptyBlock
                  title="No scan data yet"
                  description="Create a QR code and share your menu to start seeing weekly analytics."
                  href="/dashboard/qr-codes"
                  cta="Create Your First QR"
                />
              </div>
            )}
          </DashboardCard>

          {/* Recent orders */}
          <DashboardCard delay={0.28} hover={false} className="rounded-3xl border border-gold/20 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-white sm:text-2xl">
                  Recent Orders
                </h2>
                <p className="mt-1 text-sm text-white/45">
                  Latest customer orders from your digital menu
                </p>
              </div>
              <Link
                href="/dashboard/orders"
                className="text-sm text-gold/80 transition-colors hover:text-gold"
              >
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <EmptyBlock
                title="No Orders Yet"
                description="When guests order from your QR menu, they’ll appear here instantly."
                href="/dashboard/menu-items"
                cta="Add Your First Menu Item"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-white/35">
                      <th className="pb-3 font-medium">Customer</th>
                      <th className="pb-3 font-medium">Items</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-white/[0.05] last:border-0"
                      >
                        <td className="py-3.5 pr-3">
                          <p className="text-sm font-medium text-white">
                            {order.customerName || "Guest"}
                          </p>
                          <p className="text-xs text-white/35">
                            {order.orderNumber}
                          </p>
                        </td>
                        <td className="py-3.5 pr-3 text-sm text-white/60">
                          {order.items.length} item
                          {order.items.length === 1 ? "" : "s"}
                        </td>
                        <td className="py-3.5 pr-3 text-sm font-semibold text-gold">
                          {formatPrice(order.grandTotal)}
                        </td>
                        <td className="py-3.5 pr-3">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="py-3.5 text-xs text-white/40">
                          {formatDemoDateTime(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardCard>

          {/* Popular items */}
          <DashboardCard delay={0.32} hover={false} className="rounded-3xl border border-gold/20 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-white sm:text-2xl">
                  Popular Menu Items
                </h2>
                <p className="mt-1 text-sm text-white/45">
                  Top dishes based on recent order volume
                </p>
              </div>
              <Link
                href="/dashboard/menu-items"
                className="text-sm text-gold/80 transition-colors hover:text-gold"
              >
                Manage →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
                ))}
              </div>
            ) : popularItems.length === 0 ? (
              <EmptyBlock
                title="Add Your First Menu Item"
                description="Popular dishes will appear here once guests start ordering."
                href="/dashboard/menu-items"
                cta="Add Menu Item"
              />
            ) : (
              <ul className="space-y-3">
                {popularItems.map((item, index) => (
                  <li
                    key={`${item.name}-${index}`}
                    className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 p-3"
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-sm text-gold">
                        {index + 1}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-white/40">
                        {item.count > 0
                          ? `${item.count} order${item.count === 1 ? "" : "s"}`
                          : "Featured item"}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-emerald-400">
                      {item.count > 0 ? "Trending" : "Highlighted"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>
        </div>

        {/* Right column */}
        <div className="space-y-6 xl:col-span-4">
          <DashboardCard delay={0.24} className="rounded-3xl border border-gold/20 p-5 sm:p-6">
            <h2 className="font-serif text-xl font-bold text-white">
              Quick Actions
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Jump into everyday restaurant tasks
            </p>
            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
              {QUICK_ACTIONS.map((action, index) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`rounded-2xl border px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 ${
                    index === 0
                      ? "border-gold/25 bg-gold/10 text-gold"
                      : "border-white/10 bg-black/20 text-white/75 hover:text-gold"
                  }`}
                >
                  <span className="block text-sm font-medium">{action.label}</span>
                  <span className="mt-0.5 block text-xs text-white/35">
                    {action.hint}
                  </span>
                </Link>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard delay={0.28} className="rounded-3xl border border-gold/20 p-5 sm:p-6">
            <h2 className="font-serif text-xl font-bold text-white">
              Subscription Status
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Current plan and billing health
            </p>
            <div className="mt-5 rounded-2xl border border-gold/20 bg-gold/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-gold/70">
                    Plan
                  </p>
                  <p className="mt-1 font-serif text-2xl font-bold text-white">
                    {access.plan}
                  </p>
                </div>
                <span className="rounded-full border border-gold/30 bg-black/30 px-3 py-1 text-xs capitalize text-gold">
                  {access.effectiveStatus}
                </span>
              </div>
              <div className="mt-4">
                <div className="mb-2 flex justify-between text-xs text-white/45">
                  <span>Usage / period</span>
                  <span>
                    {daysLeft != null ? `${daysLeft} days remaining` : "Active"}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#b8942e] via-gold to-[#e8c547]"
                    style={{
                      width: `${
                        daysLeft != null
                          ? Math.min(Math.max((daysLeft / 30) * 100, 8), 100)
                          : 72
                      }%`,
                    }}
                  />
                </div>
              </div>
              <Link
                href="/dashboard/subscription"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#e8c547] via-gold to-[#b8942e] px-4 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.01]"
              >
                Renew / Manage Billing
              </Link>
            </div>
          </DashboardCard>

          <DashboardCard delay={0.32} hover={false} className="rounded-3xl border border-gold/20 p-5 sm:p-6">
            <h2 className="font-serif text-xl font-bold text-white">
              Announcements
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Latest platform updates
            </p>
            {data.announcements.length === 0 ? (
              <p className="mt-5 rounded-2xl border border-white/5 bg-black/20 px-4 py-6 text-center text-sm text-white/40">
                No announcements right now. You’re all caught up.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {data.announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="rounded-2xl border border-white/5 bg-black/20 p-4"
                  >
                    <p className="font-medium text-white">
                      {announcement.title ?? "Announcement"}
                    </p>
                    {announcement.message ? (
                      <p className="mt-1 text-sm text-white/50">
                        {announcement.message}
                      </p>
                    ) : null}
                    {announcement.created_at ? (
                      <p className="mt-2 text-xs text-white/35">
                        {formatDemoDateTime(announcement.created_at)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>

          <DashboardCard delay={0.36} className="rounded-3xl border border-gold/20 p-5 sm:p-6">
            <h2 className="font-serif text-xl font-bold text-white">
              Restaurant Health
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Setup checklist for a polished guest experience
            </p>
            <div className="mt-5">
              <HealthRing percent={healthPercent} />
            </div>
            <ul className="mt-5 space-y-2.5">
              {healthChecks.map((check) => (
                <li
                  key={check.label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5 text-sm"
                >
                  <span className="text-white/70">{check.label}</span>
                  <span
                    className={
                      check.done ? "text-emerald-400" : "text-white/30"
                    }
                  >
                    {check.done ? "✓" : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </DashboardCard>
        </div>
      </div>

      {/* Activity timeline */}
      <div>
        {!loading && recentActivity.length > 0 ? (
          <ActivityFeed activities={recentActivity} />
        ) : (
          <DashboardCard delay={0.4} hover={false} className="rounded-3xl border border-gold/20 p-5 sm:p-6">
            <h2 className="font-serif text-xl font-bold text-white">
              Activity Timeline
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Orders, reservations, scans, and setup events will land here.
            </p>
            <div className="mt-6">
              <EmptyBlock
                title="No activity yet"
                description="Generate a QR code or publish menu items to start your timeline."
                href="/dashboard/qr-codes"
                cta="Create Your First QR"
              />
            </div>
          </DashboardCard>
        )}
      </div>
    </div>
  );
}
