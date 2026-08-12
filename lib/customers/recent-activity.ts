import { supabase } from "@/lib/supabase";

export type RecentCustomerActivityItem = {
  id: string;
  customerName: string;
  label: string;
  at: string;
  type: "whatsapp" | "order";
};

function relativeTimeLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Lightweight recent CRM activity for the owner dashboard.
 * Combines WhatsApp opens (activity_logs) and recent orders.
 */
export async function fetchRecentCustomerActivity(
  restaurantId: string,
  limit = 8,
): Promise<
  | { ok: true; data: Array<RecentCustomerActivityItem & { time: string }> }
  | { ok: false; message: string }
> {
  try {
    const [{ data: whatsappRows }, { data: orderRows }] = await Promise.all([
      supabase
        .from("activity_logs")
        .select("id, new_values, created_at")
        .eq("restaurant_id", restaurantId)
        .eq("action", "whatsapp_opened")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("orders")
        .select("id, customer_name, created_at")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

    const items: RecentCustomerActivityItem[] = [
      ...((whatsappRows ?? []) as Array<{
        id: string;
        new_values: Record<string, unknown> | null;
        created_at: string;
      }>).map((row) => ({
        id: `wa-${row.id}`,
        customerName:
          (typeof row.new_values?.customer_name === "string" &&
            row.new_values.customer_name.trim()) ||
          "Customer",
        label: "WhatsApp Opened",
        at: row.created_at,
        type: "whatsapp" as const,
      })),
      ...((orderRows ?? []) as Array<{
        id: string;
        customer_name: string | null;
        created_at: string;
      }>).map((row) => ({
        id: `order-${row.id}`,
        customerName: row.customer_name?.trim() || "Guest",
        label: "Order Placed",
        at: row.created_at,
        type: "order" as const,
      })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit);

    return {
      ok: true,
      data: items.map((item) => ({
        ...item,
        time: relativeTimeLabel(item.at),
      })),
    };
  } catch {
    return { ok: false, message: "Unable to load customer activity." };
  }
}
