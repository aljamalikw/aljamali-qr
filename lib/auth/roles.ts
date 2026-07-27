export const APP_ROLES = [
  "restaurant_owner",
  "admin",
  "sales",
  "support",
  "super_admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ADMIN_ROLES: AppRole[] = ["admin", "super_admin"];

export const ROLE_LABELS: Record<AppRole, string> = {
  restaurant_owner: "Restaurant Owner",
  admin: "Administrator",
  sales: "Sales",
  support: "Support",
  super_admin: "Super Admin",
};

export function isAppRole(value: unknown): value is AppRole {
  return (
    typeof value === "string" &&
    (APP_ROLES as readonly string[]).includes(value)
  );
}

export function isAdminRole(role: AppRole | null | undefined): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role);
}

export function isRestaurantOwnerRole(
  role: AppRole | null | undefined,
): boolean {
  return role === "restaurant_owner";
}

export function getRoleLabel(role: AppRole | null | undefined): string {
  if (!role) return ROLE_LABELS.restaurant_owner;
  return ROLE_LABELS[role] ?? ROLE_LABELS.restaurant_owner;
}
