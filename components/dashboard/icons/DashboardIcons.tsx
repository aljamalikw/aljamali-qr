import type { ReactNode } from "react";

type DashboardIconName =
  | "dashboard"
  | "menu-items"
  | "categories"
  | "qr-codes"
  | "analytics"
  | "settings"
  | "subscription"
  | "support"
  | "qr-scans"
  | "views"
  | "tables"
  | "categories-stat"
  | "bell"
  | "chevron-left"
  | "chevron-right"
  | "menu"
  | "close"
  | "scan"
  | "view"
  | "update"
  | "order"
  | "kitchen"
  | "logo";

interface DashboardIconProps {
  name: DashboardIconName;
  className?: string;
}

export function DashboardIcon({
  name,
  className = "h-5 w-5",
}: DashboardIconProps) {
  const icons: Record<DashboardIconName, ReactNode> = {
    dashboard: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
    "menu-items": (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M4 6h16M4 12h16M4 18h10" />
        <circle cx="19" cy="18" r="2" />
      </svg>
    ),
    categories: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M4 7h7V4H4v3zM13 4v3h7V4h-7zM4 13h7v7H4v-7zM13 20h7v-7h-7v7z" />
      </svg>
    ),
    "qr-codes": (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3" />
      </svg>
    ),
    analytics: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M3 3v18h18" />
        <path d="M7 16l4-4 4 4 5-6" />
      </svg>
    ),
    settings: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
    subscription: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
    support: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    "qr-scans": (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <path d="M3 14h4v7H3zM10 14h11v4H10zM10 21h4" />
      </svg>
    ),
    views: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    tables: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M5 12v8M19 12v8M9 12v6M15 12v6" />
      </svg>
    ),
    "categories-stat": (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
    bell: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    "chevron-left": (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M15 18l-6-6 6-6" />
      </svg>
    ),
    "chevron-right": (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M9 18l6-6-6-6" />
      </svg>
    ),
    menu: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    close: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    ),
    scan: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <path d="M14 4h6v6M14 14h1v1M20 14v6h-6" />
      </svg>
    ),
    view: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    update: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </svg>
    ),
    order: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    kitchen: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M4 4h16v4H4z" />
        <path d="M6 8v12M18 8v12M6 20h12" />
        <path d="M9 12h6M9 16h6" />
      </svg>
    ),
    logo: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3" />
      </svg>
    ),
  };

  return icons[name];
}

export function getNavIcon(id: string): DashboardIconName {
  const map: Record<string, DashboardIconName> = {
    dashboard: "dashboard",
    "menu-items": "menu-items",
    categories: "categories",
    reservations: "tables",
    orders: "order",
    kitchen: "kitchen",
    "qr-codes": "qr-codes",
    analytics: "analytics",
    settings: "settings",
    subscription: "subscription",
    support: "support",
  };
  return map[id] ?? "dashboard";
}

export function getStatIcon(icon: string): DashboardIconName {
  const map: Record<string, DashboardIconName> = {
    "qr-scans": "qr-scans",
    views: "views",
    tables: "tables",
    categories: "categories-stat",
  };
  return map[icon] ?? "dashboard";
}

export function getActivityIcon(type: string): DashboardIconName {
  const map: Record<string, DashboardIconName> = {
    scan: "scan",
    view: "view",
    update: "update",
    order: "order",
  };
  return map[type] ?? "view";
}
