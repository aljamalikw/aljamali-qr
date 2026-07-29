import { NextRequest, NextResponse } from "next/server";
import {
  IMPERSONATION_COOKIE,
  getRequestIp,
  hashImpersonationToken,
  requireSuperAdmin,
  serverError,
} from "@/lib/admin/api-auth";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  let supabase;
  try {
    supabase = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service client unavailable.";
    return serverError(message);
  }

  const token = request.cookies.get(IMPERSONATION_COOKIE)?.value;
  const ip = getRequestIp(request);
  const now = new Date().toISOString();

  if (token) {
    const tokenHash = hashImpersonationToken(token);
    const { data: session } = await supabase
      .from("admin_impersonation_sessions")
      .select("id, restaurant_id, restaurant_name")
      .eq("token_hash", tokenHash)
      .eq("admin_user_id", auth.userId)
      .is("ended_at", null)
      .maybeSingle();

    if (session) {
      await supabase
        .from("admin_impersonation_sessions")
        .update({ ended_at: now })
        .eq("id", session.id);

      await supabase.from("admin_impersonation_logs").insert({
        admin_user_id: auth.userId,
        restaurant_id: session.restaurant_id,
        restaurant_name: session.restaurant_name,
        action: "exit",
        reason: "Exit impersonation",
        ip_address: ip,
      });
    }
  }

  // Also close any leftover active sessions for this admin.
  await supabase
    .from("admin_impersonation_sessions")
    .update({ ended_at: now })
    .eq("admin_user_id", auth.userId)
    .is("ended_at", null);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(IMPERSONATION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
