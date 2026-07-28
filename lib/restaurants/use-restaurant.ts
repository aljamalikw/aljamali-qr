"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  getRestaurantDisplayName,
  getRestaurantInitials,
  getRestaurantSubtitle,
} from "./display";
import type { Restaurant } from "./types";

export function useRestaurant() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRestaurant() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", session.user.id)
        .maybeSingle();

      if (!error && data) {
        setRestaurant(data as Restaurant);
      }

      setLoading(false);
    }

    loadRestaurant();
  }, []);

  const displayName = getRestaurantDisplayName(restaurant);
  const initials = getRestaurantInitials(restaurant);
  const subtitle = getRestaurantSubtitle(restaurant);

  return {
    restaurant,
    loading,
    displayName,
    initials,
    subtitle,
  };
}
