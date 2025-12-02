import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGA4Tools } from "../../../src/ga4/tools.js";
import type { MCPServerBootstrap } from "../../../src/server/bootstrap.js";
import type { GA4Client } from "../../../src/ga4/client.js";
import type { ILogger, ICache } from "../../../src/core/types.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";

describe("GA4 Data Stream Tools", () => {
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
    it("should register ga4.datastream.list tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.datastream.list")).toBe(true);
    });

    it("should register ga4.datastream.get tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.datastream.get")).toBe(true);
    });

    it("should register ga4.datastream.upsert tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.datastream.upsert")).toBe(true);
    });

    it("should register ga4.datastream.delete tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.datastream.delete")).toBe(true);
    });
  });

  describe("ga4.datastream.list handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.datastream.list") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        parent: "invalid-format",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should call Analytics Admin API to list data streams", async () => {
      const mockAdminClient = {
        properties: {
          dataStreams: {
            list: vi.fn().mockResolvedValue({
              data: {
                dataStreams: [
                  {
                    name: "properties/123456789/dataStreams/987654321",
                    displayName: "Web Stream",
                    type: "WEB_DATA_STREAM",
                    webStreamData: {
                      defaultUri: "https://example.com",
                    },
                  },
                ],
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

      const tool = registeredTools.get("ga4.datastream.list") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const result = await tool.handler({
        parent: "properties/123456789",
      });

      expect(mockGA4Client.checkRateLimit).toHaveBeenCalled();
      expect(result).toHaveProperty("dataStreams");
    });
  });

  describe("ga4.datastream.get handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.datastream.get") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        name: "invalid-format",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should call Analytics Admin API to get data stream", async () => {
      const mockAdminClient = {
        properties: {
          dataStreams: {
            get: vi.fn().mockResolvedValue({
              data: {
                name: "properties/123456789/dataStreams/987654321",
                displayName: "Web Stream",
                type: "WEB_DATA_STREAM",
                webStreamData: {
                  defaultUri: "https://example.com",
                },
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

      const tool = registeredTools.get("ga4.datastream.get") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const result = await tool.handler({
        name: "properties/123456789/dataStreams/987654321",
      });

      expect(mockGA4Client.checkRateLimit).toHaveBeenCalled();
      expect(result).toHaveProperty("name");
    });
  });

  describe("ga4.datastream.upsert handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.datastream.upsert") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        parent: "invalid-format",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should call Analytics Admin API to create data stream", async () => {
      const mockAdminClient = {
        properties: {
          dataStreams: {
            create: vi.fn().mockResolvedValue({
              data: {
                name: "properties/123456789/dataStreams/987654321",
                displayName: "New Web Stream",
                type: "WEB_DATA_STREAM",
                webStreamData: {
                  defaultUri: "https://example.com",
                },
              },
            }),
            get: vi.fn().mockResolvedValue({
              data: {
                name: "properties/123456789/dataStreams/987654321",
                displayName: "New Web Stream",
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

      const tool = registeredTools.get("ga4.datastream.upsert") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const result = await tool.handler({
        parent: "properties/123456789",
        displayName: "New Web Stream",
        type: "WEB_DATA_STREAM",
        webStreamData: {
          defaultUri: "https://example.com",
        },
      });

      expect(mockGA4Client.checkRateLimit).toHaveBeenCalled();
      expect(result).toHaveProperty("name");
    });
  });

  describe("ga4.datastream.delete handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.datastream.delete") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        name: "invalid-format",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should call Analytics Admin API to delete data stream", async () => {
      const mockAdminClient = {
        properties: {
          dataStreams: {
            get: vi.fn()
              .mockResolvedValueOnce({
                data: {
                  name: "properties/123456789/dataStreams/987654321",
                  displayName: "Test Stream",
                },
              })
              .mockRejectedValueOnce(new Error("not found")),
            delete: vi.fn().mockResolvedValue({}),
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

      const tool = registeredTools.get("ga4.datastream.delete") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const result = await tool.handler({
        name: "properties/123456789/dataStreams/987654321",
      });

      expect(mockGA4Client.checkRateLimit).toHaveBeenCalled();
      expect(mockAdminClient.properties.dataStreams.delete).toHaveBeenCalledWith({
        name: "properties/123456789/dataStreams/987654321",
      });
      expect(result).toHaveProperty("success", true);
    });
  });
});

