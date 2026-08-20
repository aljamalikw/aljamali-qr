import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  requirePlatformAdmin,
  serverError,
} from "@/lib/admin/api-auth";
import { updatePaymentAsAdmin } from "@/lib/admin/payment-management";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/lib/admin/payments";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

type PatchBody = {
  status?: unknown;
  paymentMethod?: unknown;
  reference?: unknown;
  notes?: unknown;
  paidAt?: unknown;
};

function asPaymentStatus(value: unknown): PaymentStatus | null {
  if (typeof value !== "string") return null;
  return (PAYMENT_STATUSES as readonly string[]).includes(value)
    ? (value as PaymentStatus)
    : null;
}

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const auth = await requirePlatformAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id?.trim()) return badRequest("Payment id is required.");

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return badRequest("Invalid JSON body.");
  }

  let status: PaymentStatus | undefined;
  if (body.status !== undefined) {
    const parsed = asPaymentStatus(body.status);
    if (!parsed) return badRequest("status is invalid.");
    status = parsed;
  }

  let client;
  try {
    client = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service client unavailable.";
    return serverError(message);
  }

  const result = await updatePaymentAsAdmin(
    client,
    id.trim(),
    {
      status,
      paymentMethod:
        body.paymentMethod === undefined
          ? undefined
          : typeof body.paymentMethod === "string"
            ? body.paymentMethod.trim() || null
            : null,
      reference:
        body.reference === undefined
          ? undefined
          : typeof body.reference === "string"
            ? body.reference.trim() || null
            : null,
      notes:
        body.notes === undefined
          ? undefined
          : typeof body.notes === "string"
            ? body.notes.trim() || null
            : null,
      paidAt:
        body.paidAt === undefined
          ? undefined
          : typeof body.paidAt === "string"
            ? body.paidAt.trim() || null
            : null,
    },
    {
      userId: auth.userId,
      email: auth.email,
      role: auth.role,
    },
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data: result.data });
}
