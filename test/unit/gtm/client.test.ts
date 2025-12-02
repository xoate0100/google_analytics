import { describe, it, expect, vi, beforeEach } from "vitest";
import { GTMClient } from "../../../src/gtm/client.js";
import type { ILogger, IRateLimiter } from "../../../src/core/types.js";
import type { OAuthClient } from "../../../src/core/oauth.js";

describe("GTM Client", () => {
  let mockLogger: ILogger;
  let mockRateLimiter: IRateLimiter;
  let mockOAuthClient: OAuthClient;
  let mockOAuth2Client: unknown;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    };

    mockRateLimiter = {
      checkLimit: vi.fn().mockResolvedValue({ allowed: true }),
      waitForToken: vi.fn().mockResolvedValue(undefined),
      reset: vi.fn().mockResolvedValue(undefined),
      getState: vi.fn().mockReturnValue(undefined),
    };

    mockOAuth2Client = {
      setCredentials: vi.fn(),
      getAccessToken: vi.fn().mockResolvedValue({ token: "test-token" }),
    };

    mockOAuthClient = {
      getOAuth2Client: vi.fn().mockReturnValue(mockOAuth2Client),
      refreshAccessToken: vi.fn().mockResolvedValue({ token: "refreshed-token" }),
    } as unknown as OAuthClient;
  });

  describe("constructor", () => {
    it("should create GTM client with required options", () => {
      const client = new GTMClient({
        logger: mockLogger,
        rateLimiter: mockRateLimiter,
        oauthClient: mockOAuthClient,
      });

      expect(client).toBeInstanceOf(GTMClient);
    });

    it("should throw error if logger is missing", () => {
      expect(() => {
        new GTMClient({
          logger: null as unknown as ILogger,
          rateLimiter: mockRateLimiter,
          oauthClient: mockOAuthClient,
        });
      }).toThrow("Logger, rate limiter, and OAuth client are required");
    });

    it("should throw error if rate limiter is missing", () => {
      expect(() => {
        new GTMClient({
          logger: mockLogger,
          rateLimiter: null as unknown as IRateLimiter,
          oauthClient: mockOAuthClient,
        });
      }).toThrow("Logger, rate limiter, and OAuth client are required");
    });

    it("should throw error if OAuth client is missing", () => {
      expect(() => {
        new GTMClient({
          logger: mockLogger,
          rateLimiter: mockRateLimiter,
          oauthClient: null as unknown as OAuthClient,
        });
      }).toThrow("Logger, rate limiter, and OAuth client are required");
    });
  });

  describe("getTagManagerClient", () => {
    it("should return Tag Manager API client", () => {
      const client = new GTMClient({
        logger: mockLogger,
        rateLimiter: mockRateLimiter,
        oauthClient: mockOAuthClient,
      });

      const tagManagerClient = client.getTagManagerClient();

      expect(tagManagerClient).toBeDefined();
      expect(mockOAuthClient.getOAuth2Client).toHaveBeenCalled();
    });

    it("should initialize client only once", () => {
      const client = new GTMClient({
        logger: mockLogger,
        rateLimiter: mockRateLimiter,
        oauthClient: mockOAuthClient,
      });

      const client1 = client.getTagManagerClient();
      const client2 = client.getTagManagerClient();

      expect(client1).toBe(client2);
      expect(mockOAuthClient.getOAuth2Client).toHaveBeenCalledTimes(1);
    });
  });

  describe("checkRateLimit", () => {
    it("should check rate limit successfully", async () => {
      const client = new GTMClient({
        logger: mockLogger,
        rateLimiter: mockRateLimiter,
        oauthClient: mockOAuthClient,
      });

      await client.checkRateLimit("gtm", "container.list");

      expect(mockRateLimiter.checkLimit).toHaveBeenCalledWith("gtm", "container.list");
    });

    it("should wait for token if rate limited with retryAfter", async () => {
      (mockRateLimiter.checkLimit as ReturnType<typeof vi.fn>).mockResolvedValue({
        allowed: false,
        retryAfter: 1000,
      });

      const client = new GTMClient({
        logger: mockLogger,
        rateLimiter: mockRateLimiter,
        oauthClient: mockOAuthClient,
      });

      await client.checkRateLimit("gtm", "container.list");

      expect(mockRateLimiter.waitForToken).toHaveBeenCalledWith("gtm", "container.list");
    });

    it("should throw quota error if rate limited without retryAfter", async () => {
      (mockRateLimiter.checkLimit as ReturnType<typeof vi.fn>).mockResolvedValue({
        allowed: false,
        retryAfter: undefined,
      });

      const client = new GTMClient({
        logger: mockLogger,
        rateLimiter: mockRateLimiter,
        oauthClient: mockOAuthClient,
      });

      await expect(client.checkRateLimit("gtm", "container.list")).rejects.toThrow();
    });
  });
});

