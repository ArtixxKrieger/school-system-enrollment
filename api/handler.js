// Placeholder — overwritten by `pnpm --filter @workspace/api-server run build` during Vercel deploy.
// See artifacts/api-server/build.mjs for the real build.
module.exports = (req, res) => res.status(503).json({ error: "Not built yet" });
