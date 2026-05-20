import app, { migrationReady } from "./app.js";

export default async function handler(req: any, res: any) {
  try {
    await migrationReady;
  } catch (err: any) {
    console.error("[vercel] Migration error (non-fatal):", err?.message);
  }
  return app(req, res);
}
