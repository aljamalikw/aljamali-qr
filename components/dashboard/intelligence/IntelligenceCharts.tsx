"use client";

import { motion } from "framer-motion";
import type { ChartPoint } from "@/lib/intelligence/types";

export function IntelligenceBarChart({
  points,
  valueSuffix = "",
}: {
  points: ChartPoint[];
  valueSuffix?: string;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);

  if (points.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-white/45">No chart data yet.</p>
    );
  }

  return (
    <div className="flex h-44 items-end gap-1.5 overflow-x-auto pb-2">
      {points.map((point, index) => {
        const height = (point.value / max) * 100;
        return (
          <div
            key={point.key}
            className="group flex min-w-[22px] flex-1 flex-col items-center gap-2"
          >
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: `${Math.max(height, point.value > 0 ? 4 : 0)}%`,
                opacity: 1,
              }}
              transition={{
                duration: 0.4,
                delay: Math.min(index * 0.015, 0.35),
                ease: [0.22, 1, 0.36, 1],
              }}
              className="w-full min-h-[4px] rounded-t-lg bg-gradient-to-t from-gold/25 to-gold"
              title={`${point.label}: ${point.value}${valueSuffix}`}
            />
            {index % Math.max(1, Math.ceil(points.length / 8)) === 0 ? (
              <span className="text-[9px] uppercase tracking-wider text-white/35">
                {point.label}
              </span>
            ) : (
              <span className="h-3" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function IntelligencePieLegend({ points }: { points: ChartPoint[] }) {
  const total = points.reduce((sum, p) => sum + p.value, 0) || 1;
  const colors = [
    "bg-gold",
    "bg-emerald-400",
    "bg-sky-400",
    "bg-violet-400",
    "bg-rose-400",
    "bg-amber-300",
    "bg-teal-300",
    "bg-white/40",
  ];

  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-white/45">No category data yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full border border-white/10">
        {points.map((point, index) => (
          <div
            key={point.key}
            className={colors[index % colors.length]}
            style={{ width: `${(point.value / total) * 100}%` }}
            title={point.label}
          />
        ))}
      </div>
      <ul className="space-y-2">
        {points.map((point, index) => (
          <li
            key={point.key}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2 text-white/75">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${colors[index % colors.length]}`}
              />
              <span className="truncate">{point.label}</span>
            </span>
            <span className="shrink-0 text-white/45">
              {point.value} · {Math.round((point.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
