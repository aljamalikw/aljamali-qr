"use client";

import type { DashboardStat } from "@/lib/dashboard/types";
import { DashboardCard } from "./ui/DashboardCard";
import { DashboardIcon, getStatIcon } from "./icons/DashboardIcons";

interface StatCardProps {
  stat: DashboardStat;
  index: number;
}

const trendStyles = {
  up: "text-emerald-400",
  down: "text-red-400",
  neutral: "text-white/45",
};

export function StatCard({ stat, index }: StatCardProps) {
  return (
    <DashboardCard delay={index * 0.08} className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/45 sm:text-[11px]">
            {stat.label}
          </p>
          <p className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">
            {stat.value}
          </p>
          <p className={`mt-2 text-xs sm:text-sm ${trendStyles[stat.trend]}`}>
            {stat.change}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/15 bg-gold/10 text-gold sm:h-12 sm:w-12">
          <DashboardIcon name={getStatIcon(stat.icon)} className="h-5 w-5" />
        </div>
      </div>

      <div className="pointer-events-none absolute -end-6 -top-6 h-24 w-24 rounded-full bg-gold/5 blur-2xl" />
    </DashboardCard>
  );
}
