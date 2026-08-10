import { NextRequest, NextResponse } from "next/server";
import {
  IMPERSONATION_COOKIE,
  IMPERSONATION_MAX_AGE_SECONDS,
  badRequest,
  createImpersonationToken,
  getRequestIp,
  hashImpersonationToken,
  impersonationCookieOptions,
  requireSuperAdmin,
  serverError,
} from "@/lib/admin/api-auth";
import { logActivity } from "@/lib/admin/activity-log";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

type StartBody = {
  restaurantId?: unknown;
  reason?: unknown;
};

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  let body: StartBody;
  try {
    body = (await request.json()) as StartBody;
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const restaurantId =
    typeof body.restaurantId === "string" ? body.restaurantId.trim() : "";
  const reason =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim().slice(0, 500)
      : "Support access";

  if (!restaurantId) {
    return badRequest("restaurantId is required.");
  }

  let supabase;
  try {
    supabase = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service client unavailable.";
    return serverError(message);
  }

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, restaurant_name")
    .eq("id", restaurantId)
    .maybeSingle();

  if (restaurantError) {
    return serverError(restaurantError.message);
  }
  if (!restaurant) {
    return badRequest("Restaurant not found.");
  }

  const restaurantName =
    (restaurant.restaurant_name as string | null)?.trim() ||
    "Unnamed restaurant";

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + IMPERSONATION_MAX_AGE_SECONDS * 1000,
  );
  const token = createImpersonationToken();
  const tokenHash = hashImpersonationToken(token);
  const ip = getRequestIp(request);

  // End any existing active sessions for this admin.
  await supabase
    .from("admin_impersonation_sessions")
    .update({ ended_at: now.toISOString() })
    .eq("admin_user_id", auth.userId)
    .is("ended_at", null);

  const { error: insertError } = await supabase
    .from("admin_impersonation_sessions")
    .insert({
      admin_user_id: auth.userId,
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      token_hash: tokenHash,
      reason,
      ip_address: ip,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

  if (insertError) {
    return serverError(insertError.message);
  }

  await supabase.from("admin_impersonation_logs").insert({
    admin_user_id: auth.userId,
    restaurant_id: restaurantId,
    restaurant_name: restaurantName,
    action: "start",
    reason,
    ip_address: ip,
  });

  await supabase.from("admin_activity_logs").insert({
    actor_user_id: auth.userId,
    actor_email: auth.email,
    actor_role: "super_admin",
    restaurant_id: restaurantId,
    restaurant_name: restaurantName,
    action: "login_as_restaurant",
    details: { session: "impersonation" },
    reason,
    ip_address: ip,
  });

  await logActivity({
    client: supabase,
    action: "owner_impersonation",
    actorId: auth.userId,
    actorEmail: auth.email,
    actorRole: "super_admin",
    restaurantId,
    restaurantName,
    entityType: "session",
    entityId: restaurantId,
    ipAddress: ip,
    reason,
    newValues: { session: "impersonation" },
    userAgent: request.headers.get("user-agent"),
  });

  const response = NextResponse.json({
    ok: true,
    restaurantId,
    restaurantName,
    expiresAt: expiresAt.toISOString(),
  });

  response.cookies.set(
    IMPERSONATION_COOKIE,
    token,
    impersonationCookieOptions(),
  );

  return response;
}
