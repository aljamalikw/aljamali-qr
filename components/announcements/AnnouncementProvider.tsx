"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import {
  loadDismissedAnnouncementIds,
  saveDismissedAnnouncementIds,
} from "@/lib/announcements/dismissals";
import {
  fetchPublishedAnnouncementById,
  fetchPublishedAnnouncementsForOwner,
  pickBannerAnnouncement,
} from "@/lib/announcements/owner-queries";
import type { AnnouncementItem } from "@/lib/announcements/types";
import { AnnouncementDetailModal } from "./AnnouncementDetailModal";
import { AnnouncementListModal } from "./AnnouncementListModal";

const POLL_INTERVAL_MS = 60000;

type AnnouncementContextValue = {
  announcements: AnnouncementItem[];
  bannerAnnouncement: AnnouncementItem | null;
  visibleAnnouncements: AnnouncementItem[];
  loading: boolean;
  openDetail: (id: string) => Promise<void>;
  openAll: () => void;
  dismissBanner: (id: string) => void;
  refresh: () => Promise<void>;
};

const AnnouncementContext = createContext<AnnouncementContextValue | null>(
  null,
);

export function AnnouncementProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthUser();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [detailAnnouncement, setDetailAnnouncement] =
    useState<AnnouncementItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setDismissedIds(new Set());
      return;
    }
    setDismissedIds(loadDismissedAnnouncementIds(user.id));
  }, [user?.id]);

  const refresh = useCallback(async () => {
    const next = await fetchPublishedAnnouncementsForOwner();
    setAnnouncements(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const visibleAnnouncements = useMemo(
    () => announcements.filter((item) => !dismissedIds.has(item.id)),
    [announcements, dismissedIds],
  );

  const bannerAnnouncement = useMemo(
    () => pickBannerAnnouncement(announcements, dismissedIds),
    [announcements, dismissedIds],
  );

  const openDetail = useCallback(
    async (id: string) => {
      const cached = announcements.find((item) => item.id === id) ?? null;
      const announcement =
        cached ?? (await fetchPublishedAnnouncementById(id));
      if (!announcement) return;
      setDetailAnnouncement(announcement);
      setDetailOpen(true);
      setListOpen(false);
    },
    [announcements],
  );

  const openAll = useCallback(() => {
    setListOpen(true);
  }, []);

  const dismissBanner = useCallback(
    (id: string) => {
      if (!user?.id) return;
      setDismissedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        saveDismissedAnnouncementIds(user.id, next);
        return next;
      });
    },
    [user?.id],
  );

  const value = useMemo<AnnouncementContextValue>(
    () => ({
      announcements,
      bannerAnnouncement,
      visibleAnnouncements,
      loading,
      openDetail,
      openAll,
      dismissBanner,
      refresh,
    }),
    [
      announcements,
      bannerAnnouncement,
      visibleAnnouncements,
      loading,
      openDetail,
      openAll,
      dismissBanner,
      refresh,
    ],
  );

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
      <AnnouncementDetailModal
        announcement={detailAnnouncement}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
      <AnnouncementListModal
        announcements={visibleAnnouncements}
        open={listOpen}
        onClose={() => setListOpen(false)}
        onSelect={(id) => void openDetail(id)}
      />
    </AnnouncementContext.Provider>
  );
}

export function useAnnouncements(): AnnouncementContextValue {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error("useAnnouncements must be used within AnnouncementProvider");
  }
  return context;
}

export function useAnnouncementsOptional(): AnnouncementContextValue | null {
  return useContext(AnnouncementContext);
}
