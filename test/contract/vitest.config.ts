/**
 * Vitest configuration for contract tests
 * Extends base config with contract test-specific settings
 */

import { defineConfig } from "vitest/config";
import baseConfig from "../../vitest.config.js";

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ["test/contract/**/*.{test,spec}.{ts,js}"],
    setupFiles: ["./test/contract/setup.ts"],
    testTimeout: 60000, // Longer timeout for contract tests (may hit real APIs)
    hookTimeout: 60000,
    // Contract tests are skipped by default unless CONTRACT_TEST_USE_REAL_APIS=true
    // This prevents them from running in CI unless explicitly enabled
  },
});
