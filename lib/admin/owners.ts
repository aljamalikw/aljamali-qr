import { supabase } from "@/lib/supabase";
import { buildCsv } from "@/lib/utils/csv";
import type { AppRole } from "@/lib/auth/roles";
import type { Restaurant } from "@/lib/restaurants/types";

export type OwnerItem = {
  ownerId: string;
  restaurantId: string;
  restaurantName: string | null;
  email: string | null;
  phone: string | null;
  plan: string | null;
  role: AppRole;
  isActive: boolean;
  city: string | null;
  createdAt: string;
};

type ProfileRow = {
  id: string;
  role: AppRole;
};

const ERROR = "Unable to load restaurant owners. Please try again.";

function mapOwner(restaurant: Restaurant, role: AppRole | undefined): OwnerItem {
  return {
    ownerId: restaurant.owner_id,
    restaurantId: restaurant.id,
    restaurantName: restaurant.restaurant_name,
    email: restaurant.email,
    phone: restaurant.phone,
    plan: restaurant.subscription_plan ?? "Starter",
    role: role ?? "restaurant_owner",
    isActive: restaurant.is_active !== false,
    city: restaurant.city ?? null,
    createdAt: restaurant.created_at,
  };
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
