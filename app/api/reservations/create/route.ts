import { NextRequest, NextResponse } from "next/server";
import { createReservationWithClient } from "@/lib/reservations/createReservation";
import type { CreateReservationInput } from "@/lib/reservations/types";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const CREATE_ERROR = "Unable to submit reservation. Please try again.";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const limited = checkRateLimit({
    key: `reservations:create:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, message: "Too many reservation requests. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  let input: CreateReservationInput;
  try {
    input = (await request.json()) as CreateReservationInput;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Unable to submit reservation. Please try again." },
      { status: 400 },
    );
  }

  let supabase;
  try {
    supabase = createServiceSupabaseClient();
  } catch {
    return NextResponse.json({ ok: false, message: CREATE_ERROR }, { status: 500 });
  }

  const result = await createReservationWithClient(supabase, input);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}
