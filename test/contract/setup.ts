/**
 * Contract test setup
 * Configures environment for contract tests that validate API contracts
 * Contract tests can optionally run against live sandbox APIs (controlled by env vars)
 */

import { beforeAll, afterAll } from "vitest";

// Contract tests can optionally use real APIs (sandbox environments)
// Set CONTRACT_TEST_USE_REAL_APIS=true to enable real API calls
// In CI, these tests are skipped by default unless explicitly enabled
beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.CONTRACT_TEST = "true";

  // Allow real network connections for contract tests if enabled
  const useRealApis = process.env.CONTRACT_TEST_USE_REAL_APIS === "true";
  if (!useRealApis) {
    // If not using real APIs, contract tests should be skipped
    // This is the default behavior in CI
    console.log(
      "[contract-test] CONTRACT_TEST_USE_REAL_APIS not set to 'true', contract tests will be skipped"
    );
  } else {
    console.log(
      "[contract-test] Running contract tests against real APIs (sandbox)"
    );
  }
});

afterAll(() => {
  // Cleanup if needed
});
