"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardIcon } from "@/components/dashboard/icons/DashboardIcons";
import { fetchNotifications } from "@/lib/notifications/fetchNotifications";
import { markAllNotificationsRead } from "@/lib/notifications/markAllNotificationsRead";
import { markNotificationRead } from "@/lib/notifications/markNotificationRead";
import {
  getAnnouncementIdFromNotification,
  type NotificationItem,
} from "@/lib/notifications/types";
import { useAnnouncementsOptional } from "@/components/announcements/AnnouncementProvider";

const POLL_INTERVAL_MS = 60000;

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function NotificationCenter() {
  const router = useRouter();
  const announcements = useAnnouncementsOptional();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const result = await fetchNotifications(20);
    if (result.ok) setItems(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const unreadCount = items.filter((item) => !item.isRead).length;

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i)),
      );
      void markNotificationRead(item.id);
    }
    setOpen(false);

    const announcementId = getAnnouncementIdFromNotification(item);
    if (announcementId && announcements) {
      void announcements.openDetail(announcementId);
      return;
    }

    if (item.href) router.push(item.href);
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    await markAllNotificationsRead();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((value) => {
            const next = !value;
            if (next) void load();
            return next;
          });
        }}
        className="relative rounded-xl border border-gold/15 p-2.5 text-white/70 transition-all duration-300 hover:border-gold/30 hover:bg-gold/5 hover:text-gold"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="true"
      >
        <DashboardIcon name="bell" className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute end-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gold/15 bg-surface-elevated shadow-2xl"
            role="menu"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between border-b border-gold/10 px-4 py-3">
              <p className="font-serif text-sm font-bold text-white">
                Notifications
              </p>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => void handleMarkAllRead()}
                  className="text-xs font-medium text-gold hover:underline"
                >
                  Mark all read
                </button>
              ) : null}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="skeleton-shimmer h-14 w-full rounded-xl"
                    />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-white/45">
                  No notifications yet.
                </p>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => handleItemClick(item)}
                    className={`flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-start transition-colors last:border-0 hover:bg-white/[0.03] ${
                      item.isRead ? "" : "bg-gold/[0.04]"
                    }`}
                    aria-label={
                      item.isRead
                        ? `${item.title}: ${item.body}`
                        : `Unread: ${item.title}: ${item.body}`
                    }
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        item.isRead ? "bg-white/15" : "bg-gold"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-white/50">
                        {item.body}
                      </span>
                      <span className="mt-1 block text-[11px] text-white/30">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

