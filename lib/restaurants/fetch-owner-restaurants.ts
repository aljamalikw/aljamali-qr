import { fetchImpersonationState } from "@/lib/admin/impersonation-client";
import { supabase } from "@/lib/supabase";
import { pickActiveRestaurant } from "./active-restaurant";
import type { Restaurant } from "./types";

export async function fetchOwnerRestaurants(): Promise<Restaurant[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return [];

  if (typeof window !== "undefined") {
    const impersonation = await fetchImpersonationState();
    if (
      impersonation.ok &&
      impersonation.data.active &&
      impersonation.data.restaurantId
    ) {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", impersonation.data.restaurantId)
        .maybeSingle();
      if (!error && data) return [data as Restaurant];
      return [];
    }
  }

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", session.user.id)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as Restaurant[];
}

export async function fetchActiveOwnerRestaurant(): Promise<Restaurant | null> {
  const restaurants = await fetchOwnerRestaurants();
  return pickActiveRestaurant(restaurants);
}
