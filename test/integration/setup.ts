/**
 * Integration test setup
 * Configures environment for integration tests with mocked Google APIs
 */

import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import nock from "nock";

// Disable real HTTP requests in integration tests
beforeAll(() => {
  nock.disableNetConnect();
  nock.enableNetConnect("127.0.0.1");
  process.env.NODE_ENV = "test";
  process.env.INTEGRATION_TEST = "true";
});

afterAll(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

beforeEach(() => {
  // Clean up nock interceptors before each test
  nock.cleanAll();
});

afterEach(() => {
  // Ensure all nock interceptors were called
  if (!nock.isDone()) {
    const pendingMocks = nock.pendingMocks();
    throw new Error(`Unused nock interceptors: ${pendingMocks.join(", ")}`);
  }
  nock.cleanAll();
});
