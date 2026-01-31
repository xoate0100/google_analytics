/**
 * Auth Login Tool Tests
 * Tests for auth.login tool implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MCPServerBootstrap } from "../../../src/server/bootstrap.js";
import { registerCoreUtilityTools } from "../../../src/server/tools.js";
import type { OAuthClient } from "../../../src/core/oauth.js";
import type { TokenStorage } from "../../../src/core/token-storage.js";
import type { ILogger, ICapabilitiesRegistry } from "../../../src/core/types.js";

describe("Auth Login Tool", () => {
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
      getDefaultScopes: vi.fn(() => [
        "https://www.googleapis.com/auth/analytics.readonly",
      ]),
    } as unknown as OAuthClient;

    mockTokenStorage = {
      storeTokens: vi.fn().mockResolvedValue(undefined),
      getTokens: vi.fn(),
      deleteTokens: vi.fn(),
      listProducts: vi.fn().mockResolvedValue([]),
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

  it("should register auth.login tool", () => {
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

    const tool = bootstrap.getRegisteredTools().get("auth.login");
    expect(tool).toBeDefined();
    expect(tool?.name).toBe("auth.login");
    expect(tool?.description).toContain("OAuth device flow");
  });

  it("should initiate device flow and return user code", async () => {
    const deviceFlowResult = {
      deviceCode: "test-device-code",
      userCode: "ABCD-EFGH",
      verificationUrl: "https://www.google.com/device",
      expiresIn: 1800,
      interval: 5,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    };

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

    const tool = bootstrap.getRegisteredTools().get("auth.login");
    const result = await tool?.handler({});

    expect(mockOAuthClient.startDeviceFlow).toHaveBeenCalled();
    expect(result).toMatchObject({
      userCode: "ABCD-EFGH",
      verificationUrl: "https://www.google.com/device",
      message: expect.stringContaining("Please visit"),
      deviceCode: "test-device-code",
      expiresIn: 1800,
      nextStep: expect.stringContaining("deviceCode"),
    });
  });

  it("should handle OAuth errors during device flow", async () => {
    const { AuthError } = await import("../../../src/core/errors.js");
    vi.mocked(mockOAuthClient.startDeviceFlow).mockRejectedValue(
      new AuthError("invalid_grant", "Invalid client credentials")
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

    const tool = bootstrap.getRegisteredTools().get("auth.login");
    await expect(tool?.handler({})).rejects.toThrow(AuthError);
  });

  it("should poll for tokens and store them after authorization", async () => {
    const tokenInfo = {
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
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

    const tool = bootstrap.getRegisteredTools().get("auth.login");
    const result = await tool?.handler({ deviceCode: "test-device-code" });

    expect(mockOAuthClient.pollForTokens).toHaveBeenCalledWith(
      "test-device-code",
      5
    );
    expect(mockTokenStorage.storeTokens).toHaveBeenCalledWith(
      "google",
      expect.objectContaining({
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
      })
    );
    expect(result).toMatchObject({
      message: expect.stringContaining("successful"),
      authenticated: true,
    });
  });
});
