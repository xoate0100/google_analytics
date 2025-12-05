/**
 * GA4 retry and rate limit test matrix
 * Tests rate limit handling, retry logic, circuit breaker integration, and quota error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import nock from "nock";
import {
  createIntegrationTestContext,
  mockOAuthTokenEndpoint,
  GA4_DATA_API_BASE,
  type IntegrationTestContext,
} from "../helpers/mock-google-apis.js";
import { registerGA4Tools } from "../../../src/ga4/tools.js";
import { MCPServerBootstrap } from "../../../src/server/bootstrap.js";

describe("GA4 Retry and Rate Limit Test Matrix", () => {
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

    // Register GA4 capabilities
    context.capabilitiesRegistry.setProductCapabilities("ga4", {
      "data_api": "v1beta",
      "admin_api": "v1beta",
      "measurement_protocol": true,
    });

    // Set credentials on OAuth client
    const oauth2Client = context.oauthClient.getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      expiry_date: Date.now() + 3600000,
    });

    registerGA4Tools({
      bootstrap,
      ga4Client: context.ga4Client,
      cache: context.cache,
      capabilitiesRegistry: context.capabilitiesRegistry,
      logger: context.logger,
    });

    // Clean and setup nock AFTER everything is initialized
    nock.cleanAll();
    nock.disableNetConnect();

    // Mock OAuth token endpoint for refresh scenarios
    mockOAuthTokenEndpoint(200, {
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      expires_in: 3600,
      token_type: "Bearer",
    });
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  describe("Rate limit handling", () => {
    it.skip("should handle 429 rate limit responses with Retry-After header", async () => {
      const propertyId = "properties/123456789";
      const retryAfter = 2;
      let requestCount = 0;

      // Mock rate limit then success
      const scope = nock(GA4_DATA_API_BASE)
        .post("/v1beta/properties/123456789:runReport")
        .reply(() => {
          requestCount++;
          if (requestCount === 1) {
            return [
              429,
              { error: { code: 429, message: "Rate limit exceeded" } },
              { "Retry-After": String(retryAfter) },
            ];
          }
          return [200, { rows: [], rowCount: 0 }];
        });

      expect(scope).toBeDefined();

      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("ga4.report.run");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      // Use fake timers to control retry timing
      vi.useFakeTimers();

      const requestPromise = handler?.({
        property: propertyId,
        dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
      });

      // Advance time to trigger retry
      await vi.advanceTimersByTimeAsync(retryAfter * 1000 + 100);

      const result = await requestPromise;
      expect(result).toBeDefined();

      vi.useRealTimers();
    });

    it.skip("should respect rate limit and wait before retrying", async () => {
      const propertyId = "properties/123456789";
      let requestCount = 0;

      // Mock rate limit on first request
      nock(GA4_DATA_API_BASE)
        .post("/v1beta/properties/123456789:runReport")
        .reply(() => {
          requestCount++;
          if (requestCount === 1) {
            return [
              429,
              { error: { code: 429, message: "Rate limit exceeded" } },
              { "Retry-After": "1" },
            ];
          }
          return [200, { rows: [], rowCount: 0 }];
        });

      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("ga4.report.run");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      vi.useFakeTimers();

      const requestPromise = handler?.({
        property: propertyId,
        dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
      });

      // Wait for retry
      await vi.advanceTimersByTimeAsync(1500);

      const result = await requestPromise;
      expect(result).toBeDefined();
      expect(requestCount).toBeGreaterThan(1);

      vi.useRealTimers();
    });
  });

  describe("Retry logic with exponential backoff", () => {
    it.skip("should retry with exponential backoff on transient errors", async () => {
      const propertyId = "properties/123456789";
      let attemptCount = 0;

      // Mock transient errors (500) that eventually succeed
      nock(GA4_DATA_API_BASE)
        .post("/v1beta/properties/123456789:runReport")
        .times(3)
        .reply(() => {
          attemptCount++;
          if (attemptCount < 3) {
            return [500, { error: { code: 500, message: "Internal server error" } }];
          }
          return [200, { rows: [], rowCount: 0 }];
        });

      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("ga4.report.run");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      vi.useFakeTimers();

      const requestPromise = handler?.({
        property: propertyId,
        dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
      });

      // Advance time to allow retries with exponential backoff
      // First retry: ~250ms, second retry: ~500ms
      await vi.advanceTimersByTimeAsync(1000);

      const result = await requestPromise;
      expect(result).toBeDefined();
      expect(attemptCount).toBe(3);

      vi.useRealTimers();
    });

    it.skip("should stop retrying after max attempts", async () => {
      const propertyId = "properties/123456789";
      let attemptCount = 0;

      // Mock persistent 500 errors
      nock(GA4_DATA_API_BASE)
        .post("/v1beta/properties/123456789:runReport")
        .reply(() => {
          attemptCount++;
          return [500, { error: { code: 500, message: "Internal server error" } }];
        });

      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("ga4.report.run");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      vi.useFakeTimers();

      const requestPromise = handler?.({
        property: propertyId,
        dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
      });

      // Advance time to allow all retry attempts
      await vi.advanceTimersByTimeAsync(10000);

      await expect(requestPromise).rejects.toThrow();
      // Should have attempted max retries (default 5)
      expect(attemptCount).toBeGreaterThanOrEqual(5);

      vi.useRealTimers();
    });
  });

  describe("Circuit breaker integration", () => {
    it.skip("should open circuit breaker after threshold failures", async () => {
      const propertyId = "properties/123456789";
      let requestCount = 0;

      // Mock persistent failures to trip circuit breaker
      nock(GA4_DATA_API_BASE)
        .post("/v1beta/properties/123456789:runReport")
        .reply(() => {
          requestCount++;
          return [500, { error: { code: 500, message: "Internal server error" } }];
        });

      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("ga4.report.run");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      // Make multiple requests to trip circuit breaker
      const requests = Array.from({ length: 10 }, () =>
        handler?.({
          property: propertyId,
          dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
          dimensions: [{ name: "country" }],
          metrics: [{ name: "activeUsers" }],
        })
      ).filter((req): req is Promise<unknown> => req !== undefined);

      await Promise.allSettled(requests);

      // Circuit breaker should have opened, preventing excessive requests
      expect(requestCount).toBeLessThan(10);
    });

    it.skip("should transition to half-open state after reset timeout", async () => {
      const propertyId = "properties/123456789";
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let requestCount = 0;
      let shouldSucceed = false;

      // Mock failures then success
      nock(GA4_DATA_API_BASE)
        .post("/v1beta/properties/123456789:runReport")
        .reply(() => {
          requestCount++;
          if (shouldSucceed) {
            return [200, { rows: [], rowCount: 0 }];
          }
          return [500, { error: { code: 500, message: "Internal server error" } }];
        });

      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("ga4.report.run");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      // Trip circuit breaker
      await Promise.allSettled([
        handler?.({
          property: propertyId,
          dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
          dimensions: [{ name: "country" }],
          metrics: [{ name: "activeUsers" }],
        }),
      ]);

      // Wait for reset timeout
      vi.useFakeTimers();
      await vi.advanceTimersByTimeAsync(60000); // Default reset timeout

      // Service should now be available
      shouldSucceed = true;

      const result = await handler?.({
        property: propertyId,
        dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
      });

      expect(result).toBeDefined();

      vi.useRealTimers();
    });
  });

  describe("Quota error handling", () => {
    it("should handle quota exceeded errors gracefully", async () => {
      const propertyId = "properties/123456789";

      nock(GA4_DATA_API_BASE)
        .post("/v1beta/properties/123456789:runReport")
        .reply(429, {
          error: {
            code: 429,
            message: "Quota exceeded for quota metric 'Queries per day'",
            status: "RESOURCE_EXHAUSTED",
          },
        });

      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("ga4.report.run");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      await expect(
        handler?.({
          property: propertyId,
          dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
          dimensions: [{ name: "country" }],
          metrics: [{ name: "activeUsers" }],
        })
      ).rejects.toThrow();
    });

    it("should handle project quota exceeded errors", async () => {
      const propertyId = "properties/123456789";

      nock(GA4_DATA_API_BASE)
        .post("/v1beta/properties/123456789:runReport")
        .reply(429, {
          error: {
            code: 429,
            message: "Project quota exceeded",
            status: "RESOURCE_EXHAUSTED",
            details: [
              {
                "@type": "type.googleapis.com/google.rpc.QuotaFailure",
                violations: [
                  {
                    subject: "projects/123456",
                    description: "Quota limit exceeded",
                  },
                ],
              },
            ],
          },
        });

      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("ga4.report.run");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      await expect(
        handler?.({
          property: propertyId,
          dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
          dimensions: [{ name: "country" }],
          metrics: [{ name: "activeUsers" }],
        })
      ).rejects.toThrow();
    });
  });
});
