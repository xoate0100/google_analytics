/**
 * Vitest configuration for integration tests
 * Extends base config with integration-specific settings
 */

import { defineConfig } from "vitest/config";
import baseConfig from "../../vitest.config.js";

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ["test/integration/**/*.{test,spec}.{ts,js}"],
    setupFiles: ["./test/integration/setup.ts"],
    testTimeout: 30000, // Longer timeout for integration tests
    hookTimeout: 30000,
  },
});

