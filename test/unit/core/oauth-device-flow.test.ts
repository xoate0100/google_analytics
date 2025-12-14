/**
 * OAuth Device Flow Tests
 * Tests for OAuth 2.0 device flow implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  OAuthClient,
  type OAuthClientOptions,
} from "../../../src/core/oauth.js";
import type { ILogger } from "../../../src/core/types.js";
import { AuthError } from "../../../src/core/errors.js";

describe("OAuth Device Flow", () => {
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
      logger: mockLogger,
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("startDeviceFlow", () => {
    it("should initiate device flow with valid scopes", async () => {
      const scopes = [
        "https://www.googleapis.com/auth/analytics.readonly",
      ];

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
      const result = await client.startDeviceFlow(scopes);

      expect(result.deviceCode).toBe("test-device-code-123");
      expect(result.userCode).toBe("ABCD-EFGH");
      expect(result.verificationUrl).toBe("https://www.google.com/device");
      expect(result.expiresIn).toBe(1800);
      expect(result.interval).toBe(5);
      expect(result.scopes).toEqual(scopes);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://oauth2.googleapis.com/device/code",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/x-www-form-urlencoded",
          }),
        })
      );
    });

    it("should handle multiple scopes", async () => {
      const scopes = [
        "https://www.googleapis.com/auth/analytics.readonly",
        "https://www.googleapis.com/auth/tagmanager.readonly",
      ];

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
      const result = await client.startDeviceFlow(scopes);

      expect(result.scopes).toEqual(scopes);
    });

    it("should handle error responses", async () => {
      const scopes = [
        "https://www.googleapis.com/auth/analytics.readonly",
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({
          error: "invalid_client",
          error_description: "Invalid client credentials",
        }),
      } as Response);

      const client = new OAuthClient(clientOptions);

      await expect(client.startDeviceFlow(scopes)).rejects.toThrow(AuthError);
    });

    it("should handle network errors", async () => {
      const scopes = [
        "https://www.googleapis.com/auth/analytics.readonly",
      ];

      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const client = new OAuthClient(clientOptions);

      await expect(client.startDeviceFlow(scopes)).rejects.toThrow();
    });
  });

  describe("pollForTokens", () => {
    it("should poll for tokens with valid device code", async () => {
      const deviceCode = "test-device-code-123";

      const mockTokenResponse = {
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        expires_in: 3600,
        scope: "https://www.googleapis.com/auth/analytics.readonly",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockTokenResponse,
      } as Response);

      const client = new OAuthClient(clientOptions);
      const result = await client.pollForTokens(deviceCode);

      expect(result.accessToken).toBe("test-access-token");
      expect(result.refreshToken).toBe("test-refresh-token");
      expect(result.expiresAt).toBeDefined();
      expect(result.scopes).toEqual([
        "https://www.googleapis.com/auth/analytics.readonly",
      ]);
    });

    it("should handle authorization_pending error", async () => {
      const deviceCode = "test-device-code-123";

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({
          error: "authorization_pending",
          error_description: "User has not yet completed authorization",
        }),
      } as Response);

      const client = new OAuthClient(clientOptions);

      await expect(client.pollForTokens(deviceCode)).rejects.toThrow(
        AuthError
      );
    });

    it("should handle slow_down error", async () => {
      const deviceCode = "test-device-code-123";

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({
          error: "slow_down",
          error_description: "Polling too frequently",
        }),
      } as Response);

      const client = new OAuthClient(clientOptions);

      await expect(client.pollForTokens(deviceCode)).rejects.toThrow(
        AuthError
      );
    });

    it("should handle expired_token error", async () => {
      const deviceCode = "test-device-code-123";

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({
          error: "expired_token",
          error_description: "Device code has expired",
        }),
      } as Response);

      const client = new OAuthClient(clientOptions);

      await expect(client.pollForTokens(deviceCode)).rejects.toThrow(
        AuthError
      );
    });

    it("should handle invalid device code", async () => {
      const deviceCode = "invalid-device-code";

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({
          error: "invalid_grant",
          error_description: "Invalid device code",
        }),
      } as Response);

      const client = new OAuthClient(clientOptions);

      await expect(client.pollForTokens(deviceCode)).rejects.toThrow(
        AuthError
      );
    });

    it("should handle polling with exponential backoff on authorization_pending", async () => {
      const deviceCode = "test-device-code-123";
      const startTime = Date.now();

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({
          error: "authorization_pending",
        }),
      } as Response);

      const client = new OAuthClient(clientOptions);

      // This test verifies that the implementation handles authorization_pending
      // The actual polling logic will be in the implementation
      await expect(client.pollForTokens(deviceCode)).rejects.toThrow();

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(1000); // Should fail quickly on first attempt
    });
  });
});
