import app from "../artifacts/api-server/dist/app.mjs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { Pool } = require("pg");
const bcryptjs = require("bcryptjs");

let initialized = false;

async function init() {
  if (initialized || !process.env.DATABASE_URL) return;

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    const { rows } = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      ) AS exists
    `);

    if (!rows[0].exists) {
      const sqlPath = path.join(__dirname, "../lib/db/drizzle/0000_init.sql");
      const sql = fs.readFileSync(sqlPath, "utf8")
        .replace(/--> statement-breakpoint\n/g, "\n");
      await pool.query(sql);
      console.log("[handler] Schema created");
    }

    const { rows: admins } = await pool.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );
    if (admins.length === 0) {
      const password = process.env.ADMIN_DEFAULT_PASSWORD ?? "Admin@123";
      const hashed = await bcryptjs.hash(password, 12);
      await pool.query(
        `INSERT INTO users (username, password, email, full_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ["admin", hashed, "admin@kurios.local", "System Administrator", "admin", true]
      );
      console.log("[handler] Admin account created — change the password after first login");
    }
  } catch (err) {
    console.error("[handler] Init error:", err.message);
  } finally {
    await pool.end();
  }

  initialized = true;
}

const initPromise = init();

export default async function handler(req, res) {
  await initPromise;
  return app(req, res);
}
