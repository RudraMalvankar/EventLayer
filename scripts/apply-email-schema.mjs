import fs from "fs";
import path from "path";
import pg from "pg";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sqlFile = path.join(root, "supabase", "email-subscriptions.sql");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
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

function projectRefFromUrl(url) {
  try {
    return new URL(url).hostname.split(".")[0];
  } catch {
    return null;
  }
}

function buildDbUrls(env) {
  const urls = [];
  if (env.DATABASE_URL) urls.push(env.DATABASE_URL);
  if (env.SUPABASE_DB_URL) urls.push(env.SUPABASE_DB_URL);
  const ref = projectRefFromUrl(env.NEXT_PUBLIC_SUPABASE_URL || "");
  const password =
    env.SUPABASE_DB_PASSWORD || env.POSTGRES_PASSWORD || env.DB_PASSWORD || "";
  if (ref && password) {
    const enc = encodeURIComponent(password);
    urls.push(
      `postgresql://postgres.${ref}:${enc}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
      `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`,
    );
  }
  return urls;
}

function trySupabaseCli(env) {
  if (!env.SUPABASE_ACCESS_TOKEN) return null;
  const result = spawnSync(
    "npx",
    ["supabase", "db", "query", "-f", sqlFile, "--linked"],
    { cwd: root, env: { ...process.env, ...env }, encoding: "utf8", shell: true },
  );
  return result.status === 0 ? result.stdout : null;
}

async function applyViaPg(url, sql) {
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(sql);
  await client.end();
}

async function main() {
  const env = loadEnvLocal();
  const sql = fs.readFileSync(sqlFile, "utf8");
  const cliOut = trySupabaseCli(env);
  if (cliOut !== null) {
    console.log(cliOut || "Email schema applied via Supabase CLI.");
    return;
  }
  const urls = buildDbUrls(env);
  if (!urls.length) {
    console.error("Add SUPABASE_DB_PASSWORD to .env.local or run SQL in Supabase dashboard.");
    process.exit(1);
  }
  for (const url of urls) {
    try {
      await applyViaPg(url, sql);
      console.log("Email subscriptions schema applied.");
      return;
    } catch (err) {
      console.error(err.message);
    }
  }
  process.exit(1);
}

main();
