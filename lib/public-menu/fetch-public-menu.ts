import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
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

/**
 * Canonical plan for public menu gating.
 * Prefer restaurant_subscriptions.plan (same source as Billing / admin).
 * restaurants.subscription_plan is only a mirror and can be stale.
 */
function resolvePublicSubscriptionPlan(
  subscriptionPlan: string | null | undefined,
  restaurantPlan: string | null | undefined,
): string {
  const fromSub = subscriptionPlan?.trim();
  if (fromSub) return fromSub;
  const fromRestaurant = restaurantPlan?.trim();
  if (fromRestaurant) return fromRestaurant;
  return "Starter";
}

function isPublicMenuAllowed(
  restaurant: Restaurant,
  subscription: SubscriptionPublicRow | null,
): boolean {
  if (restaurant.is_active === false) return false;

  if (!subscription) {
    // No subscription row: allow during bootstrap; locks apply once row exists.
    return true;
  }

  const access = getSubscriptionAccess({
    plan: resolvePublicSubscriptionPlan(
      subscription.plan,
      restaurant.subscription_plan,
    ),
    status: subscription.status,
    trialStartedAt: subscription.trial_started_at,
    trialEndsAt: subscription.trial_ends_at,
    gracePeriodDays: subscription.grace_period_days,
    renewalDate: subscription.renewal_date,
    cancelledAt: subscription.cancelled_at,
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
    console.info("[PUBLIC MENU TRACE] restaurant not found", {
      slug: normalizedSlug,
    });
    return null;
  }

  const typedRestaurant = restaurantRow as Restaurant;

  // Anon RLS cannot read restaurant_subscriptions. Use service role (server-only)
  // so public menu gets the same plan Billing shows.
  let subscription: SubscriptionPublicRow | null = null;
  try {
    const admin = createServiceSupabaseClient();
    const { data } = await admin
      .from("restaurant_subscriptions")
      .select(
        "plan, status, trial_started_at, trial_ends_at, grace_period_days, renewal_date, cancelled_at",
      )
      .eq("restaurant_id", typedRestaurant.id)
      .maybeSingle();
    subscription = (data as SubscriptionPublicRow | null) ?? null;
  } catch {
    subscription = null;
  }

  if (!isPublicMenuAllowed(typedRestaurant, subscription)) {
    console.info("[PUBLIC MENU TRACE] public menu blocked by subscription/active flag", {
      slug: normalizedSlug,
      restaurantId: typedRestaurant.id,
      isActive: typedRestaurant.is_active,
      subscriptionStatus: subscription?.status ?? null,
      subscriptionPlan: subscription?.plan ?? null,
    });
    return null;
  }

  const restaurant = mapRestaurantToPublic({
    ...typedRestaurant,
    subscription_plan: resolvePublicSubscriptionPlan(
      subscription?.plan,
      typedRestaurant.subscription_plan,
    ),
  });

  // Use the service-role client for menu data so the public menu works
  // regardless of whether anon SELECT policies exist on categories / menu_items.
  // The restaurant was already verified by slug above, so this is safe.
  const adminClient = createServiceSupabaseClient();

  const { data: categoryRows, error: categoriesError } = await adminClient
    .from("categories")
    .select("*")
    .eq("restaurant_id", typedRestaurant.id)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (categoriesError) {
    console.info("[PUBLIC MENU TRACE] categories query failed", {
      slug: normalizedSlug,
      restaurantId: typedRestaurant.id,
    });
    return null;
  }

  const { data: itemRows, error: itemsError } = await adminClient
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", typedRestaurant.id)
    .eq("is_available", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (itemsError) {
    console.info("[PUBLIC MENU TRACE] menu items query failed", {
      slug: normalizedSlug,
      restaurantId: typedRestaurant.id,
    });
    return null;
  }

  const rawCategories = (categoryRows as CategoryRow[]) ?? [];
  const rawItems = (itemRows as MenuItemRow[]) ?? [];

  const categories = rawCategories.map(mapCategoryRowToPublic);
  const items = rawItems
    .map(mapMenuItemRowToPublic)
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const groups = groupMenuItemsByCategory(categories, items);
  const publishedItems = items;

  console.info("[PUBLIC MENU TRACE]", {
    slug: normalizedSlug,
    restaurantFound: true,
    restaurantId: typedRestaurant.id,
    restaurantName: typedRestaurant.restaurant_name ?? null,
    filters: {
      categories: { restaurant_id: typedRestaurant.id, is_active: true },
      menuItems: { restaurant_id: typedRestaurant.id, is_available: true },
    },
    categoriesCount: rawCategories.length,
    menuItemsCount: rawItems.length,
    mappedPublishedCount: items.length,
    groupedItemCount: groups.reduce((sum, group) => sum + group.items.length, 0),
    nullCategoryCount: rawItems.filter((row) => !row.category_id).length,
  });

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
