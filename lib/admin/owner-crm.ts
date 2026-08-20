import { supabase } from "@/lib/supabase";
import {
  fetchPaymentsForRestaurants,
  type PaymentItem,
} from "@/lib/admin/payments";
import {
  fetchAdminRestaurantsByOwnerId,
  type AdminRestaurantManagementRow,
} from "@/lib/admin/restaurants";
import { pickPrimaryByPlan } from "@/lib/admin/group-by-owner";
import {
  fetchSupportTicketsForOwner,
  type SupportTicket,
} from "@/lib/admin/support";

export type OwnerCrmRestaurant = AdminRestaurantManagementRow & {
  menuItemCount: number;
  categoryCount: number;
  orderCount: number;
  reservationCount: number;
  qrCodeCount: number;
  kitchenEnabled: boolean;
  onlineOrderingEnabled: boolean;
};

export type OwnerCrmSupportTicket = SupportTicket & {
  lastReplyAt: string | null;
};

export type OwnerCrmSummary = {
  restaurants: number;
  qrCodes: number;
  menuItems: number;
  orders: number;
  reservations: number;
  supportTickets: number;
  monthlyRevenue: number;
  currentPlan: string;
};

export type OwnerCrmProfile = {
  ownerId: string;
  ownerName: string | null;
  email: string | null;
  phone: string | null;
  joinedAt: string;
  currentPlan: string;
  subscriptionStatus: string | null;
  totalRestaurants: number;
  primaryRestaurant: OwnerCrmRestaurant | null;
  restaurants: OwnerCrmRestaurant[];
  summary: OwnerCrmSummary;
  supportTickets: OwnerCrmSupportTicket[];
  payments: PaymentItem[];
};

async function countRowsByRestaurant(
  table: string,
  restaurantIds: string[],
  archivedAware = false,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (restaurantIds.length === 0) return counts;

  let query = supabase
    .from(table)
    .select("restaurant_id")
    .in("restaurant_id", restaurantIds);

  if (archivedAware) {
    query = query.neq("is_archived", true);
  }

  const { data, error } = await query;
  if (error || !data) return counts;

  for (const row of data as Array<{ restaurant_id: string }>) {
    const id = row.restaurant_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

async function fetchLastReplyByTicket(
  ticketIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ticketIds.length === 0) return map;

  const { data, error } = await supabase
    .from("support_ticket_replies")
    .select("ticket_id, created_at")
    .in("ticket_id", ticketIds)
    .order("created_at", { ascending: false });

  if (error || !data) return map;

  for (const row of data as Array<{ ticket_id: string; created_at: string }>) {
    if (!map.has(row.ticket_id)) {
      map.set(row.ticket_id, row.created_at);
    }
  }
  return map;
}

export async function fetchOwnerCrmProfile(
  ownerId: string,
): Promise<
  { ok: true; data: OwnerCrmProfile } | { ok: false; message: string }
> {
  try {
    const restaurantsResult = await fetchAdminRestaurantsByOwnerId(ownerId);
    if (!restaurantsResult.ok) return restaurantsResult;

    const baseRestaurants = restaurantsResult.data;
    if (baseRestaurants.length === 0) {
      return { ok: false, message: "Owner account not found." };
    }

    const restaurantIds = baseRestaurants.map((r) => r.id);

    const [
      menuCounts,
      categoryCounts,
      orderCounts,
      reservationCounts,
      qrCounts,
      paymentsResult,
      ticketsResult,
    ] = await Promise.all([
      countRowsByRestaurant("menu_items", restaurantIds),
      countRowsByRestaurant("categories", restaurantIds),
      countRowsByRestaurant("orders", restaurantIds),
      countRowsByRestaurant("reservations", restaurantIds),
      countRowsByRestaurant("qr_codes", restaurantIds, true),
      fetchPaymentsForRestaurants(restaurantIds),
      fetchSupportTicketsForOwner(ownerId, restaurantIds),
    ]);

    const restaurants: OwnerCrmRestaurant[] = baseRestaurants.map((row) => ({
      ...row,
      menuItemCount: menuCounts.get(row.id) ?? 0,
      categoryCount: categoryCounts.get(row.id) ?? 0,
      orderCount: orderCounts.get(row.id) ?? 0,
      reservationCount: reservationCounts.get(row.id) ?? 0,
      qrCodeCount: qrCounts.get(row.id) ?? row.activeQrCodes,
      kitchenEnabled: row.raw.kitchen_display_enabled !== false,
      onlineOrderingEnabled: row.raw.online_ordering_enabled !== false,
    }));

    const primaryRestaurant =
      [...restaurants].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      )[0] ?? null;

    const planSource =
      restaurants.find((r) => r.isBillingPrimary) ??
      pickPrimaryByPlan(restaurants, (r) => r.createdAt);

    const ownerTickets = ticketsResult.ok ? ticketsResult.data : [];

    const lastReplyMap = await fetchLastReplyByTicket(
      ownerTickets.map((t) => t.id),
    );

    const supportTickets: OwnerCrmSupportTicket[] = ownerTickets
      .map((ticket) => ({
        ...ticket,
        lastReplyAt: lastReplyMap.get(ticket.id) ?? null,
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    const payments = paymentsResult.ok ? paymentsResult.data : [];

    const summary: OwnerCrmSummary = {
      restaurants: restaurants.length,
      qrCodes: restaurants.reduce((sum, r) => sum + r.qrCodeCount, 0),
      menuItems: restaurants.reduce((sum, r) => sum + r.menuItemCount, 0),
      orders: restaurants.reduce((sum, r) => sum + r.orderCount, 0),
      reservations: restaurants.reduce((sum, r) => sum + r.reservationCount, 0),
      supportTickets: supportTickets.length,
      monthlyRevenue: restaurants
        .filter((r) => r.isBillingPrimary && r.isActive && !r.isArchived)
        .reduce((sum, r) => sum + (r.monthlyPrice || 0), 0),
      currentPlan: planSource.plan,
    };

    return {
      ok: true,
      data: {
        ownerId,
        ownerName:
          primaryRestaurant?.ownerName ??
          restaurants.find((r) => r.ownerName)?.ownerName ??
          null,
        email:
          primaryRestaurant?.email ??
          restaurants.find((r) => r.email)?.email ??
          null,
        phone:
          primaryRestaurant?.phone ??
          restaurants.find((r) => r.phone)?.phone ??
          null,
        joinedAt: primaryRestaurant?.createdAt ?? restaurants[0]!.createdAt,
        currentPlan: planSource.plan,
        subscriptionStatus:
          planSource.subscriptionStatus ?? planSource.status ?? null,
        totalRestaurants: restaurants.length,
        primaryRestaurant,
        restaurants,
        summary,
        supportTickets,
        payments,
      },
    };
  } catch {
    return { ok: false, message: "Unable to load owner profile." };
  }
}
