"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { ExportMenu, exportFormatSuccessLabel } from "@/components/dashboard/ExportMenu";
import { useSubscriptionAccess } from "@/components/dashboard/SubscriptionAccessProvider";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { isAdminRole } from "@/lib/auth/roles";
import { getSafeRestaurantName } from "@/lib/restaurants/display";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { fetchBusinessIntelligence } from "@/lib/intelligence/bi";
import { generateRestaurantInsights } from "@/lib/intelligence/insights";
import { fetchMultiRestaurantAnalytics } from "@/lib/intelligence/multi-restaurant";
import {
  buildBiExportDataset,
} from "@/lib/export/datasets/bi";
import {
  formatMoney,
  resolveIntelligenceRange,
  type IntelligenceRangeId,
} from "@/lib/intelligence/ranges";
import type {
  BiDashboardData,
  MultiRestaurantRow,
  RestaurantInsight,
} from "@/lib/intelligence/types";
import {
  planAllowsAdvancedExport,
  planAllowsAiInsights,
  planAllowsBusinessIntelligence,
  planAllowsMultiRestaurantAnalytics,
} from "@/lib/subscriptions/plans";
import { IntelligenceDateFilter } from "./IntelligenceDateFilter";
import {
  IntelligenceBarChart,
  IntelligencePieLegend,
} from "./IntelligenceCharts";
import { RestaurantInsightsPanel } from "./RestaurantInsightsPanel";

const KPI_LABELS: Array<{ key: keyof BiDashboardData["kpis"]; label: string; money?: boolean }> = [
  { key: "revenueToday", label: "Revenue Today", money: true },
  { key: "revenueYesterday", label: "Revenue Yesterday", money: true },
  { key: "ordersToday", label: "Orders Today" },
  { key: "reservationsToday", label: "Reservations Today" },
  { key: "averageOrderValue", label: "Avg Order Value", money: true },
  { key: "returningCustomers", label: "Returning Customers" },
  { key: "newCustomers", label: "New Customers" },
  { key: "loyaltyMembers", label: "Loyalty Members" },
  { key: "pendingReservations", label: "Pending Reservations" },
  { key: "cancelledReservations", label: "Cancelled Reservations" },
  { key: "marketingCampaigns", label: "Campaigns" },
  { key: "customerGrowth", label: "Customer Growth" },
];

function formatKpiValue(
  key: keyof BiDashboardData["kpis"],
  data: BiDashboardData,
  money?: boolean,
): string {
  const raw = data.kpis[key];
  if (typeof raw === "string") return raw;
  if (money) return formatMoney(raw, data.kpis.currency);
  return String(raw);
}

export function BusinessIntelligenceDashboard() {
  const { showToast } = useToast();
  const { restaurant, restaurants, loading: restaurantLoading } = useRestaurant();
  const { access, loading: accessLoading } = useSubscriptionAccess();
  const { role, loading: authLoading } = useAuthUser();

  const [rangeId, setRangeId] = useState<IntelligenceRangeId>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [bi, setBi] = useState<BiDashboardData | null>(null);
  const [biLoading, setBiLoading] = useState(true);
  const [biError, setBiError] = useState<string | null>(null);
  const [insights, setInsights] = useState<RestaurantInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [multiRows, setMultiRows] = useState<MultiRestaurantRow[]>([]);
  const [ranking, setRanking] = useState<{
    bestPerforming: string | null;
    highestRevenue: string | null;
    highestOrders: string | null;
    highestReturning: string | null;
    highestRating: string | null;
  } | null>(null);
  const [multiLoading, setMultiLoading] = useState(false);

  const isAdmin = isAdminRole(role);
  const plan = access.locationPlan;
  const allowsBi = isAdmin || planAllowsBusinessIntelligence(plan);
  const allowsInsights = isAdmin || planAllowsAiInsights(plan);
  const allowsMulti =
    (isAdmin || planAllowsMultiRestaurantAnalytics(plan)) &&
    restaurants.length > 1;
  const allowsAdvancedExport = isAdmin || planAllowsAdvancedExport(plan);

  const dateRangeLabel = useMemo(() => {
    const range = resolveIntelligenceRange(
      rangeId,
      customStart,
      customEnd,
    );
    if (range.id === "custom" && customStart && customEnd) {
      return `${customStart}_to_${customEnd}`;
    }
    return range.label;
  }, [rangeId, customStart, customEnd]);

  const getBiExportDataset = useCallback(() => {
    if (!bi || !restaurant) {
      throw new Error("Report data is not ready.");
    }
    return buildBiExportDataset({
      bi,
      restaurantName: getSafeRestaurantName(restaurant),
      dateRangeLabel,
      multiRestaurantRows: allowsMulti ? multiRows : [],
    });
  }, [bi, restaurant, dateRangeLabel, allowsMulti, multiRows]);

  const loadBi = useCallback(async () => {
    if (!restaurant?.id || !allowsBi) {
      setBiLoading(false);
      return;
    }
    setBiLoading(true);
    setBiError(null);
    const result = await fetchBusinessIntelligence({
      restaurantId: restaurant.id,
      rangeId,
      customStart: rangeId === "custom" ? customStart : null,
      customEnd: rangeId === "custom" ? customEnd : null,
    });
    setBiLoading(false);
    if (!result.ok) {
      setBi(null);
      setBiError(result.message);
      return;
    }
    setBi(result.data);
  }, [restaurant?.id, allowsBi, rangeId, customStart, customEnd]);

  const loadInsights = useCallback(async () => {
    if (!restaurant?.id || !allowsInsights) {
      setInsights([]);
      return;
    }
    setInsightsLoading(true);
    const result = await generateRestaurantInsights(
      restaurant.id,
      getSafeRestaurantName(restaurant),
    );
    setInsightsLoading(false);
    setInsights(result.ok ? result.data : []);
  }, [restaurant?.id, restaurant?.restaurant_name, allowsInsights]);

  const loadMulti = useCallback(async () => {
    if (!allowsMulti) {
      setMultiRows([]);
      setRanking(null);
      return;
    }
    setMultiLoading(true);
    const result = await fetchMultiRestaurantAnalytics({
      restaurantIds: restaurants.map((r) => r.id),
      rangeId,
      customStart: rangeId === "custom" ? customStart : null,
      customEnd: rangeId === "custom" ? customEnd : null,
    });
    setMultiLoading(false);
    if (!result.ok) {
      setMultiRows([]);
      setRanking(null);
      return;
    }
    setMultiRows(result.data.rows);
    setRanking(result.data.ranking);
  }, [allowsMulti, restaurants, rangeId, customStart, customEnd]);

  useEffect(() => {
    void loadBi();
  }, [loadBi]);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  useEffect(() => {
    void loadMulti();
  }, [loadMulti]);

  if (accessLoading || authLoading || restaurantLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!allowsBi) {
    return (
      <DashboardCard className="p-6 sm:p-8" hover={false}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
          Business Intelligence
        </p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-white">
          Upgrade to unlock BI
        </h2>
        <p className="mt-2 max-w-xl text-sm text-white/55">
          Business Intelligence dashboards, charts, and performance insights are
          available on Professional and Enterprise plans.
        </p>
        <Link href="/dashboard/subscription" className="menu-btn-primary mt-5 inline-flex">
          View plans
        </Link>
      </DashboardCard>
    );
  }

  if (!restaurant) {
    return (
      <DashboardCard className="p-8 text-center" hover={false}>
        <p className="text-sm text-white/50">
          Complete restaurant setup to view business intelligence.
        </p>
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold text-white sm:text-2xl">
            Business Intelligence
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Revenue, orders, guests, and performance for{" "}
            {getSafeRestaurantName(restaurant)}.
          </p>
        </div>
        <ExportMenu
          getDataset={getBiExportDataset}
          disabled={!bi}
          isFormatAllowed={(format) =>
            format === "csv" || allowsAdvancedExport
          }
          onEmpty={() =>
            showToast("No data matches the current filters.", "error")
          }
          onError={(message) => showToast(message, "error")}
          onSuccess={(format) =>
            showToast(
              format === "pdf"
                ? exportFormatSuccessLabel(format)
                : "✓ Export ready",
            )
          }
        />
      </div>

      <DashboardCard className="p-4 sm:p-5" hover={false}>
        <IntelligenceDateFilter
          value={rangeId}
          onChange={setRangeId}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStart={setCustomStart}
          onCustomEnd={setCustomEnd}
        />
      </DashboardCard>

      {biError ? (
        <DashboardCard className="p-8 text-center" hover={false}>
          <p className="text-sm text-white/50">{biError}</p>
          <button
            type="button"
            className="menu-btn-primary mt-4"
            onClick={() => void loadBi()}
          >
            Try again
          </button>
        </DashboardCard>
      ) : biLoading || !bi ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {KPI_LABELS.map((kpi, index) => (
              <DashboardCard key={kpi.key} delay={index * 0.03} className="p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/45">
                  {kpi.label}
                </p>
                <p className="mt-3 font-serif text-2xl font-bold text-white sm:text-3xl">
                  {formatKpiValue(kpi.key, bi, kpi.money)}
                </p>
              </DashboardCard>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardCard className="p-5 sm:p-6" hover={false}>
              <h3 className="font-serif text-lg font-bold text-white">Revenue</h3>
              <p className="mt-1 text-sm text-white/45">{bi.range.label}</p>
              <div className="mt-4">
                <IntelligenceBarChart points={bi.revenueSeries} />
              </div>
            </DashboardCard>
            <DashboardCard className="p-5 sm:p-6" hover={false}>
              <h3 className="font-serif text-lg font-bold text-white">Orders</h3>
              <p className="mt-1 text-sm text-white/45">{bi.range.label}</p>
              <div className="mt-4">
                <IntelligenceBarChart points={bi.ordersSeries} />
              </div>
            </DashboardCard>
            <DashboardCard className="p-5 sm:p-6" hover={false}>
              <h3 className="font-serif text-lg font-bold text-white">
                Reservations
              </h3>
              <p className="mt-1 text-sm text-white/45">{bi.range.label}</p>
              <div className="mt-4">
                <IntelligenceBarChart points={bi.reservationsSeries} />
              </div>
            </DashboardCard>
            <DashboardCard className="p-5 sm:p-6" hover={false}>
              <h3 className="font-serif text-lg font-bold text-white">
                Category mix
              </h3>
              <p className="mt-1 text-sm text-white/45">By quantity sold</p>
              <div className="mt-4">
                <IntelligencePieLegend points={bi.categoryPie} />
              </div>
            </DashboardCard>
            <DashboardCard className="p-5 sm:p-6" hover={false}>
              <h3 className="font-serif text-lg font-bold text-white">
                Top items
              </h3>
              <p className="mt-1 text-sm text-white/45">Quantity sold</p>
              <div className="mt-4">
                <IntelligenceBarChart points={bi.topItemsBar} />
              </div>
            </DashboardCard>
            <DashboardCard className="p-5 sm:p-6" hover={false}>
              <h3 className="font-serif text-lg font-bold text-white">
                Customer growth
              </h3>
              <p className="mt-1 text-sm text-white/45">New customers by day</p>
              <div className="mt-4">
                <IntelligenceBarChart points={bi.customerGrowthSeries} />
              </div>
            </DashboardCard>
          </div>

          <DashboardCard className="p-5 sm:p-6" hover={false}>
            <h3 className="font-serif text-xl font-bold text-white">
              Performance
            </h3>
            <p className="mt-1 text-sm text-white/45">
              Avg spend {formatMoney(bi.performance.averageSpend, bi.kpis.currency)} ·
              Repeat {bi.performance.repeatCustomerPct}% · First-time{" "}
              {bi.performance.firstTimeCustomerPct}%
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <PerformanceList
                title="Top items"
                rows={bi.performance.topItems}
                currency={bi.kpis.currency}
              />
              <PerformanceList
                title="Needs attention"
                rows={bi.performance.worstItems}
                currency={bi.kpis.currency}
              />
              <PerformanceList
                title="Top categories"
                rows={bi.performance.topCategories}
                currency={bi.kpis.currency}
              />
            </div>
          </DashboardCard>
        </>
      )}

      {allowsInsights ? (
        <RestaurantInsightsPanel insights={insights} loading={insightsLoading} />
      ) : null}

      {allowsMulti ? (
        <DashboardCard className="p-5 sm:p-6" hover={false}>
          <h3 className="font-serif text-xl font-bold text-white">
            Multi-restaurant comparison
          </h3>
          <p className="mt-1 text-sm text-white/45">
            Enterprise analytics across your restaurants.
          </p>
          {multiLoading ? (
            <p className="py-8 text-center text-sm text-white/45">Loading…</p>
          ) : multiRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/45">
              No multi-restaurant data yet.
            </p>
          ) : (
            <>
              {ranking ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    ["Best overall", ranking.bestPerforming],
                    ["Highest revenue", ranking.highestRevenue],
                    ["Most orders", ranking.highestOrders],
                    ["Loyalty leaders", ranking.highestReturning],
                    ["Top rated", ranking.highestRating],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-white/40">
                        {label}
                      </p>
                      <p className="mt-1 truncate text-sm text-gold">
                        {value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-white/40">
                    <tr>
                      <th className="px-3 py-2 font-medium">Restaurant</th>
                      <th className="px-3 py-2 font-medium">Revenue</th>
                      <th className="px-3 py-2 font-medium">Orders</th>
                      <th className="px-3 py-2 font-medium">Reservations</th>
                      <th className="px-3 py-2 font-medium">Customers</th>
                      <th className="px-3 py-2 font-medium">Loyalty</th>
                      <th className="px-3 py-2 font-medium">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {multiRows.map((row) => (
                      <tr
                        key={row.restaurantId}
                        className="border-t border-white/5 text-white/75"
                      >
                        <td className="px-3 py-2.5 text-white">
                          {row.restaurantName}
                        </td>
                        <td className="px-3 py-2.5">
                          {formatMoney(row.revenue)}
                        </td>
                        <td className="px-3 py-2.5">{row.orders}</td>
                        <td className="px-3 py-2.5">{row.reservations}</td>
                        <td className="px-3 py-2.5">{row.customers}</td>
                        <td className="px-3 py-2.5">{row.loyaltyMembers}</td>
                        <td className="px-3 py-2.5">
                          {row.averageRating != null
                            ? `${row.averageRating} (${row.reviewCount})`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </DashboardCard>
      ) : null}
    </div>
  );
}

function PerformanceList({
  title,
  rows,
  currency,
}: {
  title: string;
  rows: Array<{ name: string; quantity: number; revenue: number }>;
  currency: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-white/45">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.slice(0, 5).map((row) => (
            <li
              key={row.name}
              className="flex items-start justify-between gap-2 text-sm"
            >
              <span className="truncate text-white/80">{row.name}</span>
              <span className="shrink-0 text-white/45">
                {row.quantity} · {formatMoney(row.revenue, currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
