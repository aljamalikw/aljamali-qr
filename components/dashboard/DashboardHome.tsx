"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  dashboardStats,
  quickInsights,
  recentActivity,
} from "@/lib/dashboard/mock-data";
import { StatCard } from "./StatCard";
import { ActivityFeed } from "./ActivityFeed";
import { DashboardCard } from "./ui/DashboardCard";
import { DashboardChart } from "./DashboardChart";
import { StatCardSkeleton } from "@/components/ui/Skeleton";

export function DashboardHome() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Welcome back
        </p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
          Dashboard Overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/50 sm:text-base">
          Track scans, menu performance, and guest activity across your
          restaurant in real time.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : dashboardStats.map((stat, index) => (
              <StatCard key={stat.id} stat={stat} index={index} />
            ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <DashboardCard delay={0.15} className="p-5 sm:p-6">
            <h2 className="font-serif text-xl font-bold text-white">
              Scan Activity
            </h2>
            <p className="mt-1 text-sm text-white/45">
              QR scans over the past 7 days
            </p>
            {loading ? (
              <div className="mt-6 flex h-48 items-end gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton-shimmer flex-1 rounded-t-lg"
                    style={{ height: `${30 + i * 8}%` }}
                  />
                ))}
              </div>
            ) : (
              <DashboardChart />
            )}
          </DashboardCard>

          {!loading && <ActivityFeed activities={recentActivity} />}
        </div>

        <div className="space-y-6">
          <DashboardCard delay={0.3} className="p-5 sm:p-6">
            <h2 className="font-serif text-xl font-bold text-white">
              Quick Insights
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Highlights from today&apos;s service
            </p>

            <div className="mt-5 space-y-4">
              {quickInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-xl border border-white/5 bg-black/20 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/15"
                >
                  <p className="text-xs uppercase tracking-wider text-white/40">
                    {insight.label}
                  </p>
                  <p className="mt-1 font-serif text-xl font-bold text-gold">
                    {insight.value}
                  </p>
                  <p className="mt-1 text-sm text-white/50">{insight.detail}</p>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard delay={0.38} className="p-5 sm:p-6">
            <h2 className="font-serif text-xl font-bold text-white">
              Quick Actions
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Manage your menu in one click
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <Link
                href="/dashboard/menu-items"
                className="rounded-xl border border-gold/15 bg-gold/5 px-4 py-3 text-sm font-medium text-gold transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/10"
              >
                Add menu item
              </Link>
              <Link
                href="/dashboard/qr-codes"
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/20 hover:text-gold"
              >
                Generate QR code
              </Link>
              <Link
                href="/demo"
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/20 hover:text-gold"
              >
                Preview live menu
              </Link>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
