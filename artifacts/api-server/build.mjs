import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(artifactDir, "../..");

// Native addons that can never be bundled
const NATIVE_EXTERNALS = ["*.node", "pg-native", "bcrypt"];

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  // 1. Local dev server — externalize ALL node_modules, only compile TS→CJS.
  //    Packages are already installed locally so there's no need to bundle them.
  //    This drops dist/index.cjs and dist/app.cjs from ~2.2 MB to ~50 KB.
  await esbuild({
    entryPoints: [
      path.resolve(artifactDir, "src/index.ts"),
      path.resolve(artifactDir, "src/app.ts"),
    ],
    platform: "node",
    bundle: true,
    packages: "external",          // skip ALL node_modules
    external: NATIVE_EXTERNALS,
    format: "cjs",
    outdir: distDir,
    outExtension: { ".js": ".cjs" },
    logLevel: "info",
    sourcemap: "linked",
  });

  // 2. Vercel serverless handler — must be fully self-contained (no node_modules
  //    on Lambda), so we bundle everything and minify + tree-shake.
  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/vercel-handler.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: path.resolve(workspaceRoot, "api/handler.js"),
    logLevel: "info",
    sourcemap: false,
    minify: true,
    treeShaking: true,
    external: NATIVE_EXTERNALS,
    // Vercel's @vercel/node reads module.exports as the handler.
    footer: {
      js: "module.exports = exports.default ?? module.exports;",
    },
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
