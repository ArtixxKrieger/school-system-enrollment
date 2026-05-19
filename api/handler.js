import app, { migrationReady } from "../artifacts/api-server/dist/app.mjs";

export default async function handler(req, res) {
  await migrationReady;
  return app(req, res);
}
