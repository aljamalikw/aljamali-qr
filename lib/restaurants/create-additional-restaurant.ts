import { logActivity } from "@/lib/admin/activity-log";
import { supabase } from "@/lib/supabase";
import { STARTER_RESTAURANT_LIMIT_MESSAGE } from "@/lib/subscriptions/plans";
import type { Restaurant } from "./types";

export type CreateAdditionalRestaurantInput = {
  restaurantName: string;
  sourceRestaurantId?: string | null;
};

export async function createAdditionalRestaurant(
  input: CreateAdditionalRestaurantInput,
): Promise<
  { ok: true; restaurant: Restaurant } | { ok: false; message: string }
> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { ok: false, message: "You must be signed in to continue." };
    }

    const response = await fetch("/api/restaurants/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        restaurantName: input.restaurantName,
        sourceRestaurantId: input.sourceRestaurantId ?? undefined,
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      data?: Restaurant;
    };

    if (!response.ok || !body.ok || !body.data) {
      return {
        ok: false,
        message:
          body.error ||
          (response.status === 403
            ? STARTER_RESTAURANT_LIMIT_MESSAGE
            : "Unable to create restaurant."),
      };
    }

    void logActivity({
      action: "restaurant_created",
      restaurantId: body.data.id,
      ownerId: body.data.owner_id,
      restaurantName: body.data.restaurant_name,
      entityType: "restaurant",
      entityId: body.data.id,
      newValues: {
        restaurant_name: body.data.restaurant_name,
        subscription_plan: body.data.subscription_plan,
      },
    });

    return { ok: true, restaurant: body.data };
  } catch {
    return { ok: false, message: "Unable to create restaurant." };
  }
}
