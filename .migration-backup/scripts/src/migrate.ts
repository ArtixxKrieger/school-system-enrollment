import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("[migrate] DATABASE_URL is required");
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : undefined,
    connectionTimeoutMillis: 15000,
  });

  const sqlPath = join(__dirname, "../../lib/db/drizzle/0000_init.sql");
  const sql = readFileSync(sqlPath, "utf-8");

  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`[migrate] Running ${statements.length} SQL statements against database...`);

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (err: any) {
      if (
        err.code === "42P07" ||
        err.code === "42710" ||
        err.message?.includes("already exists")
      ) {
        // Table or constraint already exists — safe to skip
      } else {
        console.error("[migrate] Statement failed:", statement.slice(0, 80));
        throw err;
      }
    }
  }

  console.log("[migrate] All tables created (or already exist).");
  await pool.end();
}

main().catch((err) => {
  console.error("[migrate] Migration failed:", err);
  process.exit(1);
});
