import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  isAdminRole,
  isAppRole,
  type AppRole,
} from "./roles";

function roleFromUserMetadata(user: User | null | undefined): AppRole | null {
  if (!user) return null;

  const appRole = user.app_metadata?.role;
  if (isAppRole(appRole)) return appRole;

  const userRole = user.user_metadata?.role;
  if (isAppRole(userRole)) return userRole;

  return null;
}

export async function fetchUserRole(
  user?: User | null,
): Promise<AppRole> {
  const currentUser =
    user ??
    (
      await supabase.auth.getSession()
    ).data.session?.user;

  if (!currentUser) return "restaurant_owner";

  const metadataRole = roleFromUserMetadata(currentUser);
  if (metadataRole) return metadataRole;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (data && isAppRole(data.role)) {
    return data.role;
  }

  return "restaurant_owner";
}

export async function fetchIsPlatformAdmin(
  user?: User | null,
): Promise<boolean> {
  const role = await fetchUserRole(user);
  return isAdminRole(role);
}

export async function fetchIsSuperAdmin(
  user?: User | null,
): Promise<boolean> {
  const role = await fetchUserRole(user);
  return role === "super_admin";
}
