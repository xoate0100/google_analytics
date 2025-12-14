/**
 * Auth Rotate Tool Tests
 * Tests for auth.rotate tool implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MCPServerBootstrap } from "../../../src/server/bootstrap.js";
import { registerCoreUtilityTools } from "../../../src/server/tools.js";
import type { OAuthClient } from "../../../src/core/oauth.js";
import type { TokenStorage } from "../../../src/core/token-storage.js";
import type { ILogger, ICapabilitiesRegistry } from "../../../src/core/types.js";

describe("Auth Rotate Tool", () => {
  let bootstrap: MCPServerBootstrap;
  let mockOAuthClient: OAuthClient;
  let mockTokenStorage: TokenStorage;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => mockLogger),
    };

    mockOAuthClient = {
      startDeviceFlow: vi.fn(),
      pollForTokens: vi.fn(),
      revokeToken: vi.fn(),
      getDefaultScopes: vi.fn(() => [
        "https://www.googleapis.com/auth/analytics.readonly",
      ]),
    } as unknown as OAuthClient;

    mockTokenStorage = {
      storeTokens: vi.fn().mockResolvedValue(undefined),
      getTokens: vi.fn(),
      deleteTokens: vi.fn().mockResolvedValue(undefined),
      listProducts: vi.fn().mockResolvedValue(["google"]),
    } as unknown as TokenStorage;

    bootstrap = new MCPServerBootstrap({
      name: "test-server",
      version: "0.1.0",
      logger: mockLogger,
    });
    bootstrap.initialize();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should register auth.rotate tool", () => {
    registerCoreUtilityTools({
      bootstrap,
      capabilitiesRegistry: {
        hasCapability: vi.fn(),
        getProductCapabilities: vi.fn(),
        setProductCapabilities: vi.fn(),
        refresh: vi.fn(),
      } as unknown as ICapabilitiesRegistry,
      oauthClient: mockOAuthClient,
      tokenStorage: mockTokenStorage,
      logger: mockLogger,
    });

    const tool = bootstrap.getRegisteredTools().get("auth.rotate");
    expect(tool).toBeDefined();
    expect(tool?.name).toBe("auth.rotate");
    expect(tool?.description).toContain("Rotate");
  });

  it("should revoke old tokens and initiate new device flow", async () => {
    const oldTokens = {
      accessToken: "old-access-token",
      refreshToken: "old-refresh-token",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    };

    const deviceFlowResult = {
      deviceCode: "new-device-code",
      userCode: "WXYZ-1234",
      verificationUrl: "https://www.google.com/device",
      expiresIn: 1800,
      interval: 5,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    };

    vi.mocked(mockTokenStorage.getTokens).mockResolvedValue(oldTokens);
    vi.mocked(mockOAuthClient.revokeToken).mockResolvedValue(undefined);
    vi.mocked(mockOAuthClient.startDeviceFlow).mockResolvedValue(
      deviceFlowResult
    );

    registerCoreUtilityTools({
      bootstrap,
      capabilitiesRegistry: {
        hasCapability: vi.fn(),
        getProductCapabilities: vi.fn(),
        setProductCapabilities: vi.fn(),
        refresh: vi.fn(),
      } as unknown as ICapabilitiesRegistry,
      oauthClient: mockOAuthClient,
      tokenStorage: mockTokenStorage,
      logger: mockLogger,
    });

    const tool = bootstrap.getRegisteredTools().get("auth.rotate");
    const result = await tool?.handler({});

    expect(mockTokenStorage.getTokens).toHaveBeenCalledWith("google");
    expect(mockOAuthClient.revokeToken).toHaveBeenCalledWith(
      "old-refresh-token"
    );
    expect(mockOAuthClient.startDeviceFlow).toHaveBeenCalled();
    expect(result).toMatchObject({
      userCode: "WXYZ-1234",
      verificationUrl: "https://www.google.com/device",
      message: expect.stringContaining("Please visit"),
      deviceCode: "new-device-code",
      expiresIn: 1800,
      nextStep: expect.stringContaining("deviceCode"),
    });
  });

  it("should handle case when no existing tokens are found", async () => {
    const deviceFlowResult = {
      deviceCode: "new-device-code",
      userCode: "ABCD-EFGH",
      verificationUrl: "https://www.google.com/device",
      expiresIn: 1800,
      interval: 5,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    };

    vi.mocked(mockTokenStorage.getTokens).mockResolvedValue(undefined);
    vi.mocked(mockOAuthClient.startDeviceFlow).mockResolvedValue(
      deviceFlowResult
    );

    registerCoreUtilityTools({
      bootstrap,
      capabilitiesRegistry: {
        hasCapability: vi.fn(),
        getProductCapabilities: vi.fn(),
        setProductCapabilities: vi.fn(),
        refresh: vi.fn(),
      } as unknown as ICapabilitiesRegistry,
      oauthClient: mockOAuthClient,
      tokenStorage: mockTokenStorage,
      logger: mockLogger,
    });

    const tool = bootstrap.getRegisteredTools().get("auth.rotate");
    const result = await tool?.handler({});

    expect(mockTokenStorage.getTokens).toHaveBeenCalledWith("google");
    expect(mockOAuthClient.revokeToken).not.toHaveBeenCalled();
    expect(mockOAuthClient.startDeviceFlow).toHaveBeenCalled();
    expect(result).toHaveProperty("userCode");
  });

  it("should handle errors during token revocation", async () => {
    const { AuthError } = await import("../../../src/core/errors.js");
    const oldTokens = {
      accessToken: "old-access-token",
      refreshToken: "old-refresh-token",
    };

    vi.mocked(mockTokenStorage.getTokens).mockResolvedValue(oldTokens);
    vi.mocked(mockOAuthClient.revokeToken).mockRejectedValue(
      new AuthError("invalid_grant", "Token revocation failed")
    );

    registerCoreUtilityTools({
      bootstrap,
      capabilitiesRegistry: {
        hasCapability: vi.fn(),
        getProductCapabilities: vi.fn(),
        setProductCapabilities: vi.fn(),
        refresh: vi.fn(),
      } as unknown as ICapabilitiesRegistry,
      oauthClient: mockOAuthClient,
      tokenStorage: mockTokenStorage,
      logger: mockLogger,
    });

    const tool = bootstrap.getRegisteredTools().get("auth.rotate");
    await expect(tool?.handler({})).rejects.toThrow(AuthError);
  });

  it("should complete rotation when deviceCode is provided", async () => {
    const tokenInfo = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    };

    vi.mocked(mockOAuthClient.pollForTokens).mockResolvedValue(tokenInfo);

    registerCoreUtilityTools({
      bootstrap,
      capabilitiesRegistry: {
        hasCapability: vi.fn(),
        getProductCapabilities: vi.fn(),
        setProductCapabilities: vi.fn(),
        refresh: vi.fn(),
      } as unknown as ICapabilitiesRegistry,
      oauthClient: mockOAuthClient,
      tokenStorage: mockTokenStorage,
      logger: mockLogger,
    });

    const tool = bootstrap.getRegisteredTools().get("auth.rotate");
    const result = await tool?.handler({ deviceCode: "test-device-code" });

    expect(mockOAuthClient.pollForTokens).toHaveBeenCalledWith(
      "test-device-code",
      5
    );
    expect(mockTokenStorage.storeTokens).toHaveBeenCalledWith(
      "google",
      expect.objectContaining({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      })
    );
    expect(result).toMatchObject({
      message: expect.stringContaining("successful"),
      authenticated: true,
    });
  });
});
