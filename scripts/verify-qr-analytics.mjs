import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const content = readFileSync(envPath, "utf8");
  const env = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const appUrl =
  env.NEXT_PUBLIC_APP_URL?.trim() ||
  env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (env.VERCEL_URL ? `https://${env.VERCEL_URL.trim()}` : "");

if (!url || !anonKey) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const checks = [];

function pass(name, detail) {
  checks.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? `: ${detail}` : ""}`);
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? `: ${detail}` : ""}`);
}

async function ensureMigrationsApplied() {
  const { error: rpcMissingError } = await supabase.rpc("record_qr_scan", {
    p_qr_code_id: "00000000-0000-0000-0000-000000000000",
    p_ip_address: "127.0.0.1",
    p_user_agent: "verify-script",
    p_referrer: null,
  });

  const missing =
    rpcMissingError?.code === "PGRST202" ||
    rpcMissingError?.message?.includes("Could not find");

  if (!missing) {
    return true;
  }

  const databaseUrl = env.DATABASE_URL ?? env.SUPABASE_DB_URL;
  if (!databaseUrl) {
    return false;
  }

  console.log("Applying QR analytics migrations...\n");
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync("node", ["scripts/apply-qr-analytics-migrations.mjs"], {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  return result.status === 0;
}

async function main() {
  console.log("QR Scan Analytics Verification\n");

  const migrationsReady = await ensureMigrationsApplied();

  const { error: rpcMissingError } = await supabase.rpc("record_qr_scan", {
    p_qr_code_id: "00000000-0000-0000-0000-000000000000",
    p_ip_address: "127.0.0.1",
    p_user_agent: "verify-script",
    p_referrer: null,
  });

  if (rpcMissingError?.code === "PGRST202" || rpcMissingError?.message?.includes("Could not find")) {
    fail(
      "Migration applied (record_qr_scan RPC)",
      migrationsReady
        ? "Function still not found after apply attempt"
        : "Function not found — run npm run db:apply-qr-analytics or apply SQL in Supabase",
    );
    summarize();
    process.exit(1);
  }

  if (rpcMissingError?.message?.includes("QR code not found")) {
    pass("Migration applied (record_qr_scan RPC)", "function exists");
  } else if (rpcMissingError) {
    fail("record_qr_scan RPC", rpcMissingError.message);
  }

  const { error: summaryError } = await supabase.rpc("get_qr_scan_summaries", {
    p_restaurant_id: "00000000-0000-0000-0000-000000000000",
    p_today_start: new Date().toISOString(),
  });

  if (summaryError?.code === "PGRST202" || summaryError?.message?.includes("Could not find")) {
    fail(
      "Migration applied (get_qr_scan_summaries RPC)",
      "Function not found — apply supabase/migrations/20260726223100_qr_scan_summary_function.sql",
    );
  } else if (summaryError) {
    pass("Migration applied (get_qr_scan_summaries RPC)", "function exists (auth required for data)");
  } else {
    pass("Migration applied (get_qr_scan_summaries RPC)", "function exists");
  }

  const invalidResponse = await fetch(
    `${appUrl}/api/qr/00000000-0000-0000-0000-000000000000`,
    { redirect: "manual" },
  );

  if (invalidResponse.status === 404) {
    pass("API route rejects invalid QR", "404");
  } else {
    fail("API route rejects invalid QR", `expected 404, got ${invalidResponse.status}`);
  }

  const { data: qrCodes, error: qrError } = await supabase
    .from("qr_codes")
    .select("id, destination_url, scans_count, is_active")
    .limit(1);

  if (qrError) {
    console.log("\nNote: Cannot list qr_codes with anon key (expected due to RLS).");
    console.log("Skipping live scan test — sign in and create a QR, then scan /api/qr/{id} manually.\n");
    summarize();
    process.exit(checks.every((c) => c.ok) ? 0 : 1);
  }

  const qr = qrCodes?.[0];
  if (!qr) {
    console.log("\nNo QR codes in database. Create one in the dashboard first.\n");
    summarize();
    process.exit(checks.every((c) => c.ok) ? 0 : 1);
  }

  const beforeCount = qr.scans_count;
  const scanResponse = await fetch(`${appUrl}/api/qr/${qr.id}`, {
    redirect: "manual",
    headers: {
      "User-Agent": "verify-script",
      Referer: "https://verify.local/",
    },
  });

  if (scanResponse.status !== 302) {
    fail("Scan redirect", `expected 302, got ${scanResponse.status}`);
  } else {
    const location = scanResponse.headers.get("location");
    if (location === qr.destination_url) {
      pass("Scan redirect", location);
    } else {
      fail("Scan redirect", `expected ${qr.destination_url}, got ${location}`);
    }
  }

  const { count: scanRows, error: scanCountError } = await supabase
    .from("qr_code_scans")
    .select("id", { count: "exact", head: true })
    .eq("qr_code_id", qr.id);

  if (scanCountError) {
    fail("Scan row inserted", scanCountError.message);
  } else if ((scanRows ?? 0) > 0) {
    pass("Scan row inserted", `${scanRows} total scan(s) for QR`);
  } else if (qr.is_active) {
    fail("Scan row inserted", "no rows found after scan");
  } else {
    pass("Scan row skipped for inactive QR", "expected behavior");
  }

  const { data: updatedQr, error: updatedError } = await supabase
    .from("qr_codes")
    .select("scans_count")
    .eq("id", qr.id)
    .single();

  if (updatedError) {
    fail("scans_count incremented", updatedError.message);
  } else if (qr.is_active && updatedQr.scans_count === beforeCount + 1) {
    pass("scans_count incremented", `${beforeCount} → ${updatedQr.scans_count}`);
  } else if (!qr.is_active && updatedQr.scans_count === beforeCount) {
    pass("scans_count unchanged for inactive QR", String(beforeCount));
  } else {
    fail(
      "scans_count incremented",
      `expected ${qr.is_active ? beforeCount + 1 : beforeCount}, got ${updatedQr.scans_count}`,
    );
  }

  summarize();
  process.exit(checks.every((c) => c.ok) ? 0 : 1);
}

function summarize() {
  const passed = checks.filter((c) => c.ok).length;
  const total = checks.length;
  console.log(`\n${passed}/${total} checks passed`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
