import { NextRequest, NextResponse } from "next/server";
import {
  IMPERSONATION_COOKIE,
  hashImpersonationToken,
  requireSuperAdmin,
  serverError,
} from "@/lib/admin/api-auth";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  const token = request.cookies.get(IMPERSONATION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({
      active: false,
      restaurantId: null,
      restaurantName: null,
      startedAt: null,
      expiresAt: null,
    });
  }

  let supabase;
  try {
    supabase = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service client unavailable.";
    return serverError(message);
  }

  const tokenHash = hashImpersonationToken(token);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("admin_impersonation_sessions")
    .select(
      "id, restaurant_id, restaurant_name, started_at, expires_at, ended_at, admin_user_id",
    )
    .eq("token_hash", tokenHash)
    .eq("admin_user_id", auth.userId)
    .is("ended_at", null)
    .gt("expires_at", now)
    .maybeSingle();

  if (error) {
    return serverError(error.message);
  }

  if (!data) {
    const response = NextResponse.json({
      active: false,
      restaurantId: null,
      restaurantName: null,
      startedAt: null,
      expiresAt: null,
    });
    response.cookies.set(IMPERSONATION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  return NextResponse.json({
    active: true,
    restaurantId: data.restaurant_id as string,
    restaurantName: (data.restaurant_name as string | null) ?? null,
    startedAt: data.started_at as string,
    expiresAt: data.expires_at as string,
  });
}
