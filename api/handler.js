'use strict';
const path = require('path');

// process.cwd() is always /var/task in Vercel Lambda.
// includeFiles in vercel.json ensures app.cjs is present at this path.
const APP_BUNDLE = path.join(process.cwd(), 'artifacts', 'api-server', 'dist', 'app.cjs');

let app, migrationReady, loadError;
try {
  const mod = require(APP_BUNDLE);
  app = mod.default ?? mod;
  migrationReady = mod.migrationReady;
} catch (err) {
  loadError = err;
  console.error('[handler] load error:', err.message);
  console.error('[handler] attempted path:', APP_BUNDLE);
  console.error('[handler] cwd:', process.cwd());
  console.error(err.stack);
}

module.exports = async function handler(req, res) {
  if (loadError) {
    return res.status(500).json({
      error: loadError.message,
      cause: loadError.code,
      attemptedPath: APP_BUNDLE,
      cwd: process.cwd(),
      trace: loadError.stack ? loadError.stack.split('\n').slice(0, 10) : [],
    });
  }
  try {
    if (migrationReady) await migrationReady;
  } catch (err) {
    console.error('[handler] migration error:', err.message);
  }
  return app(req, res);
};
