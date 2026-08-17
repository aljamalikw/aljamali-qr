import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeWhatsAppPhone } from "@/lib/marketing/whatsapp/phone";
import { supabase } from "@/lib/supabase";

export const CUSTOMER_TAG_PRESETS = [
  "VIP",
  "Regular",
  "Birthday",
  "Inactive",
  "High Spender",
] as const;

export type CustomerTagPreset = (typeof CUSTOMER_TAG_PRESETS)[number];

export type CustomerRecord = {
  id: string;
  restaurant_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  notes: string | null;
  tags: string[] | null;
  loyalty_points: number;
  total_orders: number;
  total_reservations: number;
  total_spent: number | string;
  average_order: number | string;
  first_visit: string | null;
  last_visit: string | null;
  favorite_item: string | null;
  favorite_category: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  restaurantId: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  notes: string | null;
  tags: string[];
  loyaltyPoints: number;
  totalOrders: number;
  totalReservations: number;
  totalSpent: number;
  averageOrder: number;
  firstVisit: string | null;
  lastVisit: string | null;
  favoriteItem: string | null;
  favoriteCategory: string | null;
  metadata: CustomerMetadata;
  createdAt: string;
  updatedAt: string;
};

export type CustomerMetadata = {
  itemCounts?: Record<string, number>;
  categoryCounts?: Record<string, number>;
  loyalty?: {
    tier?: string | null;
    lifetimePoints?: number;
    rewardsUnlocked?: string[];
    enrolled?: boolean;
    enrolledAt?: string | null;
  };
  marketing_opt_in?: boolean;
  noteHistory?: Array<{
    at: string;
    note: string;
  }>;
  [key: string]: unknown;
};

export type CustomerSyncItem = {
  itemName: string;
  menuItemId?: string | null;
  quantity: number;
};

export type CustomerSyncInput = {
  restaurantId: string;
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  visitAt?: string;
  orderSpent?: number;
  reservationIncrement?: number;
  items?: CustomerSyncItem[];
  /** Persist marketing consent on metadata.marketing_opt_in */
  marketingOptIn?: boolean | null;
  /** Enroll into loyalty metadata (points awarded separately). */
  joinLoyalty?: boolean;
  /** Optional note appended to noteHistory / notes when creating. */
  notes?: string | null;
};

export type CustomerFilter =
  | "all"
  | "VIP"
  | "Regular"
  | "Inactive"
  | "High Spender"
  | "Birthday";

export type CustomerSummary = {
  customers: number;
  returningCustomers: number;
  averageSpend: number;
  topCustomerName: string | null;
  topCustomerSpent: number;
};

export type CustomerTimelineItem = {
  id: string;
  type: "order" | "reservation" | "support" | "loyalty" | "whatsapp";
  title: string;
  description: string;
  at: string;
  meta?: Record<string, unknown>;
};

function asObject(value: unknown): CustomerMetadata {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as CustomerMetadata;
  }
  return {};
}

export function normalizePhone(phone: string | null | undefined): string | null {
  // Same rules as WhatsApp so CRM lookup / chat / checkout stay aligned.
  return normalizeWhatsAppPhone(phone);
}

export function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase() ?? "";
  return trimmed || null;
}

export function mapCustomer(row: CustomerRecord): Customer {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    birthday: row.birthday,
    notes: row.notes,
    tags: Array.isArray(row.tags) ? row.tags : [],
    loyaltyPoints: Number(row.loyalty_points ?? 0),
    totalOrders: Number(row.total_orders ?? 0),
    totalReservations: Number(row.total_reservations ?? 0),
    totalSpent: Number(row.total_spent ?? 0),
    averageOrder: Number(row.average_order ?? 0),
    firstVisit: row.first_visit,
    lastVisit: row.last_visit,
    favoriteItem: row.favorite_item,
    favoriteCategory: row.favorite_category,
    metadata: asObject(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function pickFavorite(counts: Record<string, number> | undefined): string | null {
  if (!counts) return null;
  let best: string | null = null;
  let bestCount = 0;
  for (const [key, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

function mergeCounts(
  current: Record<string, number> | undefined,
  increments: Record<string, number>,
): Record<string, number> {
  const next = { ...(current ?? {}) };
  for (const [key, value] of Object.entries(increments)) {
    if (!key || value <= 0) continue;
    next[key] = (next[key] ?? 0) + value;
  }
  return next;
}

async function resolveCategoryNames(
  client: SupabaseClient,
  menuItemIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const ids = [...new Set(menuItemIds.filter(Boolean))];
  if (ids.length === 0) return map;

  const { data } = await client
    .from("menu_items")
    .select("id, categories(name)")
    .in("id", ids);

  for (const row of (data ?? []) as Array<{
    id: string;
    categories:
      | { name: string | null }
      | { name: string | null }[]
      | null;
  }>) {
    const category = Array.isArray(row.categories)
      ? row.categories[0]
      : row.categories;
    const name = category?.name?.trim();
    if (name) map.set(row.id, name);
  }
  return map;
}

function applyAutoTags(customer: {
  tags: string[];
  totalOrders: number;
  totalSpent: number;
  lastVisit: string | null;
}): string[] {
  const tags = new Set(customer.tags.filter((tag) => tag !== "Inactive"));

  if (customer.totalOrders >= 3) tags.add("Regular");
  if (customer.totalSpent >= 50) tags.add("High Spender");

  if (customer.lastVisit) {
    const last = new Date(customer.lastVisit).getTime();
    const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
    if (Number.isFinite(days) && days >= 60) tags.add("Inactive");
  }

  return [...tags];
}

/**
 * Upsert/update a restaurant customer from an order or reservation event.
 * Safe to fire-and-forget. Never throws to callers.
 */
export async function syncCustomerEvent(
  input: CustomerSyncInput,
  client: SupabaseClient = supabase,
): Promise<{ ok: true; customerId: string | null } | { ok: false; message: string }> {
  try {
    const phone = normalizePhone(input.phone);
    const email = normalizeEmail(input.email);
    const fullName = input.fullName?.trim() || null;

    if (!input.restaurantId || (!phone && !email)) {
      return { ok: true, customerId: null };
    }

    const visitAt = input.visitAt ?? new Date().toISOString();
    const orderSpent = Math.max(0, Number(input.orderSpent ?? 0));
    const reservationIncrement = Math.max(
      0,
      Number(input.reservationIncrement ?? 0),
    );

    let existing: CustomerRecord | null = null;

    if (phone) {
      const { data } = await client
        .from("customers")
        .select("*")
        .eq("restaurant_id", input.restaurantId)
        .eq("phone", phone)
        .maybeSingle();
      existing = (data as CustomerRecord | null) ?? null;
    }

    if (!existing && email) {
      const { data } = await client
        .from("customers")
        .select("*")
        .eq("restaurant_id", input.restaurantId)
        .ilike("email", email)
        .maybeSingle();
      existing = (data as CustomerRecord | null) ?? null;
    }

    const itemIncrements: Record<string, number> = {};
    const categoryIncrements: Record<string, number> = {};
    const menuItemIds = (input.items ?? [])
      .map((item) => item.menuItemId)
      .filter((id): id is string => Boolean(id));
    const categoryByItem = await resolveCategoryNames(client, menuItemIds);

    for (const item of input.items ?? []) {
      const name = item.itemName?.trim();
      if (name) {
        itemIncrements[name] = (itemIncrements[name] ?? 0) + Math.max(1, item.quantity);
      }
      if (item.menuItemId) {
        const category = categoryByItem.get(item.menuItemId);
        if (category) {
          categoryIncrements[category] =
            (categoryIncrements[category] ?? 0) + Math.max(1, item.quantity);
        }
      }
    }

    const isOrderEvent =
      input.orderSpent !== undefined || (input.items?.length ?? 0) > 0;

    if (!existing) {
      const note = input.notes?.trim() || null;
      const joinLoyalty = Boolean(input.joinLoyalty);
      const metadata: CustomerMetadata = {
        itemCounts: itemIncrements,
        categoryCounts: categoryIncrements,
        loyalty: {
          tier: null,
          lifetimePoints: 0,
          rewardsUnlocked: [],
          enrolled: joinLoyalty,
          enrolledAt: joinLoyalty ? visitAt : null,
        },
        marketing_opt_in: Boolean(input.marketingOptIn),
        ...(note
          ? { noteHistory: [{ at: visitAt, note }] }
          : {}),
      };
      const ordersCount = isOrderEvent ? 1 : 0;
      const spent = orderSpent;
      const tags = applyAutoTags({
        tags: [],
        totalOrders: ordersCount,
        totalSpent: spent,
        lastVisit: visitAt,
      });

      const { data, error } = await client
        .from("customers")
        .insert({
          restaurant_id: input.restaurantId,
          full_name: fullName,
          phone,
          email,
          notes: note,
          tags,
          total_orders: ordersCount,
          total_reservations: reservationIncrement,
          total_spent: spent,
          average_order: ordersCount > 0 ? spent / ordersCount : 0,
          first_visit: visitAt,
          last_visit: visitAt,
          favorite_item: pickFavorite(itemIncrements),
          favorite_category: pickFavorite(categoryIncrements),
          metadata,
        })
        .select("id")
        .maybeSingle();

      if (error) return { ok: false, message: error.message };
      return { ok: true, customerId: (data as { id: string } | null)?.id ?? null };
    }

    const current = mapCustomer(existing);
    const alreadyEnrolled = Boolean(current.metadata.loyalty?.enrolled);
    const joinLoyalty = Boolean(input.joinLoyalty);
    const note = input.notes?.trim() || null;
    const noteHistory = Array.isArray(current.metadata.noteHistory)
      ? [...current.metadata.noteHistory]
      : [];
    if (note) {
      noteHistory.unshift({ at: visitAt, note });
    }

    const metadata: CustomerMetadata = {
      ...current.metadata,
      itemCounts: mergeCounts(current.metadata.itemCounts, itemIncrements),
      categoryCounts: mergeCounts(
        current.metadata.categoryCounts,
        categoryIncrements,
      ),
      loyalty: {
        tier: current.metadata.loyalty?.tier ?? null,
        lifetimePoints: current.metadata.loyalty?.lifetimePoints ?? 0,
        rewardsUnlocked: current.metadata.loyalty?.rewardsUnlocked ?? [],
        enrolled: alreadyEnrolled || joinLoyalty,
        enrolledAt:
          current.metadata.loyalty?.enrolledAt ??
          (joinLoyalty && !alreadyEnrolled ? visitAt : null),
      },
      marketing_opt_in:
        input.marketingOptIn === undefined || input.marketingOptIn === null
          ? Boolean(current.metadata.marketing_opt_in)
          : Boolean(input.marketingOptIn),
      noteHistory: noteHistory.slice(0, 50),
    };

    const nextOrders = current.totalOrders + (isOrderEvent ? 1 : 0);
    const nextReservations = current.totalReservations + reservationIncrement;
    const nextSpent = current.totalSpent + orderSpent;
    const nextAverage = nextOrders > 0 ? nextSpent / nextOrders : 0;
    const nextTags = applyAutoTags({
      tags: current.tags,
      totalOrders: nextOrders,
      totalSpent: nextSpent,
      lastVisit: visitAt,
    });

    const { data, error } = await client
      .from("customers")
      .update({
        full_name: fullName || current.fullName,
        phone: phone || current.phone,
        email: email || current.email,
        notes: note || current.notes,
        tags: nextTags,
        total_orders: nextOrders,
        total_reservations: nextReservations,
        total_spent: nextSpent,
        average_order: nextAverage,
        first_visit: current.firstVisit ?? visitAt,
        last_visit: visitAt,
        favorite_item: pickFavorite(metadata.itemCounts) ?? current.favoriteItem,
        favorite_category:
          pickFavorite(metadata.categoryCounts) ?? current.favoriteCategory,
        metadata,
      })
      .eq("id", current.id)
      .select("id")
      .maybeSingle();

    if (error) return { ok: false, message: error.message };
    return { ok: true, customerId: (data as { id: string } | null)?.id ?? null };
  } catch {
    return { ok: false, message: "Unable to sync customer." };
  }
}
