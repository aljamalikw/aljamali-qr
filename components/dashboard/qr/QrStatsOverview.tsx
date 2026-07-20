"use client";

import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import type { QrOverviewStats } from "@/lib/dashboard/qr/types";
import { QrIcon } from "./icons/QrIcons";

interface QrStatsOverviewProps {
  stats: QrOverviewStats;
}

const cards = [
  { key: "total" as const, label: "Total QR Codes", icon: "total" as const },
  { key: "active" as const, label: "Active QR Codes", icon: "active" as const },
  { key: "totalScans" as const, label: "Total Scans", icon: "scans" as const },
  { key: "todayScans" as const, label: "Today's Scans", icon: "today" as const },
];

export function QrStatsOverview({ stats }: QrStatsOverviewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <DashboardCard key={card.key} delay={index * 0.08} className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/45">
                {card.label}
              </p>
              <p className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">
                {stats[card.key].toLocaleString()}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/15 bg-gold/10 text-gold">
              <QrIcon name={card.icon} className="h-5 w-5" />
            </div>
          </div>
        </DashboardCard>
      ))}
    </div>
  );
}
