import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const _require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use path.join with individual segments so Vercel's bundler cannot
// statically resolve and inline the CJS bundle at build time.
// The file is included at runtime via vercel.json includeFiles.
const APP_BUNDLE = path.join(
  __dirname,
  "..",
  "artifacts",
  "api-server",
  "dist",
  "app.cjs"
);

let app, migrationReady, loadError;
try {
  const mod = _require(APP_BUNDLE);
  app = mod.default ?? mod;
  migrationReady = mod.migrationReady;
} catch (err) {
  loadError = err;
  console.error("[handler] load error:", err.message, "\n", err.stack);
}

export default async function handler(req, res) {
  if (loadError) {
    res.status(500).json({
      error: loadError.message,
      cause: loadError.code,
      trace: loadError.stack?.split("\n").slice(0, 10),
    });
    return;
  }
  try {
    if (migrationReady) await migrationReady;
  } catch (err) {
    console.error("[handler] migration error:", err.message);
  }
  return app(req, res);
}
