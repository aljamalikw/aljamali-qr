import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import {
  countOwnerRestaurants,
  resolveOwnerSubscriptionPlan,
} from "@/lib/restaurants/owner-plan";
import {
  STARTER_RESTAURANT_LIMIT_MESSAGE,
  canCreateRestaurant,
} from "@/lib/subscriptions/plans";

export const runtime = "nodejs";

type CreateBody = {
  restaurantName?: unknown;
  sourceRestaurantId?: unknown;
};

async function requireUser(request: NextRequest): Promise<
  | { ok: true; userId: string; email: string | null }
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
      response: NextResponse.json(
        { ok: false, error: message },
        { status: 500 },
      ),
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

  return {
    ok: true,
    userId: user.id,
    email: user.email ?? null,
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const restaurantName =
    typeof body.restaurantName === "string" ? body.restaurantName.trim() : "";
  if (!restaurantName) {
    return NextResponse.json(
      { ok: false, error: "Restaurant name is required." },
      { status: 400 },
    );
  }

  const sourceRestaurantId =
    typeof body.sourceRestaurantId === "string"
      ? body.sourceRestaurantId.trim()
      : null;

  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service unavailable.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  const restaurantCount = await countOwnerRestaurants(admin, auth.userId);
  const plan = await resolveOwnerSubscriptionPlan(
    admin,
    auth.userId,
    sourceRestaurantId,
  );

  if (!canCreateRestaurant(plan, restaurantCount)) {
    return NextResponse.json(
      { ok: false, error: STARTER_RESTAURANT_LIMIT_MESSAGE },
      { status: 403 },
    );
  }

  // Inherit plan onto the new row so the default subscription trigger
  // provisions the same plan (not a fresh Starter trial for Pro/Enterprise).
  const { data, error } = await admin
    .from("restaurants")
    .insert({
      owner_id: auth.userId,
      email: auth.email,
      restaurant_name: restaurantName,
      subscription_plan: plan,
    })
    .select("*")
    .single();

  if (error || !data) {
    const message = error?.message ?? "Unable to create restaurant.";
    const status =
      message.includes("allows only one restaurant") ||
      message.includes("restaurant_limit")
        ? 403
        : 400;
    return NextResponse.json(
      {
        ok: false,
        error:
          status === 403 ? STARTER_RESTAURANT_LIMIT_MESSAGE : message,
      },
      { status },
    );
  }

  return NextResponse.json({ ok: true, data });
}
