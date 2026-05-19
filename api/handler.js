import { createRequire } from "module";
const require = createRequire(import.meta.url);
const mod = require("../artifacts/api-server/dist/app.cjs");
const app = mod.default ?? mod;

export default async function handler(req, res) {
  if (mod.migrationReady) await mod.migrationReady;
  return app(req, res);
}
