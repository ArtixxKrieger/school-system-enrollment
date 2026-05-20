import app, { migrationReady } from "./app.js";

export default async function handler(req: any, res: any) {
  try {
    await migrationReady;
  } catch (err: any) {
    // Log the migration error but DO NOT block requests — tables likely already
    // exist from a previous cold start. Blocking all traffic on a migration
    // warning causes the "Database migration failed" login screen loop.
    console.error("[vercel] Migration warning (non-fatal):", err?.message, err?.code);
  }
  return app(req, res);
}
