"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

export function DashboardCard({
  children,
  className = "",
  delay = 0,
  hover = true,
}: DashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        hover
          ? {
              y: -4,
              transition: { duration: 0.25 },
            }
          : undefined
      }
      className={`dashboard-card relative overflow-hidden rounded-2xl ${className}`}
    >
      {children}
    </motion.div>
  );
}
