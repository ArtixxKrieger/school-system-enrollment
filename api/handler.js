import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { Pool } = require("pg");
const { drizzle } = require("drizzle-orm/node-postgres");
const { migrate } = require("drizzle-orm/node-postgres/migrator");
const bcryptjs = require("bcryptjs");

const MIGRATIONS_FOLDER = path.join(__dirname, "../lib/db/drizzle");

const initPromise = (async () => {
  if (!process.env.DATABASE_URL) {
    console.error("[handler] DATABASE_URL is not set — skipping DB init");
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    const db = drizzle(pool);

    // Applies any pending migrations — idempotent, safe to run every cold start
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    console.log("[handler] Migrations applied");

    // Seed admin account on first deploy
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );
    if (rows.length === 0) {
      const password = process.env.ADMIN_DEFAULT_PASSWORD ?? "Admin@123";
      const hashed = await bcryptjs.hash(password, 12);
      await pool.query(
        `INSERT INTO users (username, password, email, full_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ["admin", hashed, "admin@kurios.local", "System Administrator", "admin", true]
      );
      console.log("[handler] Admin account created (default password: Admin@123)");
    }
  } catch (err) {
    console.error("[handler] Init error:", err.message);
  } finally {
    await pool.end();
  }
})();

import app from "../artifacts/api-server/dist/app.mjs";

export default async function handler(req, res) {
  await initPromise;
  return app(req, res);
}
