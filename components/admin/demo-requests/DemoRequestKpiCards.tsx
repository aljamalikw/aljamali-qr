"use client";

import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import type { DemoRequestKpis } from "@/lib/demo-requests/types";

interface DemoRequestKpiCardsProps {
  kpis: DemoRequestKpis;
}

const cards: {
  key: keyof DemoRequestKpis;
  label: string;
  format?: (value: number) => string;
}[] = [
  { key: "totalRequests", label: "Total Requests" },
  { key: "newRequests", label: "New Requests" },
  { key: "scheduled", label: "Scheduled" },
  { key: "completed", label: "Completed" },
  { key: "convertedCustomers", label: "Converted Customers" },
  {
    key: "conversionRate",
    label: "Conversion Rate",
    format: (value) => `${value}%`,
  },
  { key: "archived", label: "Archived" },
];

export function DemoRequestKpiCards({ kpis }: DemoRequestKpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {cards.map((card, index) => {
        const value = kpis[card.key];
        return (
          <DashboardCard
            key={card.key}
            delay={index * 0.04}
            className="p-4 sm:p-5"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/45">
              {card.label}
            </p>
            <p className="mt-2.5 font-serif text-2xl font-bold text-white sm:text-3xl">
              {card.format ? card.format(value) : value}
            </p>
          </DashboardCard>
        );
      })}
    </div>
  );
}
