"use client";

import { useMemo, useState } from "react";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import type { ReservationItem } from "@/lib/reservations/types";

interface ReservationCalendarProps {
  items: ReservationItem[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayKey(): string {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

export function ReservationCalendar({
  items,
  selectedDate,
  onSelectDate,
}: ReservationCalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      if (item.status === "Cancelled") continue;
      map.set(item.reservationDate, (map.get(item.reservationDate) ?? 0) + 1);
    }
    return map;
  }, [items]);

  const today = todayKey();

  const cells = useMemo(() => {
    const { year, month } = cursor;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: { key: string; day: number | null }[] = [];

    for (let i = 0; i < firstDay; i += 1) {
      result.push({ key: `pad-${i}`, day: null });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      result.push({ key: toDateKey(year, month, day), day });
    }
    return result;
  }, [cursor]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const goToMonth = (delta: number) => {
    setCursor((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  return (
    <DashboardCard className="p-5 sm:p-6" hover={false}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-lg text-white">{monthLabel}</h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            className="rounded-lg border border-white/10 p-1.5 text-white/50 transition-colors hover:border-gold/30 hover:text-gold"
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            className="rounded-lg border border-white/10 p-1.5 text-white/50 transition-colors hover:border-gold/30 hover:text-gold"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wider text-white/35">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          if (cell.day === null) {
            return <div key={cell.key} />;
          }
          const count = counts.get(cell.key) ?? 0;
          const isToday = cell.key === today;
          const isSelected = cell.key === selectedDate;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : cell.key)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition-colors ${
                isSelected
                  ? "bg-gold text-black font-semibold"
                  : isToday
                    ? "border border-gold/40 text-gold"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {cell.day}
              {count > 0 && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${
                    isSelected ? "bg-black" : "bg-gold"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <button
          type="button"
          onClick={() => onSelectDate(null)}
          className="mt-4 w-full rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60 transition-colors hover:border-gold/30 hover:text-gold"
        >
          Clear date filter
        </button>
      )}
    </DashboardCard>
  );
}
