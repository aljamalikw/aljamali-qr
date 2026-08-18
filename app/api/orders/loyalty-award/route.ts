import { NextRequest, NextResponse } from "next/server";
import { isAdminRole, type AppRole } from "@/lib/auth/roles";
import { maybeAwardLoyaltyPointsForOrder } from "@/lib/orders/loyalty-awards";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Body = {
  orderId?: unknown;
};

async function requireUser(request: NextRequest): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service unavailable.";
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: message }, { status: 500 }),
    };
  }

  const {
    data: { user },
    error,
  } = await admin.auth.getUser(token);

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Invalid session." },
        { status: 401 },
      ),
    };
  }

  return { ok: true, userId: user.id };
}

async function canManageOrder(
  admin: ReturnType<typeof createServiceSupabaseClient>,
  userId: string,
  restaurantId: string,
): Promise<boolean> {
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const role = (profile as { role?: AppRole } | null)?.role ?? null;
  if (isAdminRole(role)) return true;

  const { data: restaurant } = await admin
    .from("restaurants")
    .select("owner_id")
    .eq("id", restaurantId)
    .maybeSingle();
  if ((restaurant as { owner_id?: string } | null)?.owner_id === userId) {
    return true;
  }

  const { data: membership } = await admin
    .from("restaurant_members")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  return Boolean(membership);
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  if (!orderId) {
    return NextResponse.json(
      { ok: false, error: "orderId is required." },
      { status: 400 },
    );
  }

  console.info("[LOYALTY AWARD TRIGGER]", {
    orderId,
    stage: "route_called",
    actorUserId: auth.userId,
  });

  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service unavailable.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  const { data: order, error } = await admin
    .from("orders")
    .select("id, restaurant_id")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json(
      { ok: false, error: "Order not found." },
      { status: 404 },
    );
  }

  const restaurantId =
    (order as { restaurant_id?: string } | null)?.restaurant_id ?? "";
  const allowed = await canManageOrder(admin, auth.userId, restaurantId);
  if (!allowed) {
    console.warn("[LOYALTY AWARD TRIGGER]", {
      orderId,
      restaurantId,
      stage: "route_forbidden",
      actorUserId: auth.userId,
    });
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const result = await maybeAwardLoyaltyPointsForOrder(orderId, admin);
  if (!result.ok) {
    console.warn("[LOYALTY AWARD TRIGGER]", {
      orderId,
      restaurantId,
      stage: "route_failed",
      actorUserId: auth.userId,
      message: result.message,
    });
    return NextResponse.json(
      { ok: false, error: result.message },
      { status: 500 },
    );
  }

  console.info("[LOYALTY AWARD TRIGGER]", {
    orderId,
    restaurantId,
    stage: "route_completed",
    actorUserId: auth.userId,
    awarded: result.awarded,
    points: result.points,
  });

  return NextResponse.json(result);
}
