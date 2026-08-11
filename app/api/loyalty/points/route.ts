import { NextRequest, NextResponse } from "next/server";
import { adjustLoyaltyPoints } from "@/lib/loyalty/mutations";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Body = {
  restaurantId?: unknown;
  customerId?: unknown;
  delta?: unknown;
  reason?: unknown;
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

/**
 * Loyalty points mutation — server-enforced via planAllowsLoyalty.
 * Platform admins bypass plan restrictions.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const restaurantId =
    typeof body.restaurantId === "string" ? body.restaurantId.trim() : "";
  const customerId =
    typeof body.customerId === "string" ? body.customerId.trim() : "";
  const delta = typeof body.delta === "number" ? body.delta : NaN;
  const reason = typeof body.reason === "string" ? body.reason.trim() : undefined;

  if (!restaurantId || !customerId || !Number.isFinite(delta)) {
    return NextResponse.json(
      { ok: false, error: "restaurantId, customerId, and delta are required." },
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

  const result = await adjustLoyaltyPoints({
    restaurantId,
    customerId,
    delta,
    reason,
    actorUserId: auth.userId,
    client: admin,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.message },
      { status: result.status ?? 403 },
    );
  }

  return NextResponse.json({ ok: true, loyaltyPoints: result.loyaltyPoints });
}
