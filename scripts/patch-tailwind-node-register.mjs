/**
 * Patch @tailwindcss/node for Node 26+ (DEP0205).
 * Upstream fix: https://github.com/tailwindlabs/tailwindcss/pull/20028
 * Remove this script once tailwindcss > 4.3.0 ships with the fix.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

let nodePkgDir;
try {
  nodePkgDir = dirname(require.resolve("@tailwindcss/node"));
} catch {
  process.exit(0);
}

const loaderMjsPath = join(nodePkgDir, "esm-cache.loader.mjs");
const loaderCjsPath = join(nodePkgDir, "esm-cache.loader.cjs");
const indexJsPath = join(nodePkgDir, "index.js");
const indexMjsPath = join(nodePkgDir, "index.mjs");

const loaderMjsSource = `import { isBuiltin } from "module";

function processResolve(context, result) {
  if (result.url === import.meta.url) return result;
  if (isBuiltin(result.url)) return result;
  if (!context.parentURL) return result;

  const parent = new URL(context.parentURL);
  const id = parent.searchParams.get("id");
  if (id === null) return result;

  const url = new URL(result.url);
  url.searchParams.set("id", id);
  return { ...result, url: \`\${url}\` };
}

export async function resolve(specifier, context, nextResolve) {
  const result = await nextResolve(specifier, context);
  return processResolve(context, result);
}

export function resolveSync(specifier, context, nextResolve) {
  const result = nextResolve(specifier, context);
  return processResolve(context, result);
}
`;

const loaderCjsSource = `"use strict";
const { isBuiltin } = require("module");
const { pathToFileURL } = require("url");

const loaderUrl = pathToFileURL(__filename).href;

function processResolve(context, result) {
  if (result.url === loaderUrl) return result;
  if (isBuiltin(result.url)) return result;
  if (!context.parentURL) return result;

  const parent = new URL(context.parentURL);
  const id = parent.searchParams.get("id");
  if (id === null) return result;

  const url = new URL(result.url);
  url.searchParams.set("id", id);
  return { ...result, url: \`\${url}\` };
}

async function resolve(specifier, context, nextResolve) {
  const result = await nextResolve(specifier, context);
  return processResolve(context, result);
}

function resolveSync(specifier, context, nextResolve) {
  const result = nextResolve(specifier, context);
  return processResolve(context, result);
}

module.exports = { resolve, resolveSync };
`;

const indexJsOld =
  'process.versions.bun||_t.register?.((0,Dt.pathToFileURL)(require.resolve("@tailwindcss/node/esm-cache-loader")))';

const indexJsNew =
  'if(!process.versions.bun){if(_t.registerHooks){let{resolveSync:e}=require("./esm-cache.loader.cjs");_t.registerHooks({resolve:e})}else{_t.register?.((0,Dt.pathToFileURL)(require.resolve("@tailwindcss/node/esm-cache-loader")))}}';

const indexMjsOld =
  'if(!process.versions.bun){let e=fe.createRequire(import.meta.url);fe.register?.(Xr(e.resolve("@tailwindcss/node/esm-cache-loader")))}';

const indexMjsNew =
  'if(!process.versions.bun){if(fe.registerHooks){let{resolveSync:e}=fe.createRequire(import.meta.url)("./esm-cache.loader.cjs");fe.registerHooks({resolve:e})}else{let e=fe.createRequire(import.meta.url);fe.register?.(Xr(e.resolve("@tailwindcss/node/esm-cache-loader")))}}';

function patchFile(path, transform, alreadyPatched) {
  if (!existsSync(path)) return;
  const source = readFileSync(path, "utf8");
  if (alreadyPatched(source)) return;
  const next = transform(source);
  if (next === source) {
    console.warn(`[patch-tailwind-node] skipped ${path}: pattern not found`);
    return;
  }
  writeFileSync(path, next);
  console.log(`[patch-tailwind-node] patched ${path}`);
}

function writeIfNeeded(path, source, marker) {
  if (!existsSync(path)) {
    writeFileSync(path, source);
    console.log(`[patch-tailwind-node] wrote ${path}`);
    return;
  }
  const current = readFileSync(path, "utf8");
  if (current.includes(marker)) return;
  writeFileSync(path, source);
  console.log(`[patch-tailwind-node] updated ${path}`);
}

writeIfNeeded(loaderMjsPath, loaderMjsSource, "resolveSync");
writeIfNeeded(loaderCjsPath, loaderCjsSource, "resolveSync");

patchFile(
  indexJsPath,
  (s) => s.replace(indexJsOld, indexJsNew),
  (s) => s.includes("registerHooks"),
);

patchFile(
  indexMjsPath,
  (s) => s.replace(indexMjsOld, indexMjsNew),
  (s) => s.includes("registerHooks"),
);
