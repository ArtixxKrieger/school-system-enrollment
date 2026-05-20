import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./src/index.js";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("[migrate] Running database migrations…");

try {
  await migrate(db, { migrationsFolder: path.join(__dirname, "drizzle") });
  console.log("[migrate] Migrations applied successfully.");
} catch (err: any) {
  console.error("[migrate] Migration failed:", err?.message);
  process.exit(1);
} finally {
  await pool.end();
}
