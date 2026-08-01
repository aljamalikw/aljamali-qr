"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  fetchAdminAnalytics,
  type AdminAnalyticsData,
} from "@/lib/admin/analytics";
import { formatPaymentAmount } from "@/lib/admin/payments";
import { buildCsv, csvTimestamp, downloadCsv } from "@/lib/utils/csv";

function BarList({
  items,
  labelKey,
  valueKey,
}: {
  items: { [key: string]: string | number }[];
  labelKey: string;
  valueKey: string;
}) {
  const max = Math.max(
    1,
    ...items.map((item) => Number(item[valueKey] ?? 0)),
  );
  if (items.length === 0) {
    return <p className="text-sm text-white/45">No data yet.</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const value = Number(item[valueKey] ?? 0);
        const width = `${Math.round((value / max) * 100)}%`;
        return (
          <div key={String(item[labelKey])}>
            <div className="mb-1 flex justify-between text-xs text-white/50">
              <span>{String(item[labelKey])}</span>
              <span>{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gold/80"
                style={{ width }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AdminAnalyticsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchAdminAnalytics();
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      setData(null);
      return;
    }
    setData(result.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const maxDaily = Math.max(
    1,
    ...(data?.dailyScans.map((d) => d.count) ?? [1]),
  );
  const maxRegs = Math.max(
    1,
    ...(data?.restaurantsOverTime.map((d) => d.count) ?? [1]),
  );

  const handleExport = () => {
    if (!data) {
      showToast("No analytics data available to export", "error");
      return;
    }
    const summaryCsv = buildCsv(
      ["Metric", "Value"],
      [
        ["Demo Conversion Rate", `${data.conversionRate}%`],
        ["Active Restaurants", String(data.activeRestaurants)],
        ["Total Restaurants", String(data.totalRestaurants)],
        ["New Registrations (30d)", String(data.newRegistrations30d)],
        ["Growth %", String(data.growthPercent)],
        ["Trial Conversion Rate", `${data.trialConversionRate}%`],
        ["QR Scans (all time)", String(data.totalScans)],
        ["Scans (30 days)", String(data.scansLast30Days)],
        ["Active Subscriptions", String(data.activeSubscriptions)],
        ["Expired Subscriptions", String(data.expiredSubscriptions)],
        ["Suspended Subscriptions", String(data.suspendedSubscriptions)],
        ["MRR (KWD)", data.mrr.toFixed(3)],
        ["ARR (KWD)", data.arr.toFixed(3)],
        ["Monthly Revenue (KWD)", data.monthlyRevenue.toFixed(3)],
        ["Average Menu Size", String(data.averageMenuSize)],
        ["Average QR Scans", String(data.averageQrScans)],
        ["Reservations", String(data.reservationsTotal)],
        ["Orders", String(data.ordersTotal)],
        ["Demos Total", String(data.demosTotal)],
        ["Demos Converted", String(data.demosConverted)],
      ],
    );
    downloadCsv(`platform-analytics-${csvTimestamp()}.csv`, summaryCsv);
    showToast("Exported analytics summary");
  };

  return (
    <AdminPlaceholder
      title="Analytics"
      description="Platform-wide performance for demos, restaurants, scans and revenue."
    >
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-sm text-white/50">{error}</p>
          <button
            type="button"
            className="menu-btn-primary mt-6"
            onClick={() => void load()}
          >
            Try Again
          </button>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleExport}
              className="menu-btn-secondary"
            >
              Export CSV
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Restaurants", String(data.totalRestaurants)],
              ["Active", String(data.activeRestaurants)],
              ["New Registrations", String(data.newRegistrations30d)],
              ["Growth %", `${data.growthPercent}%`],
              ["Trial Conversions", `${data.trialConversionRate}%`],
              ["Active Subscriptions", String(data.activeSubscriptions)],
              ["Expired", String(data.expiredSubscriptions)],
              ["Suspended", String(data.suspendedSubscriptions)],
              ["MRR", formatPaymentAmount(data.mrr, "KWD")],
              ["ARR", formatPaymentAmount(data.arr, "KWD")],
              ["Revenue (month)", formatPaymentAmount(data.monthlyRevenue, "KWD")],
              ["Avg Menu Size", String(data.averageMenuSize)],
              ["Avg QR Scans", String(data.averageQrScans)],
              ["Reservations", String(data.reservationsTotal)],
              ["Orders", String(data.ordersTotal)],
              ["Demo Conversion", `${data.conversionRate}%`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-gold/15 bg-black/25 p-5"
              >
                <p className="text-xs uppercase tracking-[0.15em] text-white/40">
                  {label}
                </p>
                <p className="mt-3 font-serif text-3xl text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gold/15 bg-black/25 p-5">
              <h3 className="font-serif text-xl text-white">
                QR scans · last 30 days
              </h3>
              <div className="mt-4 flex h-40 items-end gap-1">
                {data.dailyScans.map((day) => (
                  <div
                    key={day.date}
                    className="flex-1 rounded-t bg-gold/70"
                    style={{
                      height: `${Math.max(4, Math.round((day.count / maxDaily) * 100))}%`,
                    }}
                    title={`${day.date}: ${day.count}`}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gold/15 bg-black/25 p-5">
              <h3 className="font-serif text-xl text-white">
                Restaurants over time
              </h3>
              <div className="mt-4 flex h-40 items-end gap-1">
                {data.restaurantsOverTime.map((day) => (
                  <div
                    key={day.date}
                    className="flex-1 rounded-t bg-gold/50"
                    style={{
                      height: `${Math.max(4, Math.round((day.count / maxRegs) * 100))}%`,
                    }}
                    title={`${day.date}: ${day.count}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gold/15 bg-black/25 p-5">
              <h3 className="mb-4 font-serif text-xl text-white">
                Plan distribution
              </h3>
              <BarList
                items={data.planDistribution}
                labelKey="plan"
                valueKey="count"
              />
            </div>
            <div className="rounded-2xl border border-gold/15 bg-black/25 p-5">
              <h3 className="mb-4 font-serif text-xl text-white">
                Top restaurants (scans)
              </h3>
              <BarList
                items={data.topRestaurants}
                labelKey="name"
                valueKey="scans"
              />
            </div>
            <div className="rounded-2xl border border-gold/15 bg-black/25 p-5">
              <h3 className="mb-4 font-serif text-xl text-white">
                Demos by status
              </h3>
              <BarList
                items={data.demosByStatus}
                labelKey="status"
                valueKey="count"
              />
            </div>
            <div className="rounded-2xl border border-gold/15 bg-black/25 p-5">
              <h3 className="mb-4 font-serif text-xl text-white">
                Inactive restaurants
              </h3>
              {data.inactiveRestaurantNames.length === 0 ? (
                <p className="text-sm text-white/45">None right now.</p>
              ) : (
                <ul className="space-y-2 text-sm text-white/70">
                  {data.inactiveRestaurantNames.map((item) => (
                    <li key={item.id}>{item.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </AdminPlaceholder>
  );
}
