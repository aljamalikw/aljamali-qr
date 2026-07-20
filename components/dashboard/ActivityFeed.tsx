"use client";

import { motion } from "framer-motion";
import type { ActivityItem } from "@/lib/dashboard/types";
import { DashboardCard } from "./ui/DashboardCard";
import { DashboardIcon, getActivityIcon } from "./icons/DashboardIcons";

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const typeColors: Record<ActivityItem["type"], string> = {
  scan: "border-gold/25 bg-gold/10 text-gold",
  view: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  update: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  order: "border-violet-500/25 bg-violet-500/10 text-violet-300",
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <DashboardCard delay={0.35} hover={false} className="p-5 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-bold text-white sm:text-2xl">
            Recent Activity
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Live updates from your digital menu
          </p>
        </div>
        <span className="hidden rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-medium text-gold sm:inline">
          Live
        </span>
      </div>

      <div className="space-y-3">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.4 + index * 0.06,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="group flex gap-4 rounded-xl border border-white/5 bg-black/20 p-4 transition-all duration-300 hover:border-gold/15 hover:bg-gold/[0.03]"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${typeColors[activity.type]}`}
            >
              <DashboardIcon
                name={getActivityIcon(activity.type)}
                className="h-4 w-4"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium text-white transition-colors group-hover:text-gold-light">
                  {activity.title}
                </p>
                <span className="shrink-0 text-xs text-white/35">
                  {activity.time}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-white/50">
                {activity.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardCard>
  );
}
