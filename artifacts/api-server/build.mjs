import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
// Two levels up from artifacts/api-server → workspace root
const workspaceRoot = path.resolve(artifactDir, "../..");

const EXTERNALS = ["*.node", "pg-native", "bcrypt", "pino-pretty", "thread-stream"];

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  // 1. Local dev server bundle (index + app)
  await esbuild({
    entryPoints: [
      path.resolve(artifactDir, "src/index.ts"),
      path.resolve(artifactDir, "src/app.ts"),
    ],
    platform: "node",
    bundle: true,
    format: "cjs",
    outdir: distDir,
    outExtension: { ".js": ".cjs" },
    logLevel: "info",
    sourcemap: "linked",
    external: EXTERNALS,
  });

  // 2. Vercel serverless handler — built directly into api/handler.js
  //    This replaces whatever placeholder is in git so Vercel gets a
  //    fully self-contained CJS file with no dynamic requires.
  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/vercel-handler.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: path.resolve(workspaceRoot, "api/handler.js"),
    logLevel: "info",
    sourcemap: false,
    minify: true,
    external: EXTERNALS,
    // Vercel's @vercel/node reads module.exports as the handler.
    // esbuild CJS output sets exports.default; this footer bridges the gap.
    footer: {
      js: "module.exports = exports.default ?? module.exports;",
    },
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
