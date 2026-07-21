"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getUserDisplayName, getUserInitials } from "@/lib/auth/user-display";
import { restaurantProfile } from "@/lib/dashboard/mock-data";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/Skeleton";
import { DashboardIcon } from "./icons/DashboardIcons";

interface TopBarProps {
  onOpenMobileMenu: () => void;
}

export function TopBar({ onOpenMobileMenu }: TopBarProps) {
  const [displayName, setDisplayName] = useState("");
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setDisplayName(getUserDisplayName(session.user));
      }
      setUserLoading(false);
    });
  }, []);

  const userInitials = getUserInitials(displayName);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="dashboard-topbar sticky top-0 z-30 flex h-16 items-center justify-between gap-4 px-4 sm:px-6"
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-xl border border-gold/15 p-2.5 text-white/70 transition-colors hover:border-gold/30 hover:text-gold lg:hidden"
          aria-label="Open menu"
        >
          <DashboardIcon name="menu" className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 font-serif text-sm font-bold text-gold">
            {restaurantProfile.initials}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-base font-bold text-white sm:text-lg">
              {restaurantProfile.name}
            </h1>
            <p className="hidden truncate text-xs text-white/40 sm:block">
              {restaurantProfile.plan} · Digital Menu
            </p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="relative rounded-xl border border-gold/15 p-2.5 text-white/70 transition-all duration-300 hover:border-gold/30 hover:bg-gold/5 hover:text-gold"
          aria-label={`${restaurantProfile.notificationCount} notifications`}
        >
          <DashboardIcon name="bell" className="h-5 w-5" />
          {restaurantProfile.notificationCount > 0 && (
            <span className="absolute -end-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-black">
              {restaurantProfile.notificationCount}
            </span>
          )}
        </button>

        <div className="hidden items-center gap-3 rounded-xl border border-gold/15 bg-surface-elevated/80 px-3 py-1.5 sm:flex">
          {userLoading ? (
            <>
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="hidden min-w-0 space-y-1.5 md:block">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </>
          ) : (
            <>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold/30 to-gold/10 font-serif text-sm font-bold text-gold">
                {userInitials}
              </div>
              <div className="hidden min-w-0 md:block">
                <p className="truncate text-sm font-medium text-white">
                  {displayName}
                </p>
                <p className="truncate text-xs text-white/40">
                  {restaurantProfile.userRole}
                </p>
              </div>
            </>
          )}
        </div>

        {userLoading ? (
          <Skeleton className="h-9 w-9 rounded-full sm:hidden" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold/30 to-gold/10 font-serif text-xs font-bold text-gold sm:hidden">
            {userInitials}
          </div>
        )}
      </div>
    </motion.header>
  );
}
