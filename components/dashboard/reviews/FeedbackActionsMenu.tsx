"use client";

import { useEffect, useRef, useState } from "react";
import type { RestaurantReview } from "@/lib/reviews/reviews";

type FeedbackAction = "mark-read" | "mark-unread" | "close" | "reopen";

type FeedbackActionsMenuProps = {
  review: RestaurantReview;
  disabled?: boolean;
  onAction: (action: FeedbackAction) => void;
};

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}

export function FeedbackActionsMenu({
  review,
  disabled,
  onAction,
}: FeedbackActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const items: { action: FeedbackAction; label: string }[] = [];
  if (review.isRead) {
    items.push({ action: "mark-unread", label: "Mark as Unread" });
  } else {
    items.push({ action: "mark-read", label: "Mark as Read" });
  }
  if (review.status === "closed") {
    items.push({ action: "reopen", label: "Reopen" });
  } else {
    items.push({ action: "close", label: "Close" });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className="rounded-lg p-1.5 text-white/45 transition-colors hover:bg-gold/10 hover:text-gold disabled:opacity-40"
        aria-label="More actions"
        aria-expanded={open}
      >
        <MoreIcon />
      </button>
      {open ? (
        <div className="absolute end-0 top-full z-20 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-gold/15 bg-surface-elevated py-1 shadow-2xl">
          {items.map((item) => (
            <button
              key={item.action}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                onAction(item.action);
              }}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-gold"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
