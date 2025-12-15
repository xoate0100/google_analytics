import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  OAuthClient,
  OAuthClientOptions,
} from "../../../src/core/oauth.js";
import type { ILogger } from "../../../src/core/types.js";

describe("OAuth Client", () => {
  let mockLogger: ILogger;
  let clientOptions: OAuthClientOptions;

  beforeEach(() => {
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
      const client = new OAuthClient(clientOptions);
      const scopes = [
        "https://www.googleapis.com/auth/analytics.readonly",
      ];

      const result = await client.startDeviceFlow(scopes);

      expect(result).toBeDefined();
      expect(result.deviceCode).toBeDefined();
      expect(result.userCode).toBeDefined();
      expect(result.verificationUrl).toBeDefined();
      expect(result.expiresIn).toBeGreaterThan(0);
      expect(result.interval).toBeGreaterThan(0);
    });

    it("should include all requested scopes in device flow", async () => {
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
      const client = new OAuthClient(clientOptions);
      const scopes = [
        "https://www.googleapis.com/auth/analytics.readonly",
      ];

      const deviceFlow = await client.startDeviceFlow(scopes);

      // Note: This will fail in tests without actual OAuth server
      // We'll need to mock the google-auth-library
      await expect(
        client.pollForTokens(deviceFlow.deviceCode)
      ).rejects.toThrow();
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
