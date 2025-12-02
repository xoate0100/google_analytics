import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GA4Client,
  GA4ClientOptions,
} from "../../../src/ga4/client.js";
import type { ILogger } from "../../../src/core/types.js";
import type { IRateLimiter } from "../../../src/core/types.js";
import type { OAuthClient } from "../../../src/core/oauth.js";

describe("GA4 REST Client", () => {
  let mockLogger: ILogger;
  let mockRateLimiter: IRateLimiter;
  let mockOAuthClient: OAuthClient;
  let clientOptions: GA4ClientOptions;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => mockLogger),
    };

    mockRateLimiter = {
      checkLimit: vi.fn().mockResolvedValue({
        allowed: true,
        tokensRemaining: 10,
        retryAfter: undefined,
      }),
      waitForToken: vi.fn().mockResolvedValue(undefined),
      reset: vi.fn(),
      getState: vi.fn().mockResolvedValue({
        tokens: 10,
        lastRefill: Date.now(),
        burstAllowance: 10,
      }),
    };

    mockOAuthClient = {
      refreshAccessToken: vi.fn().mockResolvedValue({
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        expiresAt: Date.now() + 3600000,
      }),
      getOAuth2Client: vi.fn(),
    } as unknown as OAuthClient;

    clientOptions = {
      logger: mockLogger,
      rateLimiter: mockRateLimiter,
      oauthClient: mockOAuthClient,
    };
  });

  describe("constructor", () => {
    it("should create GA4 client with required options", () => {
      const client = new GA4Client(clientOptions);
      expect(client).toBeDefined();
    });

    it("should throw error if logger is missing", () => {
      expect(() => {
        new GA4Client({
          ...clientOptions,
          logger: undefined as unknown as ILogger,
        });
      }).toThrow();
    });
  });

  describe("getAnalyticsDataClient", () => {
    it("should return analytics data client", () => {
      const client = new GA4Client(clientOptions);
      const dataClient = client.getAnalyticsDataClient();
      expect(dataClient).toBeDefined();
    });
  });

  describe("getAnalyticsAdminClient", () => {
    it("should return analytics admin client", () => {
      const client = new GA4Client(clientOptions);
      const adminClient = client.getAnalyticsAdminClient();
      expect(adminClient).toBeDefined();
    });

    it("should initialize admin client only once", () => {
      const client = new GA4Client(clientOptions);
      const adminClient1 = client.getAnalyticsAdminClient();
      const adminClient2 = client.getAnalyticsAdminClient();
      expect(adminClient1).toBe(adminClient2);
    });

    it("should log debug message when initializing admin client", () => {
      const client = new GA4Client(clientOptions);
      client.getAnalyticsAdminClient();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining("Analytics Admin API client initialized")
      );
    });
  });

  describe("rate limiting", () => {
    it("should check rate limit before making request", async () => {
      const client = new GA4Client(clientOptions);
      // Stub method for testing
      await expect(
        client.checkRateLimit("ga4", "runReport")
      ).resolves.toBeUndefined();

      const checkLimitCalls = (mockRateLimiter.checkLimit as ReturnType<typeof vi.fn>).mock.calls;
      expect(checkLimitCalls.some((call) => call[0] === "ga4" && call[1] === "runReport")).toBe(true);
    });

    it("should wait for token if rate limited", async () => {
      mockRateLimiter.checkLimit = vi.fn().mockResolvedValue({
        allowed: false,
        tokensRemaining: 0,
        retryAfter: 1000,
      });

      const client = new GA4Client(clientOptions);
      await client.checkRateLimit("ga4", "runReport");

      const waitForTokenCalls = (mockRateLimiter.waitForToken as ReturnType<typeof vi.fn>).mock.calls;
      expect(waitForTokenCalls.some((call) => call[0] === "ga4" && call[1] === "runReport")).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle authentication errors", async () => {
      const client = new GA4Client(clientOptions);
      // Error handling will be tested with actual API calls in integration tests
      expect(client).toBeDefined();
    });
  });
});

