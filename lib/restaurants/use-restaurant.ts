"use client";

import { useEffect, useState } from "react";
import { fetchImpersonationState } from "@/lib/admin/impersonation-client";
import { useRestaurantContext } from "@/lib/restaurants/restaurant-context";
import {
  getStoredActiveRestaurantId,
  pickActiveRestaurant,
  setStoredActiveRestaurantId,
} from "@/lib/restaurants/active-restaurant";
import {
  getRestaurantDisplayName,
  getRestaurantInitials,
  getRestaurantSubtitle,
} from "./display";
import type { Restaurant } from "./types";
import { supabase } from "@/lib/supabase";

/**
 * Active restaurant for the signed-in owner.
 * Inside the dashboard RestaurantProvider, state is shared (switcher-safe).
 * Outside the provider (onboarding, auth), falls back to a local fetch.
 */
export function useRestaurant() {
  const ctx = useRestaurantContext();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ctx) return;

    async function loadRestaurant() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        return;
      }

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

        const list = !error && data ? [data as Restaurant] : [];
        setRestaurants(list);
        setRestaurant(list[0] ?? null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: true });

      const list = !error && data ? (data as Restaurant[]) : [];
      const active = pickActiveRestaurant(list, getStoredActiveRestaurantId());
      if (active) setStoredActiveRestaurantId(active.id);
      setRestaurants(list);
      setRestaurant(active);
      setLoading(false);
    }

    void loadRestaurant();
  }, [ctx]);

  if (ctx) {
    return ctx;
  }

  return {
    restaurant,
    restaurants,
    restaurantCount: restaurants.length,
    loading,
    refresh: async () => [] as Restaurant[],
    selectRestaurant: (_id: string, _list?: Restaurant[]) => undefined,
    displayName: getRestaurantDisplayName(restaurant),
    initials: getRestaurantInitials(restaurant),
    subtitle: getRestaurantSubtitle(restaurant),
  };
}
