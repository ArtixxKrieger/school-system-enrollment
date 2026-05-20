import app, { migrationReady } from "./app.js";

export default async function handler(req: any, res: any) {
  try {
    await migrationReady;
  } catch (err: any) {
    // Surface the real DB error as JSON so we can diagnose it
    console.error("[vercel] Migration failed:", err?.message, err?.stack);
    return res.status(500).json({
      error: "Database migration failed",
      detail: err?.message,
      code: err?.code,
    });
  }
  return app(req, res);
}
