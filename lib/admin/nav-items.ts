export type AdminNavId =
  | "dashboard"
  | "demo-requests"
  | "restaurants"
  | "owners"
  | "reservations"
  | "subscriptions"
  | "payments"
  | "support"
  | "analytics"
  | "announcements"
  | "email-templates"
  | "settings";

export type AdminNavItem = {
  id: AdminNavId;
  label: string;
  href: string;
};

export const adminNavItems: AdminNavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/admin/dashboard" },
  { id: "demo-requests", label: "Demo Requests", href: "/admin/demo-requests" },
  { id: "restaurants", label: "Restaurant Management", href: "/admin/restaurants" },
  { id: "owners", label: "Restaurant Owners", href: "/admin/owners" },
  { id: "reservations", label: "Reservations", href: "/admin/reservations" },
  { id: "subscriptions", label: "Subscriptions", href: "/admin/subscriptions" },
  { id: "payments", label: "Payments", href: "/admin/payments" },
  { id: "support", label: "Support", href: "/admin/support" },
  { id: "analytics", label: "Analytics", href: "/admin/analytics" },
  { id: "announcements", label: "Announcements", href: "/admin/announcements" },
  {
    id: "email-templates",
    label: "Email Templates",
    href: "/admin/email-templates",
  },
  { id: "settings", label: "Settings", href: "/admin/settings" },
];

export function getAdminNavIdFromPath(pathname: string): AdminNavId {
  const match = adminNavItems.find((item) =>
    item.href === "/admin/dashboard"
      ? pathname === "/admin" || pathname === "/admin/dashboard"
      : pathname.startsWith(item.href),
  );
  return match?.id ?? "dashboard";
}
