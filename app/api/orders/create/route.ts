import { NextRequest, NextResponse } from "next/server";
import { createOrderWithClient } from "@/lib/orders/createOrder";
import type { CreateOrderInput } from "@/lib/orders/types";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const limited = checkRateLimit({
    key: `orders:create:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many orders. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  let input: CreateOrderInput;
  try {
    input = (await request.json()) as CreateOrderInput;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
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
        : "Order service is temporarily unavailable.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  const result = await createOrderWithClient(supabase, input);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}
