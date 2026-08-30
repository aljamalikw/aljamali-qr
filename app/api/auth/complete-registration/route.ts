import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import {
  SIGNUP_WINDOW_MS,
  emailsMatch,
  resolveAuthUserEmail,
  rollbackNewSignup,
} from "@/lib/auth/rollback-new-signup";
import { finalizeNewRestaurantTrial } from "@/lib/restaurants/finalize-new-restaurant-trial";
import { DEFAULT_TRIAL_PLAN } from "@/lib/subscriptions/plans";

export const runtime = "nodejs";

const REGISTRATION_FAILED =
  "Registration could not be completed. Please try again with the same email.";
const REGISTRATION_FAILED_LOCKED =
  "Registration could not be completed. Please contact support if this email is already in use.";

type Body = {
  ownerId?: unknown;
  email?: unknown;
  restaurantName?: unknown;
  ownerName?: unknown;
  phone?: unknown;
  country?: unknown;
};

function asTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

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

  const ownerId = asTrimmed(body.ownerId);
  const email = asTrimmed(body.email);
  const restaurantName = asTrimmed(body.restaurantName);
  const ownerName = asTrimmed(body.ownerName);
  const phone = asTrimmed(body.phone);
  const country = asTrimmed(body.country);

  if (!ownerId || !email) {
    return NextResponse.json(
      { ok: false, error: "Owner and email are required." },
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

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (token) {
    const { data: tokenUser } = await admin.auth.getUser(token);
    if (tokenUser.user && tokenUser.user.id !== ownerId) {
      return NextResponse.json(
        { ok: false, error: "Session does not match this registration." },
        { status: 403 },
      );
    }
  }

  const { data: authData, error: authError } =
    await admin.auth.admin.getUserById(ownerId);
  const user = authData?.user;
  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "Registration could not be completed. Please try again." },
      { status: 400 },
    );
  }

  const existingEmail = resolveAuthUserEmail(user);
  if (existingEmail && !emailsMatch(existingEmail, email)) {
    return NextResponse.json(
      { ok: false, error: "Email does not match this account." },
      { status: 400 },
    );
  }

  const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
  const inSignupWindow =
    Boolean(createdAt) && Date.now() - createdAt <= SIGNUP_WINDOW_MS;

  const { data: existingRestaurant } = await admin
    .from("restaurants")
    .select("id, restaurant_name")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingRestaurant) {
    return NextResponse.json({
      ok: true,
      restaurantId: (existingRestaurant as { id: string }).id,
    });
  }

  if (!inSignupWindow) {
    return NextResponse.json(
      { ok: false, error: REGISTRATION_FAILED_LOCKED },
      { status: 400 },
    );
  }

  const { data: created, error: insertError } = await admin
    .from("restaurants")
    .insert({
      owner_id: ownerId,
      email,
      restaurant_name: restaurantName || null,
      owner_name: ownerName || null,
      phone: phone || null,
      country: country || null,
      subscription_plan: DEFAULT_TRIAL_PLAN,
    })
    .select("id, restaurant_name")
    .single();

  if (insertError || !created) {
    const rolledBack = await rollbackNewSignup(admin, ownerId, email);
    return NextResponse.json(
      {
        ok: false,
        error: rolledBack ? REGISTRATION_FAILED : REGISTRATION_FAILED_LOCKED,
      },
      { status: 500 },
    );
  }

  try {
    await finalizeNewRestaurantTrial(
      admin,
      (created as { id: string }).id,
      ownerId,
    );
  } catch {
    // Restaurant row exists; trial mirror can be repaired later.
  }

  return NextResponse.json({
    ok: true,
    restaurantId: (created as { id: string }).id,
  });
}
