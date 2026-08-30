import type { User } from "@supabase/supabase-js";
import { fetchIsPlatformAdmin } from "@/lib/auth/get-user-role";
import { supabase } from "@/lib/supabase";

export const DELETED_OWNER_ACCOUNT_TITLE = "Account doesn't exist";
export const DELETED_OWNER_ACCOUNT_DETAIL =
  "This restaurant account has been deleted or is no longer available.";
export const DELETED_OWNER_ACCOUNT_TOAST = `${DELETED_OWNER_ACCOUNT_TITLE}. ${DELETED_OWNER_ACCOUNT_DETAIL}`;

export type OwnerRestaurantAccess =
  | "admin"
  | "has_restaurant"
  | "no_restaurant"
  | "unknown";

/**
 * After Auth succeeds, confirm the user still owns a restaurant row.
 * Query errors return "unknown" so a transient failure does not lock anyone out.
 */
export async function resolveOwnerRestaurantAccess(
  user: User | null | undefined,
): Promise<OwnerRestaurantAccess> {
  if (!user) return "no_restaurant";
  if (await fetchIsPlatformAdmin(user)) return "admin";

  const { data, error } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1);

  if (error) return "unknown";
  return data?.length ? "has_restaurant" : "no_restaurant";
}
