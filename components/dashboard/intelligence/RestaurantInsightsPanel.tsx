"use client";

import type { RestaurantInsight } from "@/lib/intelligence/types";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";

const STYLES: Record<
  RestaurantInsight["severity"],
  { border: string; badge: string; icon: string }
> = {
  success: {
    border: "border-emerald-500/25 bg-emerald-500/5",
    badge: "text-emerald-200",
    icon: "✓",
  },
  warning: {
    border: "border-amber-500/25 bg-amber-500/5",
    badge: "text-amber-200",
    icon: "!",
  },
  opportunity: {
    border: "border-gold/30 bg-gold/5",
    badge: "text-gold",
    icon: "★",
  },
  info: {
    border: "border-sky-500/25 bg-sky-500/5",
    badge: "text-sky-200",
    icon: "i",
  },
};

export function RestaurantInsightsPanel({
  insights,
  loading,
}: {
  insights: RestaurantInsight[];
  loading?: boolean;
}) {
  return (
    <DashboardCard className="p-5 sm:p-6" delay={0.1} hover={false}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-white">
            Restaurant Insights
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Intelligent signals from your live restaurant data — no external AI.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-white/45">Generating insights…</p>
      ) : insights.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/45">
          Insights will appear as orders, customers, and reservations accumulate.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {insights.map((insight) => {
            const style = STYLES[insight.severity];
            return (
              <div
                key={insight.id}
                className={`rounded-xl border px-4 py-3 ${style.border}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-sm font-bold ${style.badge}`}
                    aria-hidden="true"
                  >
                    {style.icon}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold uppercase tracking-wider ${style.badge}`}>
                      {insight.severity}
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {insight.title}
                    </p>
                    <p className="mt-1 text-sm text-white/55">{insight.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}
