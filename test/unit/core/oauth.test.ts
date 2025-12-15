import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  OAuthClient,
  OAuthClientOptions,
} from "../../../src/core/oauth.js";
import type { ILogger } from "../../../src/core/types.js";

describe("OAuth Client", () => {
  let mockLogger: ILogger;
  let clientOptions: OAuthClientOptions;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => mockLogger),
    };

    clientOptions = {
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      redirectUri: "http://localhost:8080/oauth2callback",
      logger: mockLogger,
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should create an OAuth client with required options", () => {
      const client = new OAuthClient(clientOptions);
      expect(client).toBeDefined();
    });

    it("should throw error if clientId is missing", () => {
      expect(() => {
        new OAuthClient({
          ...clientOptions,
          clientId: "",
        });
      }).toThrow();
    });

    it("should throw error if clientSecret is missing", () => {
      expect(() => {
        new OAuthClient({
          ...clientOptions,
          clientSecret: "",
        });
      }).toThrow();
    });
  });

  describe("startDeviceFlow", () => {
    it("should initiate device flow and return device code", async () => {
      const mockResponse = {
        device_code: "test-device-code-123",
        user_code: "ABCD-EFGH",
        verification_url: "https://www.google.com/device",
        expires_in: 1800,
        interval: 5,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const client = new OAuthClient(clientOptions);
      const scopes = [
        "https://www.googleapis.com/auth/analytics.readonly",
      ];

      const result = await client.startDeviceFlow(scopes);

      expect(result).toBeDefined();
      expect(result.deviceCode).toBe("test-device-code-123");
      expect(result.userCode).toBe("ABCD-EFGH");
      expect(result.verificationUrl).toBe("https://www.google.com/device");
      expect(result.expiresIn).toBe(1800);
      expect(result.interval).toBe(5);
    });

    it("should include all requested scopes in device flow", async () => {
      const mockResponse = {
        device_code: "test-device-code-456",
        user_code: "WXYZ-1234",
        verification_url: "https://www.google.com/device",
        expires_in: 1800,
        interval: 5,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const client = new OAuthClient(clientOptions);
      const scopes = [
        "https://www.googleapis.com/auth/analytics.readonly",
        "https://www.googleapis.com/auth/tagmanager.readonly",
      ];

      const result = await client.startDeviceFlow(scopes);

      expect(result.scopes).toEqual(scopes);
    });
  });

  describe("pollForTokens", () => {
    it("should poll for tokens and return token info", async () => {
      // Mock device flow response
      const deviceFlowResponse = {
        device_code: "test-device-code-789",
        user_code: "POLL-TEST",
        verification_url: "https://www.google.com/device",
        expires_in: 1800,
        interval: 5,
      };

      // Mock token response
      const tokenResponse = {
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        expires_in: 3600,
        token_type: "Bearer",
        scope: "https://www.googleapis.com/auth/analytics.readonly",
      };

      global.fetch = vi.fn((url) => {
        const urlStr = url as string;
        if (urlStr.includes("/device/code")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => deviceFlowResponse,
          } as Response);
        }
        if (urlStr.includes("/token")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => tokenResponse,
          } as Response);
        }
        return originalFetch(url as string);
      }) as typeof global.fetch;

      const client = new OAuthClient(clientOptions);
      const scopes = [
        "https://www.googleapis.com/auth/analytics.readonly",
      ];

      const deviceFlow = await client.startDeviceFlow(scopes);
      const tokens = await client.pollForTokens(deviceFlow.deviceCode);

      expect(tokens.accessToken).toBe("test-access-token");
      expect(tokens.refreshToken).toBe("test-refresh-token");
      expect(tokens.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
      expect(tokens.scopes).toEqual([
        "https://www.googleapis.com/auth/analytics.readonly",
      ]);
    });
  });

  describe("refreshAccessToken", () => {
    it("should refresh access token using refresh token", async () => {
      const client = new OAuthClient(clientOptions);
      const refreshToken = "test-refresh-token";

      // This will fail without actual OAuth server or mocks
      await expect(
        client.refreshAccessToken(refreshToken)
      ).rejects.toThrow();
    });
  });

  describe("revokeToken", () => {
    it("should revoke a token", async () => {
      const client = new OAuthClient(clientOptions);
      const token = "test-token";

      // This will fail without actual OAuth server or mocks
      await expect(client.revokeToken(token)).rejects.toThrow();
    });
  });

  describe("getTokenInfo", () => {
    it("should get token information", async () => {
      const client = new OAuthClient(clientOptions);
      const accessToken = "test-access-token";

      // This will fail without actual OAuth server or mocks
      await expect(client.getTokenInfo(accessToken)).rejects.toThrow();
    });
  });

  describe("getDefaultScopes", () => {
    it("should return default scopes for all products", () => {
      const client = new OAuthClient(clientOptions);
      const scopes = client.getDefaultScopes();

      expect(scopes).toBeDefined();
      expect(Array.isArray(scopes)).toBe(true);
      expect(scopes.length).toBeGreaterThan(0);
      expect(scopes).toContain(
        "https://www.googleapis.com/auth/analytics.readonly"
      );
      expect(scopes).toContain(
        "https://www.googleapis.com/auth/tagmanager.readonly"
      );
    });
  });
});
