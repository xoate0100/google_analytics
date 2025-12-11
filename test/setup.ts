// Global test setup file
// This file runs before all tests

import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";

// Global test setup
beforeAll(() => {
  // Set up global test environment
  process.env.NODE_ENV = "test";
});

afterAll(() => {
  // Cleanup after all tests
});

beforeEach(() => {
  // Setup before each test
});

afterEach(() => {
  // Cleanup after each test
});
