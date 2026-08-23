import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { getSubscriptionAccess } from "@/lib/subscriptions/engine";
import {
  locationEngineInput,
  resolveEffectiveOwnerSubscription,
} from "@/lib/subscriptions/owner-subscription";

interface QrScanRouteProps {
  params: Promise<{ id: string }>;
}

type RecordQrScanResult = {
  destination_url: string;
  is_active: boolean;
};

function withTableQuery(
  destinationUrl: string,
  tableNumber: string | null | undefined,
): string {
  const table = tableNumber?.trim();
  if (!table) return destinationUrl;

  try {
    const url = new URL(destinationUrl);
    if (!url.searchParams.get("table")) {
      url.searchParams.set("table", table);
    }
    return url.toString();
  } catch {
    if (/[?&]table=/.test(destinationUrl)) return destinationUrl;
    const separator = destinationUrl.includes("?") ? "&" : "?";
    return `${destinationUrl}${separator}table=${encodeURIComponent(table)}`;
  }
}

async function isQrRestaurantOnline(
  restaurantId: string,
): Promise<boolean> {
  const admin = createServiceSupabaseClient();

  const { data: restaurant } = await admin
    .from("restaurants")
    .select("id, is_active, subscription_plan")
    .eq("id", restaurantId)
    .maybeSingle();

  if (!restaurant || (restaurant as { is_active?: boolean }).is_active === false) {
    return false;
  }

  const effective = await resolveEffectiveOwnerSubscription(admin, restaurantId);
  if (!effective) return true;

  const access = getSubscriptionAccess(locationEngineInput(effective));

  return access.publicMenuOnline;
}

export async function GET(request: NextRequest, { params }: QrScanRouteProps) {
  const { id } = await params;

  if (!id?.trim()) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  const supabase = createServerSupabaseClient();
  const admin = createServiceSupabaseClient();
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent");
  const referrer = request.headers.get("referer");

  const { data: qrMeta } = await admin
    .from("qr_codes")
    .select("table_number, restaurant_id")
    .eq("id", id)
    .maybeSingle();

  const restaurantId = (qrMeta as { restaurant_id?: string } | null)
    ?.restaurant_id;

  if (restaurantId && !(await isQrRestaurantOnline(restaurantId))) {
    return NextResponse.json(
      { error: "This menu is temporarily unavailable" },
      { status: 403 },
    );
  }

  const { data, error } = await supabase.rpc("record_qr_scan", {
    p_qr_code_id: id,
    p_ip_address: ipAddress,
    p_user_agent: userAgent,
    p_referrer: referrer,
  });

  if (error) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  const result = (data?.[0] ?? null) as RecordQrScanResult | null;
  let destinationUrl = result?.destination_url?.trim() ?? "";

  if (!destinationUrl) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  destinationUrl = withTableQuery(
    destinationUrl,
    (qrMeta as { table_number?: string | null } | null)?.table_number,
  );

  return NextResponse.redirect(destinationUrl, 302);
}
