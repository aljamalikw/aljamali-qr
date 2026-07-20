"use client";

import { motion } from "framer-motion";

interface DashboardPlaceholderProps {
  title: string;
  description: string;
}

export function DashboardPlaceholder({
  title,
  description,
}: DashboardPlaceholderProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-20 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="dashboard-card w-full rounded-2xl p-10 sm:p-12"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10 font-serif text-2xl text-gold">
          ✦
        </span>
        <h1 className="mt-6 font-serif text-2xl font-bold text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/50 sm:text-base">
          {description}
        </p>
        <p className="mt-6 inline-flex rounded-full border border-gold/20 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold">
          Coming soon — mock UI only
        </p>
      </motion.div>
    </div>
  );
}
