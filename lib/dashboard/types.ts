export type DashboardNavId =
  | "dashboard"
  | "menu-items"
  | "categories"
  | "reservations"
  | "orders"
  | "customers"
  | "kitchen"
  | "qr-codes"
  | "analytics"
  | "settings"
  | "subscription"
  | "support";

export interface DashboardNavItem {
  id: DashboardNavId;
  label: string;
  href: string;
}

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: "qr-scans" | "views" | "tables" | "categories";
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "scan" | "view" | "update" | "order";
}

export interface RestaurantProfile {
  name: string;
  initials: string;
  plan: string;
  userName: string;
  userRole: string;
  avatarUrl: string | null;
  notificationCount: number;
}
