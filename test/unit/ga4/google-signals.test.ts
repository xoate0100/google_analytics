import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGA4Tools } from "../../../src/ga4/tools.js";
import type { MCPServerBootstrap } from "../../../src/server/bootstrap.js";
import type { GA4Client } from "../../../src/ga4/client.js";
import type { ILogger, ICache } from "../../../src/core/types.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";

describe("GA4 Google Signals Tools", () => {
  let mockBootstrap: MCPServerBootstrap;
  let mockGA4Client: GA4Client;
  let mockLogger: ILogger;
  let mockCache: ICache;
  let mockCapabilitiesRegistry: ICapabilitiesRegistry;
  let registeredTools: Map<string, unknown>;

  beforeEach(() => {
    registeredTools = new Map();

    mockBootstrap = {
      registerTool: vi.fn((tool) => {
        registeredTools.set(tool.name, tool);
      }),
    } as unknown as MCPServerBootstrap;

    mockGA4Client = {
      getAnalyticsDataClient: vi.fn(),
      getAnalyticsAdminClient: vi.fn(),
      checkRateLimit: vi.fn().mockResolvedValue(undefined),
    } as unknown as GA4Client;

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    };

    mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      invalidate: vi.fn().mockResolvedValue(undefined),
    } as unknown as ICache;

    mockCapabilitiesRegistry = {
      hasCapability: vi.fn().mockReturnValue(true),
      getCapabilities: vi.fn().mockReturnValue({}),
      setCapability: vi.fn(),
      refresh: vi.fn().mockResolvedValue(undefined),
    } as unknown as ICapabilitiesRegistry;
  });

  describe("registerGA4Tools", () => {
    it("should register ga4.property.googleSignals.get tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.property.googleSignals.get")).toBe(true);
    });

    it("should register ga4.property.googleSignals.update tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.property.googleSignals.update")).toBe(true);
    });
  });

  describe("ga4.property.googleSignals.get handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.property.googleSignals.get") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        property: "invalid",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should check rate limit before making request", async () => {
      const mockAdminClient = {
        properties: {
          getGoogleSignalsSettings: vi.fn().mockResolvedValue({
            data: {
              name: "properties/123456789/googleSignalsSettings",
              state: "GOOGLE_SIGNALS_ENABLED",
            },
          }),
        },
      };

      vi.mocked(mockGA4Client.getAnalyticsAdminClient).mockReturnValue(mockAdminClient as never);

      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.property.googleSignals.get") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const validArgs = {
        property: "properties/123456789",
      };

      await tool.handler(validArgs);

      const checkRateLimitFn = mockGA4Client.checkRateLimit;
      const checkRateLimitMock = checkRateLimitFn as ReturnType<typeof vi.fn>;
      const checkRateLimitCalls = checkRateLimitMock.mock.calls;
      expect(checkRateLimitCalls.some((call) => call[0] === "ga4" && call[1] === "getGoogleSignalsSettings")).toBe(true);
    });
  });

  describe("ga4.property.googleSignals.update handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.property.googleSignals.update") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        property: "invalid",
        state: "INVALID_STATE",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should check rate limit before making request", async () => {
      const mockAdminClient = {
        properties: {
          updateGoogleSignalsSettings: vi.fn().mockResolvedValue({
            data: {
              name: "properties/123456789/googleSignalsSettings",
              state: "GOOGLE_SIGNALS_ENABLED",
            },
          }),
        },
      };

      vi.mocked(mockGA4Client.getAnalyticsAdminClient).mockReturnValue(mockAdminClient as never);

      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.property.googleSignals.update") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const validArgs = {
        property: "properties/123456789",
        state: "GOOGLE_SIGNALS_ENABLED",
      };

      await tool.handler(validArgs);

      const checkRateLimitFn = mockGA4Client.checkRateLimit;
      const checkRateLimitMock = checkRateLimitFn as ReturnType<typeof vi.fn>;
      const checkRateLimitCalls = checkRateLimitMock.mock.calls;
      expect(checkRateLimitCalls.some((call) => call[0] === "ga4" && call[1] === "updateGoogleSignalsSettings")).toBe(true);
    });
  });
});

