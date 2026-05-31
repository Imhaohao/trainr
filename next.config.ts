import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

// Pin the workspace root to this project. Without this, Next infers the root
// from the nearest lockfile and can walk up to a stray lockfile in a parent
// directory (e.g. ~/package-lock.json), emitting a "inferred workspace root"
// warning and potentially resolving files from the wrong place.
const nextConfig: NextConfig = {
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
};

export default nextConfig;
