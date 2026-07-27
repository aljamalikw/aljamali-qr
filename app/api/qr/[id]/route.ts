import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface QrScanRouteProps {
  params: Promise<{ id: string }>;
}

type RecordQrScanResult = {
  destination_url: string;
  is_active: boolean;
};

function withTableQuery(destinationUrl: string, tableNumber: string | null | undefined): string {
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

  const { data: qrRow } = await supabase
    .from("qr_codes")
    .select("table_number")
    .eq("id", id)
    .maybeSingle();

  destinationUrl = withTableQuery(
    destinationUrl,
    (qrRow as { table_number?: string | null } | null)?.table_number,
  );

  return NextResponse.redirect(destinationUrl, 302);
}
