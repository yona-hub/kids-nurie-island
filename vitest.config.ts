import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  resolve: {
    alias: {
      "@island/shared": fileURLToPath(
        new URL("./packages/shared-types/src/index.ts", import.meta.url),
      ),
      "@island/content": fileURLToPath(
        new URL("./packages/content-schema/src/index.ts", import.meta.url),
      ),
      "@island/engine": fileURLToPath(
        new URL("./packages/coloring-engine/src/index.ts", import.meta.url),
      ),
      "@island/persistence": fileURLToPath(
        new URL("./packages/persistence/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    environment: "node",
    testTimeout: 20000,
    pool: "threads",
    // Node 24 on this Windows host can abort inside V8's Wasm allocation
    // cleanup when several PGlite isolates exit concurrently. Keep isolation
    // and every test; serialize files on Windows instead of skipping SQL.
    maxWorkers: process.platform === "win32" ? 1 : undefined,
  },
});
