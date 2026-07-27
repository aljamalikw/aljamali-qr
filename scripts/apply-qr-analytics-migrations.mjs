import pg from "pg";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const { Client } = pg;

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

const migrations = [
  "20260726223000_create_qr_code_scans_table.sql",
  "20260726223100_qr_scan_summary_function.sql",
];

async function main() {
  const env = loadEnv();
  const databaseUrl = env.DATABASE_URL ?? env.SUPABASE_DB_URL;

  if (!databaseUrl) {
    console.error(
      "Missing DATABASE_URL in .env.local.\n\n" +
        "Add your Supabase connection string (Project Settings → Database → Connection string → URI),\n" +
        "then rerun: npm run db:apply-qr-analytics\n\n" +
        "Or paste the SQL from: node scripts/apply-qr-analytics-migrations.mjs --print",
    );
    process.exit(1);
  }

  if (process.argv.includes("--print")) {
    for (const file of migrations) {
      const path = resolve(process.cwd(), "supabase/migrations", file);
      console.log(`-- ${file}\n${readFileSync(path, "utf8").trim()}\n`);
    }
    return;
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    for (const file of migrations) {
      const path = resolve(process.cwd(), "supabase/migrations", file);
      const sql = readFileSync(path, "utf8");
      console.log(`Applying ${file}...`);
      await client.query(sql);
      console.log(`✓ ${file}`);
    }

    console.log("\nQR scan analytics migrations applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
