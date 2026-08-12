import { NextRequest, NextResponse } from "next/server";
import { lookupCustomerByPhone } from "@/lib/customers/lookup-public";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Public checkout helper: find returning customer by phone for a restaurant.
 * Returns limited fields only.
 */
export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const limited = checkRateLimit({
    key: `customers:lookup:${ip}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const restaurantId = request.nextUrl.searchParams.get("restaurantId")?.trim();
  const phone = request.nextUrl.searchParams.get("phone")?.trim();

  if (!restaurantId || !phone) {
    return NextResponse.json(
      { ok: false, error: "restaurantId and phone are required." },
      { status: 400 },
    );
  }

  let supabase;
  try {
    supabase = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Customer lookup is temporarily unavailable.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  const result = await lookupCustomerByPhone(supabase, restaurantId, phone);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, customer: result.customer });
}
