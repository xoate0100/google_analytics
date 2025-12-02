import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerCoreUtilityTools } from "../../../src/server/tools.js";
import { MCPServerBootstrap } from "../../../src/server/bootstrap.js";
import type { ILogger } from "../../../src/core/types.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";
import type { OAuthClient } from "../../../src/core/oauth.js";
import type { TokenStorage } from "../../../src/core/token-storage.js";

describe("Core Utility Tools Registration", () => {
  let mockLogger: ILogger;
  let mockCapabilitiesRegistry: ICapabilitiesRegistry;
  let mockOAuthClient: OAuthClient;
  let mockTokenStorage: TokenStorage;
  let bootstrap: MCPServerBootstrap;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => mockLogger),
    };

    mockCapabilitiesRegistry = {
      hasCapability: vi.fn(),
      getProductCapabilities: vi.fn(),
      setProductCapabilities: vi.fn(),
      refresh: vi.fn(),
    };

    mockOAuthClient = {
      startDeviceFlow: vi.fn(),
      pollForTokens: vi.fn(),
      refreshAccessToken: vi.fn(),
      revokeToken: vi.fn(),
      getTokenInfo: vi.fn(),
      getDefaultScopes: vi.fn(),
      getOAuth2Client: vi.fn(),
    } as unknown as OAuthClient;

    mockTokenStorage = {
      storeTokens: vi.fn(),
      getTokens: vi.fn(),
      deleteTokens: vi.fn(),
      listProducts: vi.fn(),
    } as unknown as TokenStorage;

    bootstrap = new MCPServerBootstrap({
      name: "mcp-google-marketing",
      version: "0.1.0",
      logger: mockLogger,
    });
    bootstrap.initialize();
  });

  describe("registerCoreUtilityTools", () => {
    it("should register all core utility tools", () => {
      registerCoreUtilityTools({
        bootstrap,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        oauthClient: mockOAuthClient,
        tokenStorage: mockTokenStorage,
        logger: mockLogger,
      });

      const registeredTools = bootstrap.getRegisteredTools();
      expect(registeredTools.has("auth.login")).toBe(true);
      expect(registeredTools.has("auth.rotate")).toBe(true);
      expect(registeredTools.has("auth.status")).toBe(true);
      expect(registeredTools.has("capabilities.refresh")).toBe(true);
      expect(registeredTools.has("capabilities.get")).toBe(true);
      expect(registeredTools.has("core.healthcheck")).toBe(true);
      expect(registeredTools.has("core.version")).toBe(true);
      expect(registeredTools.has("core.dryRun")).toBe(true);
    });

    it("should register auth.login tool", () => {
      registerCoreUtilityTools({
        bootstrap,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        oauthClient: mockOAuthClient,
        tokenStorage: mockTokenStorage,
        logger: mockLogger,
      });

      const tool = bootstrap.getRegisteredTools().get("auth.login");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("auth.login");
      expect(tool?.description).toBeDefined();
    });

    it("should register auth.rotate tool", () => {
      registerCoreUtilityTools({
        bootstrap,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        oauthClient: mockOAuthClient,
        tokenStorage: mockTokenStorage,
        logger: mockLogger,
      });

      const tool = bootstrap.getRegisteredTools().get("auth.rotate");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("auth.rotate");
    });

    it("should register auth.status tool", () => {
      registerCoreUtilityTools({
        bootstrap,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        oauthClient: mockOAuthClient,
        tokenStorage: mockTokenStorage,
        logger: mockLogger,
      });

      const tool = bootstrap.getRegisteredTools().get("auth.status");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("auth.status");
    });

    it("should register capabilities.refresh tool", () => {
      registerCoreUtilityTools({
        bootstrap,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        oauthClient: mockOAuthClient,
        tokenStorage: mockTokenStorage,
        logger: mockLogger,
      });

      const tool = bootstrap.getRegisteredTools().get("capabilities.refresh");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("capabilities.refresh");
    });

    it("should register capabilities.get tool", () => {
      registerCoreUtilityTools({
        bootstrap,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        oauthClient: mockOAuthClient,
        tokenStorage: mockTokenStorage,
        logger: mockLogger,
      });

      const tool = bootstrap.getRegisteredTools().get("capabilities.get");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("capabilities.get");
    });

    it("should register core.healthcheck tool", () => {
      registerCoreUtilityTools({
        bootstrap,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        oauthClient: mockOAuthClient,
        tokenStorage: mockTokenStorage,
        logger: mockLogger,
      });

      const tool = bootstrap.getRegisteredTools().get("core.healthcheck");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("core.healthcheck");
    });

    it("should register core.version tool", () => {
      registerCoreUtilityTools({
        bootstrap,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        oauthClient: mockOAuthClient,
        tokenStorage: mockTokenStorage,
        logger: mockLogger,
      });

      const tool = bootstrap.getRegisteredTools().get("core.version");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("core.version");
    });

    it("should register core.dryRun tool", () => {
      registerCoreUtilityTools({
        bootstrap,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        oauthClient: mockOAuthClient,
        tokenStorage: mockTokenStorage,
        logger: mockLogger,
      });

      const tool = bootstrap.getRegisteredTools().get("core.dryRun");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("core.dryRun");
    });
  });
});

