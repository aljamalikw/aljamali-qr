const STORAGE_KEY = "aj_active_restaurant_id";

export function getStoredActiveRestaurantId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)?.trim();
    return value || null;
  } catch {
    return null;
  }
}

export function setStoredActiveRestaurantId(restaurantId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, restaurantId);
  } catch {
    // Ignore quota / private mode failures.
  }
}

export function pickActiveRestaurant<T extends { id: string }>(
  restaurants: T[],
  preferredId?: string | null,
): T | null {
  if (restaurants.length === 0) return null;
  const preferred =
    preferredId?.trim() || getStoredActiveRestaurantId() || null;
  if (preferred) {
    const match = restaurants.find((r) => r.id === preferred);
    if (match) return match;
  }
  return restaurants[0] ?? null;
}
