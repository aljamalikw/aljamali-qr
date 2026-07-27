"use client";

import { motion } from "framer-motion";

interface AnalyticsBarChartProps {
  points: { label: string; scans: number }[];
  showEveryLabel?: boolean;
}

export function AnalyticsBarChart({ points, showEveryLabel = false }: AnalyticsBarChartProps) {
  const max = Math.max(...points.map((point) => point.scans), 1);

  return (
    <div className="flex h-40 items-end gap-1.5 overflow-x-auto pb-2">
      {points.map((point, index) => {
        const height = (point.scans / max) * 100;
        return (
          <div key={point.label} className="group flex min-w-[26px] flex-1 flex-col items-center gap-2">
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: `${Math.max(height, point.scans > 0 ? 4 : 0)}%`, opacity: 1 }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.02, 0.4), ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full min-h-[4px] cursor-pointer rounded-t-lg bg-gradient-to-t from-gold/20 to-gold transition-all duration-300 group-hover:from-gold/35 group-hover:to-gold-light"
              title={`${point.label}: ${point.scans} scans`}
            />
            {(showEveryLabel || index % 3 === 0) && (
              <span className="text-[9px] uppercase tracking-wider text-white/35">{point.label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
