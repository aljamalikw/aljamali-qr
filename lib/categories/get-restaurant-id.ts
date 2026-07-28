import { fetchUserRestaurant } from "@/lib/restaurants/setup";

export async function getCurrentRestaurantId(): Promise<string | null> {
  const restaurant = await fetchUserRestaurant();
  return restaurant?.id ?? null;
}
