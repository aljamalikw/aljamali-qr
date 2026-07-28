"use client";

import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import type { OrderAnalyticsData } from "@/lib/order-analytics/types";

interface OrderAnalyticsSectionProps {
  data: OrderAnalyticsData;
  currency: string;
}

function PeakHoursChart({ points }: { points: OrderAnalyticsData["peakHours"] }) {
  const max = Math.max(...points.map((p) => p.orders), 1);

  return (
    <div className="flex h-32 items-end gap-1 overflow-x-auto pb-2">
      {points.map((point) => {
        const height = (point.orders / max) * 100;
        return (
          <div key={point.hour} className="group flex min-w-[10px] flex-1 flex-col items-center gap-1.5">
            <div
              style={{ height: `${Math.max(height, point.orders > 0 ? 4 : 0)}%` }}
              className="relative w-full min-h-[3px] rounded-t bg-gradient-to-t from-gold/20 to-gold transition-all duration-300 group-hover:from-gold/35 group-hover:to-gold-light"
              title={`${point.label}: ${point.orders} orders`}
            />
            {point.hour % 4 === 0 && (
              <span className="text-[9px] text-white/30">{point.hour}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function OrderAnalyticsSection({ data, currency }: OrderAnalyticsSectionProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <DashboardCard className="p-5 sm:p-6">
        <h2 className="font-serif text-xl font-bold text-white">Top Selling Items</h2>
        <p className="mt-1 text-sm text-white/45">Best performers by quantity sold</p>
        {data.topSellingItems.length === 0 ? (
          <p className="mt-6 text-sm text-white/45">No order data yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {data.topSellingItems.map((item, index) => (
              <div
                key={`${item.menuItemId ?? item.name}-${index}`}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">
                    {index + 1}. {item.name}
                  </p>
                  <p className="text-xs text-white/45">
                    {item.revenue.toFixed(3)} {currency} revenue
                  </p>
                </div>
                <span className="font-serif text-gold">{item.quantity}×</span>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      <DashboardCard className="p-5 sm:p-6">
        <h2 className="font-serif text-xl font-bold text-white">Peak Hours</h2>
        <p className="mt-1 text-sm text-white/45">When orders come in throughout the day</p>
        {data.peakHours.every((p) => p.orders === 0) ? (
          <p className="mt-6 text-sm text-white/45">No order data yet.</p>
        ) : (
          <PeakHoursChart points={data.peakHours} />
        )}
      </DashboardCard>
    </div>
  );
}
