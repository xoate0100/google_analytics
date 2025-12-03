import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdsClient } from "../../../src/ads/client.js";
import type { ILogger, IRateLimiter } from "../../../src/core/types.js";
import type { OAuthClient } from "../../../src/core/oauth.js";

describe("AdsClient", () => {
  let mockLogger: ILogger;
  let mockRateLimiter: IRateLimiter;
  let mockOAuthClient: OAuthClient;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => mockLogger),
    };

    mockRateLimiter = {
      checkLimit: vi.fn().mockResolvedValue({ allowed: true }),
      waitForToken: vi.fn().mockResolvedValue(undefined),
    } as unknown as IRateLimiter;

    mockOAuthClient = {
      getOAuth2Client: vi.fn().mockReturnValue({}),
    } as unknown as OAuthClient;
  });

  describe("constructor", () => {
    it("should create client with required dependencies", () => {
      const client = new AdsClient({
        logger: mockLogger,
        rateLimiter: mockRateLimiter,
        oauthClient: mockOAuthClient,
      });

      expect(client).toBeDefined();
    });

    it("should throw error if logger is missing", () => {
      expect(() => {
        new AdsClient({
          logger: undefined as unknown as ILogger,
          rateLimiter: mockRateLimiter,
          oauthClient: mockOAuthClient,
        });
      }).toThrow("Logger, rate limiter, and OAuth client are required");
    });

    it("should throw error if rate limiter is missing", () => {
      expect(() => {
        new AdsClient({
          logger: mockLogger,
          rateLimiter: undefined as unknown as IRateLimiter,
          oauthClient: mockOAuthClient,
        });
      }).toThrow("Logger, rate limiter, and OAuth client are required");
    });

    it("should throw error if OAuth client is missing", () => {
      expect(() => {
        new AdsClient({
          logger: mockLogger,
          rateLimiter: mockRateLimiter,
          oauthClient: undefined as unknown as OAuthClient,
        });
      }).toThrow("Logger, rate limiter, and OAuth client are required");
    });
  });

  describe("checkRateLimit", () => {
    it("should check rate limit successfully", async () => {
      const client = new AdsClient({
        logger: mockLogger,
        rateLimiter: mockRateLimiter,
        oauthClient: mockOAuthClient,
      });

      await client.checkRateLimit("ads", "report.gaql");

      expect(mockRateLimiter.checkLimit).toHaveBeenCalledWith("ads", "report.gaql");
    });

    it("should wait for token if rate limited with retryAfter", async () => {
      const mockRateLimiterWithRetry = {
        checkLimit: vi.fn().mockResolvedValue({
          allowed: false,
          retryAfter: 1000,
        }),
        waitForToken: vi.fn().mockResolvedValue(undefined),
      } as unknown as IRateLimiter;

      const client = new AdsClient({
        logger: mockLogger,
        rateLimiter: mockRateLimiterWithRetry,
        oauthClient: mockOAuthClient,
      });

      await client.checkRateLimit("ads", "report.gaql");

      expect(mockRateLimiterWithRetry.waitForToken).toHaveBeenCalledWith("ads", "report.gaql");
    });

    it("should throw quota error if rate limited without retryAfter", async () => {
      const mockRateLimiterNoRetry = {
        checkLimit: vi.fn().mockResolvedValue({
          allowed: false,
          retryAfter: undefined,
        }),
        waitForToken: vi.fn().mockResolvedValue(undefined),
      } as unknown as IRateLimiter;

      const client = new AdsClient({
        logger: mockLogger,
        rateLimiter: mockRateLimiterNoRetry,
        oauthClient: mockOAuthClient,
      });

      await expect(client.checkRateLimit("ads", "report.gaql")).rejects.toThrow();
    });
  });

  describe("getGoogleAdsClient", () => {
    it("should initialize and return Google Ads client", () => {
      const client = new AdsClient({
        logger: mockLogger,
        rateLimiter: mockRateLimiter,
        oauthClient: mockOAuthClient,
        developerToken: "test-token",
      });

      const adsClient = client.getGoogleAdsClient();

      // Note: This test may need adjustment based on actual Google Ads API client implementation
      // For now, we're testing the structure
      expect(adsClient).toBeDefined();
      expect(mockOAuthClient.getOAuth2Client).toHaveBeenCalled();
    });

    it("should throw error if developer token is missing", () => {
      const client = new AdsClient({
        logger: mockLogger,
        rateLimiter: mockRateLimiter,
        oauthClient: mockOAuthClient,
      });

      expect(() => {
        client.getGoogleAdsClient();
      }).toThrow("Developer token is required for Google Ads API");
    });
  });
});
