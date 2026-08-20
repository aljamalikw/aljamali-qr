import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { isAdminRole, type AppRole } from "@/lib/auth/roles";

export const IMPERSONATION_COOKIE = "aj_impersonation";
export const IMPERSONATION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

export function hashImpersonationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createImpersonationToken(): string {
  return randomBytes(32).toString("hex");
}

export function getRequestIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip");
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function requireSuperAdmin(request: NextRequest): Promise<
  | { ok: true; userId: string; email: string | null }
  | { ok: false; response: NextResponse }
> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    return { ok: false, response: unauthorized("Missing access token.") };
  }

  let supabase;
  try {
    supabase = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service client unavailable.";
    return { ok: false, response: serverError(message) };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { ok: false, response: unauthorized("Invalid session.") };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const metaRole =
    typeof user.app_metadata?.role === "string"
      ? user.app_metadata.role
      : typeof user.user_metadata?.role === "string"
        ? user.user_metadata.role
        : null;

  const role = (profile as { role?: string } | null)?.role ?? metaRole;

  if (role !== "super_admin") {
    return {
      ok: false,
      response: forbidden("Super Admin access required."),
    };
  }

  return {
    ok: true,
    userId: user.id,
    email: user.email ?? null,
  };
}

export async function requirePlatformAdmin(request: NextRequest): Promise<
  | { ok: true; userId: string; email: string | null; role: AppRole }
  | { ok: false; response: NextResponse }
> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    return { ok: false, response: unauthorized("Missing access token.") };
  }

  let supabase;
  try {
    supabase = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service client unavailable.";
    return { ok: false, response: serverError(message) };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { ok: false, response: unauthorized("Invalid session.") };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const metaRole =
    typeof user.app_metadata?.role === "string"
      ? user.app_metadata.role
      : typeof user.user_metadata?.role === "string"
        ? user.user_metadata.role
        : null;

  const role = ((profile as { role?: AppRole } | null)?.role ??
    metaRole) as AppRole | null;

  if (!role || !isAdminRole(role)) {
    return {
      ok: false,
      response: forbidden("Platform admin access required."),
    };
  }

  return {
    ok: true,
    userId: user.id,
    email: user.email ?? null,
    role,
  };
}

export function impersonationCookieOptions(maxAge = IMPERSONATION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
