const fs = require("fs");
const path = require("path");

const envPath = path.join(process.cwd(), ".env.local");
const env = {};

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    let k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
}

const hasDb = Boolean(env.DATABASE_URL);
const hasService = Boolean(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY);
const supabaseUrl = (env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "").replace(/\/+$/, "");
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";
const hasUrlAnon = Boolean(supabaseUrl && anonKey);

const shouldQuery = hasDb || hasService || hasUrlAnon;

console.log("shouldQuery", shouldQuery);
console.log("queryViaRest", hasUrlAnon);

if (!shouldQuery) {
  console.log("skip", "no qualifying env vars");
  process.exit(0);
}

if (!hasUrlAnon) {
  console.log("skip", "DATABASE_URL or service role present but no SUPABASE url+anon for REST");
  process.exit(0);
}

const url = `${supabaseUrl}/rest/v1/qr_codes?select=destination_url,created_at&order=created_at.desc&limit=3`;

(async () => {
  try {
    const res = await fetch(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: "application/json",
      },
    });
    console.log("status", res.status);
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      console.log("body", text.slice(0, 500));
      process.exit(0);
    }
    if (Array.isArray(body)) {
      console.log("count", body.length);
      for (const row of body) {
        console.log("destination_url", row.destination_url ?? "(null)");
        console.log("created_at", row.created_at ?? "(null)");
      }
    } else {
      console.log("error", JSON.stringify(body));
    }
  } catch (e) {
    console.log("fetch_error", e.message || String(e));
  }
})();
