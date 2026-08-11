"use client";

import type { ReactNode } from "react";
import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  compact?: boolean;
};

/**
 * Shared empty-state card for dashboard and admin list modules.
 */
export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  actionHref,
  className = "",
  compact = false,
}: EmptyStateProps) {
  const actionClass = compact
    ? "menu-btn-secondary mt-4 inline-flex"
    : "menu-btn-primary mt-6 inline-flex";

  return (
    <div
      className={`dashboard-card flex flex-col items-center rounded-2xl text-center ${
        compact ? "px-4 py-10" : "px-6 py-16 sm:py-20"
      } ${className}`}
      role="status"
    >
      <div
        className={`flex items-center justify-center rounded-2xl border border-gold/15 bg-gold/5 text-gold ${
          compact ? "h-12 w-12 text-xl" : "h-16 w-16 text-2xl"
        }`}
        aria-hidden="true"
      >
        {icon ?? "○"}
      </div>
      <h2
        className={`mt-5 font-serif font-bold text-white ${
          compact ? "text-lg" : "text-xl sm:text-2xl"
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-2 max-w-md text-sm leading-relaxed text-white/50 ${
          compact ? "text-xs" : ""
        }`}
      >
        {description}
      </p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={actionClass}>
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction && !actionHref ? (
        <button type="button" onClick={onAction} className={actionClass}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
