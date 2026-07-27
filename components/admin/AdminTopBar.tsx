"use client";

import { useAuthUser } from "@/lib/auth/use-auth-user";
import { DashboardIcon } from "@/components/dashboard/icons/DashboardIcons";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

interface AdminTopBarProps {
  onOpenMobileMenu: () => void;
}

export function AdminTopBar({ onOpenMobileMenu }: AdminTopBarProps) {
  const { displayName, initials, roleLabel } = useAuthUser();

  return (
    <header className="dashboard-topbar sticky top-0 z-30 flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-xl border border-gold/15 bg-surface-elevated p-2.5 text-white/70 transition-colors hover:border-gold/30 hover:text-gold lg:hidden"
          aria-label="Open menu"
        >
          <DashboardIcon name="menu" className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate font-serif text-lg font-bold text-white">
            Admin Console
          </p>
          <p className="hidden truncate text-xs text-white/40 sm:block">
            Aljamali QR platform operations
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <NotificationCenter />
        <div className="hidden items-center gap-3 rounded-xl border border-gold/15 bg-surface-elevated/80 px-3 py-1.5 sm:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-xs font-semibold text-gold">
            {initials}
          </span>
          <div className="hidden min-w-0 md:block">
            <p className="truncate text-sm font-medium text-white">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-white/40">{roleLabel}</p>
          </div>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-xs font-semibold text-gold sm:hidden">
          {initials}
        </span>
      </div>
    </header>
  );
}
