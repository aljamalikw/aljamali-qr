import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isAdminRole, type AppRole } from "@/lib/auth/roles";

export const SIGNUP_WINDOW_MS = 15 * 60 * 1000;

function isProtectedRole(role: string | null | undefined): boolean {
  if (!role) return false;
  if (isAdminRole(role as AppRole)) return true;
  return role === "sales" || role === "support";
}

export function emailsMatch(
  left: string | null | undefined,
  right: string,
): boolean {
  const a = left?.trim().toLowerCase() ?? "";
  const b = right.trim().toLowerCase();
  if (!a || !b) return false;
  return a === b;
}

export function resolveAuthUserEmail(user: User): string {
  const fromIdentity = user.identities?.find((identity) => {
    const data = identity.identity_data as { email?: unknown } | undefined;
    return typeof data?.email === "string" && data.email.trim().length > 0;
  });
  const identityData = fromIdentity?.identity_data as
    | { email?: string }
    | undefined;
  return (
    user.email ??
    identityData?.email ??
    (typeof user.user_metadata?.email === "string"
      ? user.user_metadata.email
      : "")
  ).trim();
}

/**
 * Deletes only a brand-new signup that has no restaurant yet.
 * Never deletes older accounts, staff, or owners who already have a restaurant.
 */
export async function rollbackNewSignup(
  admin: SupabaseClient,
  ownerId: string,
  email: string,
): Promise<boolean> {
  const { data, error } = await admin.auth.admin.getUserById(ownerId);
  const user = data?.user;
  if (error || !user) return true;

  const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
  if (!createdAt || Date.now() - createdAt > SIGNUP_WINDOW_MS) return false;

  const existingEmail = resolveAuthUserEmail(user);
  if (existingEmail && !emailsMatch(existingEmail, email)) return false;

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", ownerId)
    .maybeSingle();
  if (isProtectedRole((profile as { role?: string } | null)?.role)) {
    return false;
  }

  const { count, error: countError } = await admin
    .from("restaurants")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);
  if (countError || (count ?? 0) > 0) return false;

  const { error: deleteError } = await admin.auth.admin.deleteUser(
    ownerId,
    false,
  );
  return !deleteError;
}
