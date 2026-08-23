import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { finalizeNewRestaurantTrial } from "@/lib/restaurants/finalize-new-restaurant-trial";

export const runtime = "nodejs";

type Body = {
  restaurantId?: unknown;
  ownerId?: unknown;
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const restaurantId =
    typeof body.restaurantId === "string" ? body.restaurantId.trim() : "";
  const ownerId = typeof body.ownerId === "string" ? body.ownerId.trim() : "";
  if (!restaurantId || !ownerId) {
    return NextResponse.json(
      { ok: false, error: "Restaurant and owner are required." },
      { status: 400 },
    );
  }

  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service unavailable.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  try {
    await finalizeNewRestaurantTrial(admin, restaurantId, ownerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to finalize trial.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
