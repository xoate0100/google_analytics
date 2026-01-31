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
      exclude: [
        "node_modules/",
        "test/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.config.ts",
        "dist/",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
      // Per-component thresholds (will be enforced in CI)
      // Backend: 100%, Shared: 90% per meta-framework
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
