"use client";

import { DashboardIcon } from "@/components/dashboard/icons/DashboardIcons";
import { useAnnouncements } from "./AnnouncementProvider";

export function OwnerAnnouncementBanner() {
  const {
    bannerAnnouncement,
    visibleAnnouncements,
    loading,
    openDetail,
    openAll,
    dismissBanner,
  } = useAnnouncements();

  if (loading || !bannerAnnouncement) return null;

  const showViewAll = visibleAnnouncements.length > 1;

  return (
    <section
      aria-label="System announcement"
      className="mb-4 rounded-2xl border border-gold/25 bg-gradient-to-r from-gold/10 via-gold/5 to-surface-elevated/90 px-4 py-3 sm:px-5"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-gold"
          aria-hidden="true"
        >
          <DashboardIcon name="bell" className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-sm font-bold text-white sm:text-base">
            {bannerAnnouncement.title}
          </h2>
          <p className="mt-1 line-clamp-3 text-sm text-white/70 sm:line-clamp-2">
            {bannerAnnouncement.message}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void openDetail(bannerAnnouncement.id)}
              className="menu-btn-secondary text-xs"
            >
              View details
            </button>
            {showViewAll ? (
              <button
                type="button"
                onClick={openAll}
                className="text-xs font-medium text-gold hover:underline"
              >
                View all announcements
              </button>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => dismissBanner(bannerAnnouncement.id)}
          className="shrink-0 rounded-lg border border-gold/15 p-2 text-white/50 transition-colors hover:border-gold/30 hover:text-gold"
          aria-label={`Dismiss announcement: ${bannerAnnouncement.title}`}
        >
          <DashboardIcon name="close" className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
