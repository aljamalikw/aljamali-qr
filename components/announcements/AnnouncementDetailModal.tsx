"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { AnnouncementItem } from "@/lib/announcements/types";
import { getAnnouncementPublishedAt } from "@/lib/announcements/owner-queries";
import { formatDemoDateTime } from "@/lib/demo-requests/utils";
import { DashboardIcon } from "@/components/dashboard/icons/DashboardIcons";

interface AnnouncementDetailModalProps {
  announcement: AnnouncementItem | null;
  open: boolean;
  onClose: () => void;
}

const FOCUSABLE =
  'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function AnnouncementDetailModal({
  announcement,
  open,
  onClose,
}: AnnouncementDetailModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  onCloseRef.current = onClose;

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }, 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = [
        ...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ];
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus();
    };
  }, [open]);

  if (!portalRoot) return null;

  const publishedAt = announcement
    ? getAnnouncementPublishedAt(announcement)
    : null;

  return createPortal(
    <AnimatePresence>
      {open && announcement ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close announcement"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[min(85vh,32rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gold/20 bg-surface-elevated shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gold/10 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-gold">
                  System announcement
                </p>
                <h2
                  id={titleId}
                  className="mt-1 font-serif text-xl font-bold text-white"
                >
                  {announcement.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg border border-gold/15 p-2 text-white/60 transition-colors hover:border-gold/30 hover:text-gold"
                aria-label="Close announcement details"
              >
                <DashboardIcon name="close" className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                {announcement.message}
              </p>
              <p className="mt-4 text-xs text-white/40">
                Published: {formatDemoDateTime(publishedAt)}
              </p>
            </div>

            <div className="border-t border-gold/10 px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="menu-btn-primary w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    portalRoot,
  );
}
