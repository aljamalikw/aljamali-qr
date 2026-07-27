"use client";

import { motion } from "framer-motion";
import type { DailyScanPoint } from "@/lib/qr-analytics/types";

interface AnalyticsDailyChartProps {
  data: DailyScanPoint[];
}

export function AnalyticsDailyChart({ data }: AnalyticsDailyChartProps) {
  const max = Math.max(...data.map((point) => point.scans), 1);

  return (
    <div className="mt-6">
      <div className="flex h-56 items-end gap-1 overflow-x-auto pb-2 sm:gap-1.5">
        {data.map((item, index) => {
          const height = (item.scans / max) * 100;
          return (
            <div
              key={item.date}
              className="group flex min-w-[28px] flex-1 flex-col items-center gap-2"
            >
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${Math.max(height, item.scans > 0 ? 4 : 0)}%`, opacity: 1 }}
                transition={{
                  duration: 0.5,
                  delay: Math.min(index * 0.015, 0.45),
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative w-full min-h-[4px] cursor-pointer rounded-t-lg bg-gradient-to-t from-gold/20 to-gold transition-all duration-300 group-hover:from-gold/35 group-hover:to-gold-light"
                title={`${item.label}: ${item.scans} scans`}
              />
              {index % 3 === 0 && (
                <span className="text-[9px] uppercase tracking-wider text-white/35 sm:text-[10px]">
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
