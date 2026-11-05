import { defineConfig } from "tsup";

const shared = {
  format: ["esm", "cjs"] as ("esm" | "cjs")[],
  dts: true,
  sourcemap: true,
  target: "es2020",
  treeshake: true,
  clean: false, // handled by `npm run clean` (configs run in parallel)
};

export default defineConfig([
  // framework-agnostic core
  { ...shared, entry: { "core/index": "src/core/index.ts" } },
  // React adapter ("use client" is re-added by scripts/postbuild.mjs)
  {
    ...shared,
    entry: { "react/index": "src/react/index.ts" },
    external: ["react", "react/jsx-runtime"],
  },
]);
