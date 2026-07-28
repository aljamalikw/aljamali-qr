import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSubscriptionAccess } from "@/lib/subscriptions/engine";

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
  const supabase = createServerSupabaseClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, is_active, subscription_plan")
    .eq("id", restaurantId)
    .maybeSingle();

  if (!restaurant || (restaurant as { is_active?: boolean }).is_active === false) {
    return false;
  }

  const { data: sub } = await supabase
    .from("restaurant_subscriptions")
    .select(
      "plan, status, trial_started_at, trial_ends_at, grace_period_days, renewal_date, cancelled_at",
    )
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (!sub) return true;

  const row = sub as {
    plan: string;
    status: string;
    trial_started_at: string | null;
    trial_ends_at: string | null;
    grace_period_days: number | null;
    renewal_date: string | null;
    cancelled_at: string | null;
  };

  const access = getSubscriptionAccess({
    plan:
      row.plan ??
      (restaurant as { subscription_plan?: string }).subscription_plan,
    status: row.status,
    trialStartedAt: row.trial_started_at,
    trialEndsAt: row.trial_ends_at,
    gracePeriodDays: row.grace_period_days,
    renewalDate: row.renewal_date,
    cancelledAt: row.cancelled_at,
  });

  return access.publicMenuOnline;
}

export async function GET(request: NextRequest, { params }: QrScanRouteProps) {
  const { id } = await params;

  if (!id?.trim()) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  const supabase = createServerSupabaseClient();
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent");
  const referrer = request.headers.get("referer");

  const { data: qrMeta } = await supabase
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
