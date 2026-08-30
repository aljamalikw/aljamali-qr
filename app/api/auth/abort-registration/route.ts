import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { rollbackNewSignup } from "@/lib/auth/rollback-new-signup";

export const runtime = "nodejs";

type Body = {
  ownerId?: unknown;
  email?: unknown;
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

  const ownerId = typeof body.ownerId === "string" ? body.ownerId.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
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

  const rolledBack = await rollbackNewSignup(admin, ownerId, email);
  return NextResponse.json({ ok: rolledBack });
}
