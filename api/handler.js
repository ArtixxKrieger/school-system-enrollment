import { createRequire } from "module";
const require = createRequire(import.meta.url);

let app, migrationReady, loadError;
try {
  const mod = require("../artifacts/api-server/dist/app.cjs");
  app = mod.default ?? mod;
  migrationReady = mod.migrationReady;
} catch (err) {
  loadError = err;
  console.error("[handler] Failed to load app:", err.message, err.stack);
}

export default async function handler(req, res) {
  if (loadError) {
    // Expose the real error so we can diagnose it
    res.status(500).json({
      error: loadError.message,
      cause: loadError.code,
      trace: loadError.stack?.split("\n").slice(0, 8),
    });
    return;
  }
  try {
    if (migrationReady) await migrationReady;
  } catch (err) {
    console.error("[handler] Migration error:", err.message);
  }
  return app(req, res);
}
