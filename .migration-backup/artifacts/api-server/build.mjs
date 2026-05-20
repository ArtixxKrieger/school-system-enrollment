import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm, cp } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(artifactDir, "../..");

const NATIVE_EXTERNALS = ["*.node", "pg-native", "bcrypt"];

const target = process.env.BUILD_TARGET;

async function buildDevServer() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

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

  // Copy pino's worker thread file so it can be found at runtime
  try {
    const pinoPath = globalThis.require.resolve("pino/file");
    const pinoDir = path.dirname(pinoPath);
    await cp(
      path.resolve(pinoDir, "../lib/worker.js"),
      path.resolve(distDir, "lib/worker.js"),
      { force: true }
    );
  } catch {
    // pino worker not found — safe to ignore if pino-http transport isn't used
  }
}

async function buildVercelHandler() {
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
