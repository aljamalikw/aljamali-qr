import { NextRequest, NextResponse } from "next/server";
import { syncAllSubscriptionLifecycles } from "@/lib/subscriptions/sync-lifecycle";

/**
 * Vercel Cron / manual trigger for subscription lifecycle sync.
 * Protect with CRON_SECRET (Authorization: Bearer <secret> or ?secret=).
 */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const querySecret = request.nextUrl.searchParams.get("secret") ?? "";

  if (expected && bearer !== expected && querySecret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Allow unconfigured local/dev runs without secret; require secret in production.
  if (!expected && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 },
    );
  }

  try {
    const result = await syncAllSubscriptionLifecycles();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lifecycle sync failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
