import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapCustomer,
  normalizePhone,
  type Customer,
  type CustomerRecord,
} from "@/lib/customers/sync-customer";

export type PublicCustomerLookup = {
  fullName: string | null;
  email: string | null;
  lastVisit: string | null;
  totalOrders: number;
  loyaltyPoints: number;
  enrolledInLoyalty: boolean;
};

/**
 * Lookup a restaurant customer by phone for public checkout autofill.
 * Returns a privacy-limited payload (no notes/tags/metadata dump).
 */
export async function lookupCustomerByPhone(
  client: SupabaseClient,
  restaurantId: string,
  phoneRaw: string,
): Promise<
  | { ok: true; customer: PublicCustomerLookup | null }
  | { ok: false; message: string }
> {
  try {
    const phone = normalizePhone(phoneRaw);
    if (!restaurantId || !phone) {
      return { ok: true, customer: null };
    }

    const { data, error } = await client
      .from("customers")
      .select(
        "full_name, email, last_visit, total_orders, loyalty_points, metadata",
      )
      .eq("restaurant_id", restaurantId)
      .eq("phone", phone)
      .maybeSingle();

    if (error) return { ok: false, message: error.message };
    if (!data) return { ok: true, customer: null };

    const row = data as Pick<
      CustomerRecord,
      | "full_name"
      | "email"
      | "last_visit"
      | "total_orders"
      | "loyalty_points"
      | "metadata"
    >;

    const mapped = mapCustomer({
      id: "lookup",
      restaurant_id: restaurantId,
      full_name: row.full_name,
      phone,
      email: row.email,
      birthday: null,
      notes: null,
      tags: [],
      loyalty_points: row.loyalty_points,
      total_orders: row.total_orders,
      total_reservations: 0,
      total_spent: 0,
      average_order: 0,
      first_visit: null,
      last_visit: row.last_visit,
      favorite_item: null,
      favorite_category: null,
      metadata: row.metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as CustomerRecord);

    return {
      ok: true,
      customer: {
        fullName: mapped.fullName,
        email: mapped.email,
        lastVisit: mapped.lastVisit,
        totalOrders: mapped.totalOrders,
        loyaltyPoints: mapped.loyaltyPoints,
        enrolledInLoyalty: Boolean(mapped.metadata.loyalty?.enrolled),
      },
    };
  } catch {
    return { ok: false, message: "Unable to look up customer." };
  }
}

export type { Customer };
