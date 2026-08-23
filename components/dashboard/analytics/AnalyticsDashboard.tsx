"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { fetchAnalyticsDashboard } from "@/lib/qr-analytics/queries";
import { downloadCsv, exportAnalyticsToCsv } from "@/lib/qr-analytics/csv";
import type { AnalyticsDashboardData, AnalyticsRange } from "@/lib/qr-analytics/types";
import { getQrTypeLabel } from "@/lib/dashboard/qr/seed-data";
import { getSafeRestaurantName } from "@/lib/restaurants/display";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { useToast } from "@/components/ui/ToastProvider";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { AnalyticsBarChart } from "./AnalyticsBarChart";
import { AnalyticsDailyChart } from "./AnalyticsDailyChart";

const RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: "week", label: "7 Days" },
  { value: "month", label: "30 Days" },
  { value: "quarter", label: "90 Days" },
  { value: "year", label: "1 Year" },
];

function RankedList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: ReactNode[];
  emptyMessage: string;
}) {
  return (
    <DashboardCard className="p-5 sm:p-6">
      <h2 className="font-serif text-xl font-bold text-white">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-white/45">{emptyMessage}</p>
      ) : (
        <div className="mt-4 space-y-3">{items}</div>
      )}
    </DashboardCard>
  );
}

export function AnalyticsDashboard() {
  const { showToast } = useToast();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [range, setRange] = useState<AnalyticsRange>("month");

  const loadAnalytics = useCallback(async () => {
    if (!restaurant?.id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await fetchAnalyticsDashboard(restaurant.id, restaurant.timezone, range);
    setLoading(false);

    if (!result.ok) {
      showToast(result.message, "error");
      setData(null);
      return;
    }

    setData(result.data);
  }, [restaurant, range, showToast]);

  useEffect(() => {
    if (restaurantLoading) return;
    loadAnalytics();
  }, [loadAnalytics, restaurantLoading]);

  const handleExportCsv = () => {
    if (!data) return;
    downloadCsv(`qr-analytics-${new Date().toISOString().slice(0, 10)}.csv`, exportAnalyticsToCsv(data));
    showToast("Analytics exported to CSV");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="dashboard-card rounded-2xl p-6">
              <div className="skeleton-shimmer h-4 w-24 rounded" />
              <div className="skeleton-shimmer mt-4 h-10 w-20 rounded" />
            </div>
          ))}
        </div>
        <div className="dashboard-card overflow-hidden rounded-2xl">
          <TableSkeleton rows={6} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-card mx-auto max-w-7xl rounded-2xl p-10 text-center">
        <p className="text-white/45">Analytics data is not available yet.</p>
      </div>
    );
  }

  const overviewCards = [
    { label: "Total Scans", value: data.overview.totalScans },
    { label: "Scans Today", value: data.overview.scansToday },
    { label: "Scans This Week", value: data.overview.scansThisWeek },
    { label: "Scans This Month", value: data.overview.scansThisMonth },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Performance Insights
          </p>
          <h1 className="mt-2 font-serif text-2xl font-bold text-white sm:text-3xl">
            QR Scan Analytics
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/50 sm:text-base">
            {getSafeRestaurantName(restaurant)} · Track scan volume,
            top-performing QR codes, and table-level engagement.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-gold/15 bg-surface p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRange(option.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                  range === option.value ? "bg-gold text-black" : "text-white/60 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={handleExportCsv} className="menu-btn-secondary text-xs">
            Export CSV
          </button>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card, index) => (
          <DashboardCard key={card.label} delay={index * 0.08} className="p-5 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/45">
              {card.label}
            </p>
            <p className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">
              {card.value.toLocaleString()}
            </p>
          </DashboardCard>
        ))}
      </div>

      <DashboardCard className="p-5 sm:p-6">
        <h2 className="font-serif text-xl font-bold text-white">Scan Activity</h2>
        <p className="mt-1 text-sm text-white/45">
          {RANGE_OPTIONS.find((o) => o.value === range)?.label} of QR scan activity
        </p>
        <AnalyticsDailyChart data={data.dailyScans} />
      </DashboardCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardCard className="p-5 sm:p-6">
          <h2 className="font-serif text-xl font-bold text-white">Peak Hours</h2>
          <p className="mt-1 text-sm text-white/45">When guests scan the most, by hour of day</p>
          {data.peakHours.every((p) => p.scans === 0) ? (
            <p className="mt-6 text-sm text-white/45">No scan data yet.</p>
          ) : (
            <AnalyticsBarChart points={data.peakHours} />
          )}
        </DashboardCard>

        <DashboardCard className="p-5 sm:p-6">
          <h2 className="font-serif text-xl font-bold text-white">Peak Days</h2>
          <p className="mt-1 text-sm text-white/45">Busiest days of the week</p>
          {data.peakDays.every((p) => p.scans === 0) ? (
            <p className="mt-6 text-sm text-white/45">No scan data yet.</p>
          ) : (
            <AnalyticsBarChart points={data.peakDays} showEveryLabel />
          )}
        </DashboardCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RankedList
          title="Top 10 QR Codes"
          items={data.topQrCodes.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-white">
                  {index + 1}. {item.name}
                </p>
                <p className="text-xs text-white/45">{getQrTypeLabel(item.type)}</p>
              </div>
              <span className="font-serif text-gold">{item.scans.toLocaleString()}</span>
            </div>
          ))}
          emptyMessage="No QR scan data yet."
        />

        <RankedList
          title="Top Restaurant Tables"
          items={data.topTables.map((item, index) => (
            <div
              key={`${item.tableNumber}-${index}`}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-white">
                  Table {item.tableNumber}
                </p>
                <p className="truncate text-xs text-white/45">{item.qrName}</p>
              </div>
              <span className="font-serif text-gold">{item.scans.toLocaleString()}</span>
            </div>
          ))}
          emptyMessage="No table QR scan data yet."
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DashboardCard className="p-5 sm:p-6">
          <h2 className="font-serif text-xl font-bold text-white">Most Scanned QR</h2>
          {data.mostScannedQr ? (
            <div className="mt-4 rounded-xl border border-gold/15 bg-gold/5 px-4 py-4">
              <p className="font-medium text-white">{data.mostScannedQr.name}</p>
              <p className="mt-1 text-sm text-white/45">
                {getQrTypeLabel(data.mostScannedQr.type)}
              </p>
              <p className="mt-3 font-serif text-2xl text-gold">
                {data.mostScannedQr.scans.toLocaleString()} scans
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/45">No scan data yet.</p>
          )}
        </DashboardCard>

        <DashboardCard className="p-5 sm:p-6">
          <h2 className="font-serif text-xl font-bold text-white">Least Scanned QR</h2>
          {data.leastScannedQr ? (
            <div className="mt-4 rounded-xl border border-white/5 bg-black/20 px-4 py-4">
              <p className="font-medium text-white">{data.leastScannedQr.name}</p>
              <p className="mt-1 text-sm text-white/45">
                {getQrTypeLabel(data.leastScannedQr.type)}
              </p>
              <p className="mt-3 font-serif text-2xl text-white/80">
                {data.leastScannedQr.scans.toLocaleString()} scans
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/45">No scan data yet.</p>
          )}
        </DashboardCard>
      </div>

      <DashboardCard className="p-5 sm:p-6">
        <h2 className="font-serif text-xl font-bold text-white">Device Breakdown</h2>
        <p className="mt-1 text-sm text-white/45">Estimated from scan device information</p>
        {(() => {
          const { mobile, desktop, tablet, unknown } = data.deviceBreakdown;
          const total = mobile + desktop + tablet + unknown;
          if (total === 0) {
            return <p className="mt-6 text-sm text-white/45">No device data available yet.</p>;
          }
          const rows = [
            { label: "Mobile", value: mobile },
            { label: "Desktop", value: desktop },
            { label: "Tablet", value: tablet },
            { label: "Unknown", value: unknown },
          ];
          return (
            <div className="mt-5 space-y-3">
              {rows.map((row) => {
                const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
                return (
                  <div key={row.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-white/60">{row.label}</span>
                      <span className="text-white/45">{row.value.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-gold/40 to-gold"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </DashboardCard>
    </div>
  );
}
