export const OWNER_NOTIFICATION_TYPES = [
  "subscription_expiring",
  "new_announcement",
  "support_reply",
  "demo_approved",
  "new_reservation",
  "new_order",
] as const;

export const ADMIN_NOTIFICATION_TYPES = [
  "new_demo",
  "new_restaurant",
  "new_subscription",
  "support_ticket",
  "payment_received",
] as const;

export const NOTIFICATION_TYPES = [
  ...OWNER_NOTIFICATION_TYPES,
  ...ADMIN_NOTIFICATION_TYPES,
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationItem = {
  id: string;
  userId: string;
  restaurantId: string | null;
  type: NotificationType | string;
  title: string;
  body: string;
  href: string | null;
  isRead: boolean;
  meta: Record<string, unknown>;
  createdAt: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  restaurant_id: string | null;
  type: string;
  title: string;
  body: string;
  href: string | null;
  is_read: boolean;
  meta: Record<string, unknown> | null;
  created_at: string;
};

export function mapNotificationRow(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    isRead: row.is_read,
    meta: row.meta ?? {},
    createdAt: row.created_at,
  };
}

const NOTIFICATION_ICONS: Record<string, string> = {
  subscription_expiring: "subscription",
  new_announcement: "bell",
  support_reply: "support",
  demo_approved: "tables",
  new_reservation: "tables",
  new_order: "order",
  new_demo: "tables",
  new_restaurant: "categories",
  new_subscription: "subscription",
  support_ticket: "support",
  payment_received: "subscription",
};

export function getNotificationIconKey(type: string): string {
  return NOTIFICATION_ICONS[type] ?? "bell";
}
