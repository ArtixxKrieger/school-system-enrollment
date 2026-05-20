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

// Which build to run is controlled by the BUILD_TARGET env var:
//   BUILD_TARGET=vercel  → only builds api/handler.js  (used by Vercel)
//   BUILD_TARGET=dev     → only builds dist/*.cjs       (used locally)
//   (unset)              → builds both
const target = process.env.BUILD_TARGET;

async function buildDevServer() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  // Bundle everything (workspace + npm packages) so all deps are self-contained.
  // Node_modules don't need to be installed next to the output file.
  await esbuild({
    entryPoints: [
      path.resolve(artifactDir, "src/index.ts"),
      path.resolve(artifactDir, "src/app.ts"),
    ],
    platform: "node",
    bundle: true,
    external: NATIVE_EXTERNALS,
    format: "cjs",
    outdir: distDir,
    outExtension: { ".js": ".cjs" },
    logLevel: "info",
    sourcemap: "linked",
  });
}

async function buildVercelHandler() {
  // Must be fully self-contained (Lambda has no node_modules).
  // Minify + tree-shake to reduce cold-start size.
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

async function main() {
  if (target === "vercel") {
    await buildVercelHandler();
  } else if (target === "dev") {
    await buildDevServer();
  } else {
    await buildDevServer();
    await buildVercelHandler();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
