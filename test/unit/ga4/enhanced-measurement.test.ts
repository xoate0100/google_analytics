import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGA4Tools } from "../../../src/ga4/tools.js";
import type { MCPServerBootstrap } from "../../../src/server/bootstrap.js";
import type { GA4Client } from "../../../src/ga4/client.js";
import type { ILogger, ICache } from "../../../src/core/types.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";

describe("GA4 Enhanced Measurement Tools", () => {
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
    it("should register ga4.datastream.enhancedMeasurement.get tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.datastream.enhancedMeasurement.get")).toBe(true);
    });

    it("should register ga4.datastream.enhancedMeasurement.update tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.datastream.enhancedMeasurement.update")).toBe(true);
    });
  });

  describe("ga4.datastream.enhancedMeasurement.get handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.datastream.enhancedMeasurement.get") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        name: "invalid-format",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should call Analytics Admin API to get enhanced measurement settings", async () => {
      const mockAdminClient = {
        properties: {
          dataStreams: {
            getEnhancedMeasurementSettings: vi.fn().mockResolvedValue({
              data: {
                name: "properties/123456789/dataStreams/987654321/enhancedMeasurementSettings",
                streamEnabled: true,
                scrollsEnabled: true,
                scrollsThresholdPercent: 90,
                outboundClicksEnabled: true,
                siteSearchEnabled: true,
                videoEngagementEnabled: true,
                fileDownloadsEnabled: true,
              },
            }),
          },
        },
      };

      (mockGA4Client.getAnalyticsAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockAdminClient
      );

      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.datastream.enhancedMeasurement.get") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const result = await tool.handler({
        name: "properties/123456789/dataStreams/987654321",
      });

      expect(mockGA4Client.checkRateLimit).toHaveBeenCalled();
      expect(result).toHaveProperty("streamEnabled");
    });
  });

  describe("ga4.datastream.enhancedMeasurement.update handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.datastream.enhancedMeasurement.update") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        name: "invalid-format",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should call Analytics Admin API to update enhanced measurement settings", async () => {
      const mockAdminClient = {
        properties: {
          dataStreams: {
            updateEnhancedMeasurementSettings: vi.fn().mockResolvedValue({
              data: {
                name: "properties/123456789/dataStreams/987654321/enhancedMeasurementSettings",
                streamEnabled: true,
                scrollsEnabled: true,
                scrollsThresholdPercent: 90,
                outboundClicksEnabled: true,
                siteSearchEnabled: true,
                videoEngagementEnabled: true,
                fileDownloadsEnabled: true,
              },
            }),
          },
        },
      };

      (mockGA4Client.getAnalyticsAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockAdminClient
      );

      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.datastream.enhancedMeasurement.update") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const result = await tool.handler({
        name: "properties/123456789/dataStreams/987654321",
        scrollsEnabled: true,
        scrollsThresholdPercent: 90,
        outboundClicksEnabled: true,
        siteSearchEnabled: true,
        videoEngagementEnabled: true,
        fileDownloadsEnabled: true,
      });

      expect(mockGA4Client.checkRateLimit).toHaveBeenCalled();
      expect(result).toHaveProperty("streamEnabled");
    });
  });
});
