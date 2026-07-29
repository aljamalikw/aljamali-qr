import { supabase } from "@/lib/supabase";

export type ImpersonationState = {
  active: boolean;
  restaurantId: string | null;
  restaurantName: string | null;
  startedAt: string | null;
  expiresAt: string | null;
};

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

export async function fetchImpersonationState(): Promise<
  | { ok: true; data: ImpersonationState }
  | { ok: false; message: string }
> {
  try {
    const headers = await authHeaders();
    if (!headers) {
      return {
        ok: true,
        data: {
          active: false,
          restaurantId: null,
          restaurantName: null,
          startedAt: null,
          expiresAt: null,
        },
      };
    }

    const response = await fetch("/api/admin/impersonation", {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      active?: boolean;
      restaurantId?: string | null;
      restaurantName?: string | null;
      startedAt?: string | null;
      expiresAt?: string | null;
    };

    if (!response.ok) {
      return {
        ok: false,
        message: body.error || "Unable to check impersonation session.",
      };
    }

    return {
      ok: true,
      data: {
        active: Boolean(body.active),
        restaurantId: body.restaurantId ?? null,
        restaurantName: body.restaurantName ?? null,
        startedAt: body.startedAt ?? null,
        expiresAt: body.expiresAt ?? null,
      },
    };
  } catch {
    return { ok: false, message: "Unable to check impersonation session." };
  }
}

export async function startImpersonation(
  restaurantId: string,
  reason = "Support access",
): Promise<
  | { ok: true; restaurantName: string }
  | { ok: false; message: string }
> {
  try {
    const headers = await authHeaders();
    if (!headers) return { ok: false, message: "You must be signed in." };

    const response = await fetch("/api/admin/impersonation/start", {
      method: "POST",
      headers,
      body: JSON.stringify({ restaurantId, reason }),
    });
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      restaurantName?: string;
    };

    if (!response.ok) {
      return {
        ok: false,
        message: body.error || "Unable to start impersonation.",
      };
    }

    return {
      ok: true,
      restaurantName: body.restaurantName || "Restaurant",
    };
  } catch {
    return { ok: false, message: "Unable to start impersonation." };
  }
}

export async function exitImpersonation(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  try {
    const headers = await authHeaders();
    if (!headers) return { ok: false, message: "You must be signed in." };

    const response = await fetch("/api/admin/impersonation/exit", {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      return {
        ok: false,
        message: body.error || "Unable to exit impersonation.",
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Unable to exit impersonation." };
  }
}

export async function generateRestaurantLoginLink(
  restaurantId: string,
): Promise<
  | { ok: true; link: string }
  | { ok: false; message: string }
> {
  try {
    const headers = await authHeaders();
    if (!headers) return { ok: false, message: "You must be signed in." };

    const response = await fetch("/api/admin/impersonation/login-link", {
      method: "POST",
      headers,
      body: JSON.stringify({ restaurantId }),
    });
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      link?: string;
    };

    if (!response.ok || !body.link) {
      return {
        ok: false,
        message: body.error || "Unable to generate login link.",
      };
    }

    return { ok: true, link: body.link };
  } catch {
    return { ok: false, message: "Unable to generate login link." };
  }
}
