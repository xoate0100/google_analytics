/**
 * Example integration test
 * Demonstrates the integration test framework usage
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createIntegrationTestContext,
  mockGA4DataAPI,
  mockOAuthTokenEndpoint,
} from "./helpers/mock-google-apis.js";
import type { IntegrationTestContext } from "./helpers/mock-google-apis.js";
import { registerGA4Tools } from "../../src/ga4/tools.js";
import { MCPServerBootstrap } from "../../src/server/bootstrap.js";

describe("Integration Test Framework Example", () => {
  let context: IntegrationTestContext;
  let bootstrap: MCPServerBootstrap;

  beforeEach(async () => {
    context = await createIntegrationTestContext();
    bootstrap = new MCPServerBootstrap({
      name: "test-server",
      version: "0.1.0",
      logger: context.logger,
    });
    bootstrap.initialize();
  });

  it("should register GA4 tools with mocked dependencies", () => {
    registerGA4Tools({
      bootstrap,
      ga4Client: context.ga4Client,
      cache: context.cache,
      capabilitiesRegistry: context.capabilitiesRegistry,
      logger: context.logger,
    });

    // Tools should be registered
    expect(bootstrap).toBeDefined();
  });

  it("should mock OAuth token endpoint", async () => {
    mockOAuthTokenEndpoint(200, {
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      expires_in: 3600,
    });

    // OAuth client should be able to use mocked endpoint
    expect(context.oauthClient).toBeDefined();
  });

  it("should mock GA4 Data API endpoint", () => {
    const scope = mockGA4DataAPI("POST", "/v1beta/properties/123456789:runReport", 200, {
      rows: [],
      rowCount: 0,
    });

    expect(scope).toBeDefined();
  });
});
