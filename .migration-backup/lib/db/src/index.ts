import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase.co")
    ? { rejectUnauthorized: false }
    : undefined,
  // Fail fast instead of hanging indefinitely in serverless environments
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  // One connection per Lambda instance is enough
  max: 3,
});
export const db = drizzle(pool, { schema });

export * from "./schema/index.js";
