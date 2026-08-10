import { supabase } from "@/lib/supabase";
import { buildCsv } from "@/lib/utils/csv";
import type { AppRole } from "@/lib/auth/roles";
import type { Restaurant } from "@/lib/restaurants/types";
import {
  firstNonEmpty,
  groupItemsByOwnerId,
  pickPrimaryByPlan,
  sortOwnerRowsByName,
} from "@/lib/admin/group-by-owner";

/** Flat per-restaurant owner row (backup export / legacy). */
export type OwnerItem = {
  ownerId: string;
  ownerName: string | null;
  restaurantId: string;
  restaurantName: string | null;
  slug: string | null;
  email: string | null;
  phone: string | null;
  plan: string | null;
  role: AppRole;
  isActive: boolean;
  city: string | null;
  createdAt: string;
};

export type OwnerAccountRestaurant = {
  restaurantId: string;
  restaurantName: string | null;
  slug: string | null;
  isActive: boolean;
  createdAt: string;
};

/** One CRM row per owner account (multi-restaurant aware). */
export type OwnerAccount = {
  ownerId: string;
  ownerName: string | null;
  email: string | null;
  phone: string | null;
  plan: string;
  isActive: boolean;
  joinedAt: string;
  restaurantCount: number;
  restaurants: OwnerAccountRestaurant[];
  role: AppRole;
  city: string | null;
};

type ProfileRow = {
  id: string;
  role: AppRole;
};

const ERROR = "Unable to load restaurant owners. Please try again.";

function mapOwner(restaurant: Restaurant, role: AppRole | undefined): OwnerItem {
  return {
    ownerId: restaurant.owner_id,
    ownerName: restaurant.owner_name ?? null,
    restaurantId: restaurant.id,
    restaurantName: restaurant.restaurant_name,
    slug: restaurant.slug ?? null,
    email: restaurant.email,
    phone: restaurant.phone,
    plan: restaurant.subscription_plan ?? "Starter",
    role: role ?? "restaurant_owner",
    isActive: restaurant.is_active !== false,
    city: restaurant.city ?? null,
    createdAt: restaurant.created_at,
  };
}

export function groupOwnersByAccount(items: OwnerItem[]): OwnerAccount[] {
  const byOwner = groupItemsByOwnerId(items);
  const accounts: OwnerAccount[] = [];

  for (const [ownerId, ownerItems] of byOwner) {
    const primary = pickPrimaryByPlan(
      ownerItems.map((item) => ({
        ...item,
        plan: item.plan ?? "Starter",
      })),
      (item) => item.createdAt,
    );

    const restaurants = [...ownerItems]
      .sort((a, b) =>
        (a.restaurantName ?? "").localeCompare(b.restaurantName ?? ""),
      )
      .map((item) => ({
        restaurantId: item.restaurantId,
        restaurantName: item.restaurantName,
        slug: item.slug,
        isActive: item.isActive,
        createdAt: item.createdAt,
      }));

    const joinedAt = [...ownerItems].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    )[0]!.createdAt;

    accounts.push({
      ownerId,
      ownerName: firstNonEmpty(...ownerItems.map((i) => i.ownerName)),
      email: firstNonEmpty(...ownerItems.map((i) => i.email)),
      phone: firstNonEmpty(...ownerItems.map((i) => i.phone)),
      plan: primary.plan ?? "Starter",
      isActive: ownerItems.some((item) => item.isActive),
      joinedAt,
      restaurantCount: restaurants.length,
      restaurants,
      role: primary.role,
      city: firstNonEmpty(...ownerItems.map((i) => i.city)),
    });
  }

  return sortOwnerRowsByName(accounts);
}

export async function fetchOwners(): Promise<
  { ok: true; data: OwnerItem[] } | { ok: false; message: string }
> {
  try {
    const { data: restaurants, error: restaurantsError } = await supabase
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });

    if (restaurantsError) {
      return { ok: false, message: restaurantsError.message || ERROR };
    }

    const rows = (restaurants ?? []) as Restaurant[];
    const ownerIds = [...new Set(rows.map((r) => r.owner_id))];

    let roleByOwner = new Map<string, AppRole>();
    if (ownerIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, role")
        .in("id", ownerIds);

      if (!profilesError && profiles) {
        roleByOwner = new Map(
          (profiles as ProfileRow[]).map((p) => [p.id, p.role]),
        );
      }
    }

    return {
      ok: true,
      data: rows.map((restaurant) =>
        mapOwner(restaurant, roleByOwner.get(restaurant.owner_id)),
      ),
    };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function fetchOwnerAccounts(): Promise<
  { ok: true; data: OwnerAccount[] } | { ok: false; message: string }
> {
  const result = await fetchOwners();
  if (!result.ok) return result;
  return { ok: true, data: groupOwnersByAccount(result.data) };
}

export function exportOwnersToCsv(items: OwnerItem[]): string {
  const headers = [
    "Restaurant",
    "Email",
    "Phone",
    "Plan",
    "Status",
    "City",
    "Created",
  ];

  const rows = items.map((item) => [
    item.restaurantName?.trim() || "Unnamed restaurant",
    item.email ?? "",
    item.phone ?? "",
    item.plan ?? "",
    item.isActive ? "Active" : "Suspended",
    item.city ?? "",
    item.createdAt,
  ]);

  return buildCsv(headers, rows);
}

export function exportOwnerAccountsToCsv(items: OwnerAccount[]): string {
  const headers = [
    "Owner Name",
    "Owner Email",
    "Phone",
    "Plan",
    "Status",
    "Joined",
    "Restaurant Count",
    "Restaurants",
  ];

  const rows = items.map((item) => [
    item.ownerName?.trim() || "Unnamed owner",
    item.email ?? "",
    item.phone ?? "",
    item.plan,
    item.isActive ? "Active" : "Suspended",
    item.joinedAt,
    String(item.restaurantCount),
    item.restaurants
      .map((r) => r.restaurantName?.trim() || "Unnamed restaurant")
      .join(", "),
  ]);

  return buildCsv(headers, rows);
}
