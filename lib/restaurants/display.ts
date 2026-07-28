import { getUserInitials } from "@/lib/auth/user-display";
import type { Restaurant } from "./types";

export const RESTAURANT_SETUP_TITLE = "Complete Your Restaurant Setup";
export const RESTAURANT_SUBTITLE = "Digital Menu";

export function getRestaurantDisplayName(restaurant: Restaurant | null): string {
  if (!restaurant) return RESTAURANT_SETUP_TITLE;

  const name = restaurant.restaurant_name?.trim();
  if (!name) return RESTAURANT_SETUP_TITLE;

  return name;
}

export function getRestaurantSubtitle(_restaurant: Restaurant | null): string {
  return RESTAURANT_SUBTITLE;
}

export function getRestaurantInitials(restaurant: Restaurant | null): string {
  return getUserInitials(getRestaurantDisplayName(restaurant));
}
