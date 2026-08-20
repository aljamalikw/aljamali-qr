"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { AnnouncementItem } from "@/lib/announcements/types";
import { getAnnouncementPublishedAt } from "@/lib/announcements/owner-queries";
import { formatDemoDateTime } from "@/lib/demo-requests/utils";
import { DashboardIcon } from "@/components/dashboard/icons/DashboardIcons";

interface AnnouncementListModalProps {
  announcements: AnnouncementItem[];
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

const FOCUSABLE =
  'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function AnnouncementListModal({
  announcements,
  open,
  onClose,
  onSelect,
}: AnnouncementListModalProps) {
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

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus();
    };
  }, [open]);

  if (!portalRoot) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
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
            aria-label="Close announcements list"
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
            className="relative z-10 flex max-h-[min(85vh,28rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gold/20 bg-surface-elevated shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-gold/10 px-5 py-4">
              <h2
                id={titleId}
                className="font-serif text-lg font-bold text-white"
              >
                Announcements
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gold/15 p-2 text-white/60 transition-colors hover:border-gold/30 hover:text-gold"
                aria-label="Close announcements list"
              >
                <DashboardIcon name="close" className="h-4 w-4" />
              </button>
            </div>

            <ul className="overflow-y-auto" role="list">
              {announcements.map((item) => (
                <li key={item.id} role="listitem">
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className="flex w-full flex-col gap-1 border-b border-white/5 px-5 py-4 text-start transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <span className="font-medium text-white">{item.title}</span>
                    <span className="line-clamp-2 text-sm text-white/55">
                      {item.message}
                    </span>
                    <span className="text-xs text-white/35">
                      {formatDemoDateTime(getAnnouncementPublishedAt(item))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    portalRoot,
  );
}
