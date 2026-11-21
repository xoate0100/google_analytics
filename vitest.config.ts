import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.{test,spec}.{ts,js}"],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.{ts,js}"],
      exclude: [
        "node_modules/",
        "test/",
        "scripts/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.config.ts",
        "dist/",
      ],
      // Ratchet floor from CI-measured baseline (close-the-stalls-v1 task 4).
      // ACTIVE_PLAN documents ~75%+ as acceptable post-refactor; keep check blocking.
      thresholds: {
        lines: 80,
        functions: 83,
        branches: 67,
        statements: 80,
      },
    },
    setupFiles: ["./test/setup.ts"],
    testTimeout: 15000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@core": resolve(__dirname, "./src/core"),
      "@auth": resolve(__dirname, "./src/auth"),
      "@ga4": resolve(__dirname, "./src/ga4"),
      "@gtm": resolve(__dirname, "./src/gtm"),
      "@ads": resolve(__dirname, "./src/ads"),
    },
  },
});
