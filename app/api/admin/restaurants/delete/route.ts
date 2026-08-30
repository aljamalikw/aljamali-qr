import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  forbidden,
  getRequestIp,
  requireSuperAdmin,
  serverError,
  unauthorized,
} from "@/lib/admin/api-auth";
import { logActivity } from "@/lib/admin/activity-log";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Body = {
  restaurantId?: unknown;
  confirmName?: unknown;
};

function getAccessToken(request: NextRequest): string {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function createUserScopedClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
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

  const restaurantId =
    typeof body.restaurantId === "string" ? body.restaurantId.trim() : "";
  const confirmName =
    typeof body.confirmName === "string" ? body.confirmName.trim() : "";

  if (!restaurantId) {
    return badRequest("restaurantId is required.");
  }
  if (!confirmName) {
    return badRequest("Restaurant name confirmation is required.");
  }

  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return unauthorized("Missing access token.");
  }

  let service;
  try {
    service = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service client unavailable.";
    return serverError(message);
  }

  const { data: restaurant, error: restaurantError } = await service
    .from("restaurants")
    .select("id, restaurant_name, owner_id")
    .eq("id", restaurantId)
    .maybeSingle();

  if (restaurantError) {
    return serverError(restaurantError.message);
  }
  if (!restaurant) {
    return badRequest("Restaurant not found.");
  }

  const ownerId = restaurant.owner_id as string;
  if (ownerId === auth.userId) {
    return forbidden("You cannot permanently delete your own restaurant.");
  }

  let userClient;
  try {
    userClient = createUserScopedClient(accessToken);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create auth client.";
    return serverError(message);
  }

  const { error: deleteError } = await userClient.rpc(
    "admin_delete_restaurant_permanently",
    {
      p_restaurant_id: restaurantId,
      p_confirm_name: confirmName,
    },
  );

  if (deleteError) {
    return badRequest(deleteError.message || "Unable to delete restaurant.");
  }

  const ip = getRequestIp(request);
  await logActivity({
    client: service,
    action: "restaurant_deleted",
    actorId: auth.userId,
    actorEmail: auth.email,
    actorRole: "super_admin",
    ownerId,
    restaurantName:
      (restaurant.restaurant_name as string | null)?.trim() || null,
    entityType: "restaurant",
    entityId: restaurantId,
    ipAddress: ip,
    userAgent: request.headers.get("user-agent"),
    metadata: {
      confirmName,
      restaurantId,
    },
  });

  return NextResponse.json({
    ok: true,
    ownerId,
    ownerAccountRemoved: false,
  });
}
