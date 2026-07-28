"use client";

import { motion } from "framer-motion";

const chartData = [
  { day: "Mon", scans: 142 },
  { day: "Tue", scans: 168 },
  { day: "Wed", scans: 195 },
  { day: "Thu", scans: 210 },
  { day: "Fri", scans: 248 },
  { day: "Sat", scans: 276 },
  { day: "Sun", scans: 224 },
];

export function DashboardChart() {
  const max = Math.max(...chartData.map((d) => d.scans));

  return (
    <div className="mt-6">
      <div className="flex h-48 items-end justify-between gap-2 sm:gap-3">
        {chartData.map((item, index) => {
          const height = (item.scans / max) * 100;
          return (
            <div key={item.day} className="group flex flex-1 flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${height}%`, opacity: 1 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative w-full min-h-[4px] cursor-pointer rounded-t-lg bg-gradient-to-t from-gold/20 to-gold transition-all duration-300 group-hover:from-gold/35 group-hover:to-gold-light"
                title={`${item.scans} scans`}
              />
              <span className="text-[10px] uppercase tracking-wider text-white/35 sm:text-xs">
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-white/35">
        Weekly QR scan activity — hover bars for details
      </p>
    </div>
  );
}
