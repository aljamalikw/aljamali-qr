import type { DashboardNavItem } from "./types";

export const dashboardNavItems: DashboardNavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "menu-items", label: "Menu Items", href: "/dashboard/menu-items" },
  { id: "categories", label: "Categories", href: "/dashboard/categories" },
  { id: "reservations", label: "Reservations", href: "/dashboard/reservations" },
  { id: "orders", label: "Orders", href: "/dashboard/orders" },
  { id: "kitchen", label: "Kitchen Display", href: "/dashboard/kitchen" },
  { id: "qr-codes", label: "QR Codes", href: "/dashboard/qr-codes" },
  { id: "analytics", label: "Analytics", href: "/dashboard/analytics" },
  {
    id: "settings",
    label: "Restaurant Settings",
    href: "/dashboard/settings",
  },
  { id: "subscription", label: "Subscription", href: "/dashboard/subscription" },
  { id: "support", label: "Support", href: "/dashboard/support" },
];

export function getNavIdFromPath(pathname: string): DashboardNavItem["id"] {
  const match = dashboardNavItems.find((item) =>
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href),
  );
  return match?.id ?? "dashboard";
}
