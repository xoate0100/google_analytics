import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGA4Tools } from "../../../src/ga4/tools.js";
import type { MCPServerBootstrap } from "../../../src/server/bootstrap.js";
import type { GA4Client } from "../../../src/ga4/client.js";
import type { ILogger, ICache } from "../../../src/core/types.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";

describe("GA4 Property Admin Tools", () => {
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
    it("should register ga4.property.list tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.property.list")).toBe(true);
    });

    it("should register ga4.property.get tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.property.get")).toBe(true);
    });

    it("should register ga4.property.upsert tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.property.upsert")).toBe(true);
    });

    it("should register ga4.property.delete tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.property.delete")).toBe(true);
    });
  });

  describe("ga4.property.list handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.property.list") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        parent: "invalid-format",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should call Analytics Admin API to list properties", async () => {
      const mockAdminClient = {
        properties: {
          list: vi.fn().mockResolvedValue({
            data: {
              properties: [
                {
                  name: "properties/123456789",
                  displayName: "Test Property",
                  propertyType: "PROPERTY_TYPE_ORDINARY",
                  createTime: "2024-01-01T00:00:00Z",
                  updateTime: "2024-01-01T00:00:00Z",
                },
              ],
            },
          }),
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

      const tool = registeredTools.get("ga4.property.list") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const result = await tool.handler({
        parent: "accounts/123456789",
      });

      expect(mockGA4Client.checkRateLimit).toHaveBeenCalledWith("ga4", "property.list");
      expect(mockAdminClient.properties.list).toHaveBeenCalledWith({
        parent: "accounts/123456789",
      });
      expect(result).toHaveProperty("properties");
    });
  });

  describe("ga4.property.get handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.property.get") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        name: "invalid-format",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should call Analytics Admin API to get property", async () => {
      const mockAdminClient = {
        properties: {
          get: vi.fn().mockResolvedValue({
            data: {
              name: "properties/123456789",
              displayName: "Test Property",
              propertyType: "PROPERTY_TYPE_ORDINARY",
              createTime: "2024-01-01T00:00:00Z",
              updateTime: "2024-01-01T00:00:00Z",
            },
          }),
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

      const tool = registeredTools.get("ga4.property.get") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const result = await tool.handler({
        name: "properties/123456789",
      });

      expect(mockGA4Client.checkRateLimit).toHaveBeenCalledWith("ga4", "property.get");
      expect(mockAdminClient.properties.get).toHaveBeenCalledWith({
        name: "properties/123456789",
      });
      expect(result).toHaveProperty("name", "properties/123456789");
    });
  });

  describe("ga4.property.upsert handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.property.upsert") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        parent: "invalid-format",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should call Analytics Admin API to create property", async () => {
      const mockAdminClient = {
        properties: {
          create: vi.fn().mockResolvedValue({
            data: {
              name: "properties/123456789",
              displayName: "New Property",
              propertyType: "PROPERTY_TYPE_ORDINARY",
              createTime: "2024-01-01T00:00:00Z",
            },
          }),
          get: vi.fn().mockResolvedValue({
            data: {
              name: "properties/123456789",
              displayName: "New Property",
              propertyType: "PROPERTY_TYPE_ORDINARY",
            },
          }),
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

      const tool = registeredTools.get("ga4.property.upsert") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const result = await tool.handler({
        parent: "accounts/123456789",
        displayName: "New Property",
        timeZone: "America/New_York",
        currencyCode: "USD",
      });

      expect(mockGA4Client.checkRateLimit).toHaveBeenCalled();
      expect(result).toHaveProperty("name");
    });
  });

  describe("ga4.property.delete handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.property.delete") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        name: "invalid-format",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should call Analytics Admin API to delete property", async () => {
      const mockAdminClient = {
        properties: {
          get: vi.fn()
            .mockResolvedValueOnce({
              data: {
                name: "properties/123456789",
                displayName: "Test Property",
              },
            })
            .mockRejectedValueOnce(new Error("not found")),
          delete: vi.fn().mockResolvedValue({}),
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

      const tool = registeredTools.get("ga4.property.delete") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const result = await tool.handler({
        name: "properties/123456789",
      });

      expect(mockGA4Client.checkRateLimit).toHaveBeenCalled();
      expect(mockAdminClient.properties.get).toHaveBeenCalledWith({
        name: "properties/123456789",
      });
      expect(mockAdminClient.properties.delete).toHaveBeenCalledWith({
        name: "properties/123456789",
      });
      expect(result).toHaveProperty("success", true);
    });
  });
});
