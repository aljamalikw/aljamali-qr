import { supabase } from "@/lib/supabase";
import type { PaymentStatus } from "@/lib/admin/payments";

async function authHeaders(): Promise<HeadersInit | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

export async function updatePaymentViaAdminApi(params: {
  paymentId: string;
  status?: PaymentStatus;
  paymentMethod?: string | null;
  reference?: string | null;
  notes?: string | null;
  paidAt?: string | null;
}): Promise<
  | { ok: true; data: { id: string; status: PaymentStatus; alreadyApplied: boolean } }
  | { ok: false; message: string }
> {
  try {
    const headers = await authHeaders();
    if (!headers) return { ok: false, message: "You must be signed in." };

    const response = await fetch(`/api/admin/payments/${params.paymentId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        status: params.status,
        paymentMethod: params.paymentMethod,
        reference: params.reference,
        notes: params.notes,
        paidAt: params.paidAt,
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      data?: { id: string; status: PaymentStatus; alreadyApplied: boolean };
    };

    if (!response.ok) {
      return { ok: false, message: body.error || "Unable to update payment." };
    }

    if (!body.data) {
      return { ok: false, message: "Unable to update payment." };
    }

    return { ok: true, data: body.data };
  } catch {
    return { ok: false, message: "Unable to update payment." };
  }
}

export async function createManualPaymentViaAdminApi(params: {
  ownerId: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  status: PaymentStatus;
  paidAt?: string | null;
  reference?: string | null;
  notes?: string | null;
  paymentDate?: string | null;
}): Promise<
  | { ok: true; data: { id: string; status: PaymentStatus } }
  | { ok: false; message: string }
> {
  try {
    const headers = await authHeaders();
    if (!headers) return { ok: false, message: "You must be signed in." };

    const response = await fetch("/api/admin/payments", {
      method: "POST",
      headers,
      body: JSON.stringify(params),
    });

    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      data?: { id: string; status: PaymentStatus };
    };

    if (!response.ok) {
      return { ok: false, message: body.error || "Unable to create payment." };
    }

    if (!body.data) {
      return { ok: false, message: "Unable to create payment." };
    }

    return { ok: true, data: body.data };
  } catch {
    return { ok: false, message: "Unable to create payment." };
  }
}
