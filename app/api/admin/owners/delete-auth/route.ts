import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  forbidden,
  getRequestIp,
  requireSuperAdmin,
  serverError,
} from "@/lib/admin/api-auth";
import { logActivity } from "@/lib/admin/activity-log";
import { isAdminRole, type AppRole } from "@/lib/auth/roles";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Body = {
  ownerId?: unknown;
  restaurantId?: unknown;
};

function isProtectedRole(role: string | null | undefined): boolean {
  if (!role) return false;
  if (isAdminRole(role as AppRole)) return true;
  return role === "sales" || role === "support";
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const ownerId = typeof body.ownerId === "string" ? body.ownerId.trim() : "";
  const restaurantId =
    typeof body.restaurantId === "string" ? body.restaurantId.trim() : "";

  if (!ownerId || !UUID_RE.test(ownerId)) {
    return badRequest("A valid ownerId is required.");
  }
  if (ownerId === auth.userId) {
    return forbidden("You cannot permanently remove your own account.");
  }

  let service;
  try {
    service = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service client unavailable.";
    return serverError(message);
  }

  if (restaurantId) {
    if (!UUID_RE.test(restaurantId)) {
      return badRequest("restaurantId is invalid.");
    }

    const { data: restaurant, error: restaurantError } = await service
      .from("restaurants")
      .select("id, owner_id")
      .eq("id", restaurantId)
      .maybeSingle();

    if (restaurantError) {
      return serverError(restaurantError.message);
    }
    if (restaurant && (restaurant.owner_id as string) !== ownerId) {
      return badRequest("This owner is not linked to that restaurant.");
    }
  }

  const { count: remainingCount, error: remainingError } = await service
    .from("restaurants")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);

  if (remainingError) {
    return serverError(remainingError.message);
  }
  if ((remainingCount ?? 0) > 0) {
    return badRequest(
      "This owner still has restaurants. Delete every restaurant first.",
    );
  }

  const { data: profile } = await service
    .from("profiles")
    .select("role")
    .eq("id", ownerId)
    .maybeSingle();

  const role = (profile as { role?: string } | null)?.role ?? null;
  if (isProtectedRole(role)) {
    return forbidden("Platform staff accounts cannot be removed this way.");
  }

  const { data: authUser, error: getUserError } =
    await service.auth.admin.getUserById(ownerId);

  if (getUserError) {
    return serverError(getUserError.message);
  }
  if (!authUser?.user) {
    return badRequest("That owner authentication account was already removed.");
  }

  const { error: deleteUserError } = await service.auth.admin.deleteUser(
    ownerId,
    false,
  );

  if (deleteUserError) {
    return serverError(
      deleteUserError.message || "Unable to remove the owner authentication account.",
    );
  }

  const ip = getRequestIp(request);
  await logActivity({
    client: service,
    action: "owner_deleted",
    actorId: auth.userId,
    actorEmail: auth.email,
    actorRole: "super_admin",
    entityType: "owner",
    entityId: ownerId,
    ipAddress: ip,
    userAgent: request.headers.get("user-agent"),
    metadata: {
      restaurantId: restaurantId || null,
      reason: "Super Admin permanently removed owner Auth account",
    },
  });

  return NextResponse.json({ ok: true, ownerAccountRemoved: true });
}
