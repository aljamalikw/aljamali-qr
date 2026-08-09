"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchImpersonationState } from "@/lib/admin/impersonation-client";
import {
  getStoredActiveRestaurantId,
  pickActiveRestaurant,
  setStoredActiveRestaurantId,
} from "@/lib/restaurants/active-restaurant";
import {
  getRestaurantDisplayName,
  getRestaurantInitials,
  getRestaurantSubtitle,
} from "@/lib/restaurants/display";
import type { Restaurant } from "@/lib/restaurants/types";
import { supabase } from "@/lib/supabase";

export type RestaurantContextValue = {
  restaurant: Restaurant | null;
  restaurants: Restaurant[];
  restaurantCount: number;
  loading: boolean;
  refresh: () => Promise<Restaurant[]>;
  selectRestaurant: (restaurantId: string, list?: Restaurant[]) => void;
  displayName: string;
  initials: string;
  subtitle: string;
};

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

export function RestaurantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setRestaurants([]);
      setRestaurant(null);
      setLoading(false);
      return [];
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
      return list;
    }

    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("owner_id", session.user.id)
      .order("created_at", { ascending: true });

    const list = !error && data ? (data as Restaurant[]) : [];
    const active = pickActiveRestaurant(list, getStoredActiveRestaurantId());
    if (active) {
      setStoredActiveRestaurantId(active.id);
    }
    setRestaurants(list);
    setRestaurant(active);
    setLoading(false);
    return list;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectRestaurant = useCallback(
    (restaurantId: string, list?: Restaurant[]) => {
      const source = list ?? restaurants;
      const next = source.find((r) => r.id === restaurantId);
      if (!next) return;
      setStoredActiveRestaurantId(next.id);
      setRestaurant(next);
    },
    [restaurants],
  );

  const value = useMemo<RestaurantContextValue>(() => {
    return {
      restaurant,
      restaurants,
      restaurantCount: restaurants.length,
      loading,
      refresh,
      selectRestaurant,
      displayName: getRestaurantDisplayName(restaurant),
      initials: getRestaurantInitials(restaurant),
      subtitle: getRestaurantSubtitle(restaurant),
    };
  }, [restaurant, restaurants, loading, refresh, selectRestaurant]);

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurantContext(): RestaurantContextValue | null {
  return useContext(RestaurantContext);
}
