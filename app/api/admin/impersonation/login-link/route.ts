import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  getRequestIp,
  requireSuperAdmin,
  serverError,
} from "@/lib/admin/api-auth";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

type Body = {
  restaurantId?: unknown;
};

function getAppBaseUrl(request: NextRequest): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.ok) return auth.response;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const restaurantId =
    typeof body.restaurantId === "string" ? body.restaurantId.trim() : "";
  if (!restaurantId) {
    return badRequest("restaurantId is required.");
  }

  let supabase;
  try {
    supabase = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service client unavailable.";
    return serverError(message);
  }

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, restaurant_name, email, owner_id")
    .eq("id", restaurantId)
    .maybeSingle();

  if (restaurantError) {
    return serverError(restaurantError.message);
  }
  if (!restaurant) {
    return badRequest("Restaurant not found.");
  }

  const email = (restaurant.email as string | null)?.trim();
  if (!email) {
    return badRequest("Restaurant has no owner email for a login link.");
  }

  const restaurantName =
    (restaurant.restaurant_name as string | null)?.trim() ||
    "Unnamed restaurant";
  const baseUrl = getAppBaseUrl(request);
  const redirectTo = `${baseUrl}/auth/callback?next=/dashboard`;

  const { data: linkData, error: linkError } =
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

  if (linkError || !linkData?.properties?.action_link) {
    return serverError(
      linkError?.message || "Unable to generate login link.",
    );
  }

  await supabase.from("admin_impersonation_logs").insert({
    admin_user_id: auth.userId,
    restaurant_id: restaurantId,
    restaurant_name: restaurantName,
    action: "login_link",
    reason: "Generate login link",
    ip_address: getRequestIp(request),
  });

  // Return link only in this one-time Super Admin response — never store it.
  return NextResponse.json({
    ok: true,
    link: linkData.properties.action_link,
  });
}
