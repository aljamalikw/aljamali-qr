import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CategoryRow } from "@/lib/categories/types";
import type { MenuItemRow } from "@/lib/menu-items/types";
import type { Restaurant } from "@/lib/restaurants/types";
import {
  groupMenuItemsByCategory,
  mapCategoryRowToPublic,
  mapMenuItemRowToPublic,
  mapRestaurantToPublic,
} from "./mappers";
import type { PublicMenuData } from "./types";

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
