"use client";

import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";

interface OrderKpiCardsProps {
  currency: string;
  todayOrders: number;
  todayRevenue: number;
  liveOrders: number;
  totalRevenue: number;
}

export function OrderKpiCards({
  currency,
  todayOrders,
  todayRevenue,
  liveOrders,
  totalRevenue,
}: OrderKpiCardsProps) {
  const cards = [
    { label: "Today's Orders", value: String(todayOrders), accent: "text-white" },
    {
      label: "Today's Revenue",
      value: `${todayRevenue.toFixed(3)} ${currency}`,
      accent: "text-emerald-300",
    },
    { label: "Live Orders", value: String(liveOrders), accent: "text-amber-300" },
    {
      label: "Total Revenue",
      value: `${totalRevenue.toFixed(3)} ${currency}`,
      accent: "text-gold",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <DashboardCard key={card.label} delay={index * 0.06} className="p-5 sm:p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/45">
            {card.label}
          </p>
          <p className={`mt-2.5 font-serif text-2xl font-bold sm:text-3xl ${card.accent}`}>
            {card.value}
          </p>
        </DashboardCard>
      ))}
    </div>
  );
}
