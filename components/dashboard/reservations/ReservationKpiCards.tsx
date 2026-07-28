"use client";

import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import type { ReservationKpis } from "@/lib/reservations/types";

interface ReservationKpiCardsProps {
  kpis: ReservationKpis;
}

const cards: { key: keyof ReservationKpis; label: string; accent: string }[] = [
  { key: "today", label: "Today", accent: "text-white" },
  { key: "upcoming", label: "Upcoming", accent: "text-sky-300" },
  { key: "pending", label: "Pending", accent: "text-amber-300" },
  { key: "cancelled", label: "Cancelled", accent: "text-red-300" },
];

export function ReservationKpiCards({ kpis }: ReservationKpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <DashboardCard key={card.key} delay={index * 0.06} className="p-5 sm:p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/45">
            {card.label}
          </p>
          <p className={`mt-2.5 font-serif text-3xl font-bold sm:text-4xl ${card.accent}`}>
            {kpis[card.key]}
          </p>
        </DashboardCard>
      ))}
    </div>
  );
}
