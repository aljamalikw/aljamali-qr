import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CategoryRow } from "@/lib/categories/types";
import type { MenuItemRow } from "@/lib/menu-items/types";
import type { Restaurant } from "@/lib/restaurants/types";
import { getSubscriptionAccess } from "@/lib/subscriptions/engine";
import {
  groupMenuItemsByCategory,
  mapCategoryRowToPublic,
  mapMenuItemRowToPublic,
  mapRestaurantToPublic,
} from "./mappers";
import type { PublicMenuData } from "./types";

type SubscriptionPublicRow = {
  plan: string;
  status: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  grace_period_days: number | null;
  renewal_date: string | null;
  cancelled_at: string | null;
};

async function isPublicMenuAllowed(
  restaurant: Restaurant,
): Promise<boolean> {
  if (restaurant.is_active === false) return false;

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("restaurant_subscriptions")
    .select(
      "plan, status, trial_started_at, trial_ends_at, grace_period_days, renewal_date, cancelled_at",
    )
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  if (!data) {
    // No subscription row: allow during bootstrap; locks apply once row exists.
    return true;
  }

  const row = data as SubscriptionPublicRow;
  const access = getSubscriptionAccess({
    plan: row.plan ?? restaurant.subscription_plan,
    status: row.status,
    trialStartedAt: row.trial_started_at,
    trialEndsAt: row.trial_ends_at,
    gracePeriodDays: row.grace_period_days,
    renewalDate: row.renewal_date,
    cancelledAt: row.cancelled_at,
  });

  return access.publicMenuOnline;
}

export async function fetchPublicMenuBySlug(
  slug: string,
): Promise<PublicMenuData | null> {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return null;

  const supabase = createServerSupabaseClient();

  const { data: restaurantRow, error: restaurantError } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (restaurantError || !restaurantRow) {
    return null;
  }

  const restaurant = mapRestaurantToPublic(restaurantRow as Restaurant);

  if (!(await isPublicMenuAllowed(restaurantRow as Restaurant))) {
    return null;
  }

  const { data: categoryRows, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (categoriesError) {
    return null;
  }

  const { data: itemRows, error: itemsError } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .eq("is_available", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (itemsError) {
    return null;
  }

  const categories = (categoryRows as CategoryRow[]).map(mapCategoryRowToPublic);
  const items = (itemRows as MenuItemRow[])
    .map(mapMenuItemRowToPublic)
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const groups = groupMenuItemsByCategory(categories, items);
  const categoryIds = new Set(categories.map((category) => category.id));
  const publishedItems = items.filter((item) => categoryIds.has(item.categoryId));

  return {
    restaurant,
    groups,
    totalItems: groups.reduce((sum, group) => sum + group.items.length, 0),
    popularItems: publishedItems.filter((item) => item.popular),
    recommendedItems: publishedItems.filter((item) => item.recommended),
    chefSpecialItems: publishedItems.filter((item) => item.chefSpecial),
    offerItems: publishedItems.filter((item) => item.discountPrice !== null),
  };
}
