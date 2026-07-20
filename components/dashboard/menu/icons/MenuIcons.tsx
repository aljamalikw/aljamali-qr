import type { ReactNode } from "react";

type MenuIconName =
  | "search"
  | "plus"
  | "edit"
  | "duplicate"
  | "delete"
  | "upload"
  | "image"
  | "close"
  | "warning"
  | "chef"
  | "leaf"
  | "spicy"
  | "sort"
  | "filter"
  | "empty";

interface MenuIconProps {
  name: MenuIconName;
  className?: string;
}

export function MenuIcon({ name, className = "h-5 w-5" }: MenuIconProps) {
  const icons: Record<MenuIconName, ReactNode> = {
    search: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
    ),
    plus: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
    edit: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    duplicate: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    ),
    delete: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
      </svg>
    ),
    upload: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
      </svg>
    ),
    image: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
    close: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    ),
    chef: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M6 13c0-2.5 1.5-4.5 4-5.5 1-2.5 3-3.5 5-2 2 1.5 2.5 4 1 6" />
        <path d="M6 13h12v8H6z" />
      </svg>
    ),
    leaf: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
    spicy: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M12 2c1 3 3 4.5 3 7.5a3 3 0 1 1-6 0C9 6.5 11 5 12 2z" />
        <path d="M8 22h8M10 14v8M14 14v8" />
      </svg>
    ),
    sort: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M3 6h18M7 12h10M10 18h4" />
      </svg>
    ),
    filter: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
      </svg>
    ),
    empty: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className={className}>
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <circle cx="8" cy="15" r="1.5" fill="currentColor" />
        <circle cx="12" cy="15" r="1.5" fill="currentColor" />
        <circle cx="16" cy="15" r="1.5" fill="currentColor" />
        <path d="M8 3v3M16 3v3" />
      </svg>
    ),
  };

  return icons[name];
}
