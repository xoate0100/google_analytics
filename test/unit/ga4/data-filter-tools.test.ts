import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGA4Tools } from "../../../src/ga4/tools.js";
import type { MCPServerBootstrap } from "../../../src/server/bootstrap.js";
import type { GA4Client } from "../../../src/ga4/client.js";
import type { ILogger, ICache } from "../../../src/core/types.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";

describe("GA4 Data Filter Tools", () => {
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
    it("should register ga4.dataFilter.list tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.dataFilter.list")).toBe(true);
    });

    it("should register ga4.dataFilter.get tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.dataFilter.get")).toBe(true);
    });

    it("should register ga4.dataFilter.create tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.dataFilter.create")).toBe(true);
    });

    it("should register ga4.dataFilter.update tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.dataFilter.update")).toBe(true);
    });

    it("should register ga4.dataFilter.delete tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.dataFilter.delete")).toBe(true);
    });
  });

  describe("ga4.dataFilter.list handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.dataFilter.list") as {
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
          dataFilters: {
            list: vi.fn().mockResolvedValue({
              data: {
                dataFilters: [],
              },
            }),
          },
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

      const tool = registeredTools.get("ga4.dataFilter.list") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const validArgs = {
        property: "properties/123456789",
      };

      await tool.handler(validArgs);

      const checkRateLimitFn = mockGA4Client.checkRateLimit;
      const checkRateLimitMock = checkRateLimitFn as ReturnType<typeof vi.fn>;
      const checkRateLimitCalls = checkRateLimitMock.mock.calls;
      expect(checkRateLimitCalls.some((call) => call[0] === "ga4" && call[1] === "listDataFilters")).toBe(true);
    });
  });

  describe("ga4.dataFilter.get handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.dataFilter.get") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        property: "properties/123456789",
        filterId: "invalid",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should check rate limit before making request", async () => {
      const mockAdminClient = {
        properties: {
          dataFilters: {
            get: vi.fn().mockResolvedValue({
              data: {
                name: "properties/123456789/dataFilters/987654321",
                type: "INTERNAL_TRAFFIC",
                state: "ACTIVE",
              },
            }),
          },
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

      const tool = registeredTools.get("ga4.dataFilter.get") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const validArgs = {
        property: "properties/123456789",
        filterId: "dataFilters/987654321",
      };

      await tool.handler(validArgs);

      const checkRateLimitFn = mockGA4Client.checkRateLimit;
      const checkRateLimitMock = checkRateLimitFn as ReturnType<typeof vi.fn>;
      const checkRateLimitCalls = checkRateLimitMock.mock.calls;
      expect(checkRateLimitCalls.some((call) => call[0] === "ga4" && call[1] === "getDataFilter")).toBe(true);
    });
  });

  describe("ga4.dataFilter.create handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.dataFilter.create") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        property: "properties/123456789",
        name: "Test Filter",
        type: "INVALID_TYPE",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should check rate limit before making request", async () => {
      const mockAdminClient = {
        properties: {
          dataFilters: {
            create: vi.fn().mockResolvedValue({
              data: {
                name: "properties/123456789/dataFilters/987654321",
                type: "INTERNAL_TRAFFIC",
                state: "ACTIVE",
              },
            }),
          },
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

      const tool = registeredTools.get("ga4.dataFilter.create") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const validArgs = {
        property: "properties/123456789",
        name: "Internal Traffic Filter",
        type: "INTERNAL_TRAFFIC",
        applyTo: "ALL_EVENTS",
      };

      await tool.handler(validArgs);

      const checkRateLimitFn = mockGA4Client.checkRateLimit;
      const checkRateLimitMock = checkRateLimitFn as ReturnType<typeof vi.fn>;
      const checkRateLimitCalls = checkRateLimitMock.mock.calls;
      expect(checkRateLimitCalls.some((call) => call[0] === "ga4" && call[1] === "createDataFilter")).toBe(true);
    });
  });

  describe("ga4.dataFilter.update handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.dataFilter.update") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        property: "properties/123456789",
        filterId: "invalid",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should check rate limit before making request", async () => {
      const mockAdminClient = {
        properties: {
          dataFilters: {
            patch: vi.fn().mockResolvedValue({
              data: {
                name: "properties/123456789/dataFilters/987654321",
                type: "INTERNAL_TRAFFIC",
                state: "ACTIVE",
              },
            }),
          },
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

      const tool = registeredTools.get("ga4.dataFilter.update") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const validArgs = {
        property: "properties/123456789",
        filterId: "dataFilters/987654321",
        state: "INACTIVE",
      };

      await tool.handler(validArgs);

      const checkRateLimitFn = mockGA4Client.checkRateLimit;
      const checkRateLimitMock = checkRateLimitFn as ReturnType<typeof vi.fn>;
      const checkRateLimitCalls = checkRateLimitMock.mock.calls;
      expect(checkRateLimitCalls.some((call) => call[0] === "ga4" && call[1] === "updateDataFilter")).toBe(true);
    });
  });

  describe("ga4.dataFilter.delete handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.dataFilter.delete") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        property: "properties/123456789",
        filterId: "invalid",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should check rate limit before making request", async () => {
      const mockAdminClient = {
        properties: {
          dataFilters: {
            delete: vi.fn().mockResolvedValue({}),
          },
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

      const tool = registeredTools.get("ga4.dataFilter.delete") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const validArgs = {
        property: "properties/123456789",
        filterId: "dataFilters/987654321",
      };

      await tool.handler(validArgs);

      const checkRateLimitFn = mockGA4Client.checkRateLimit;
      const checkRateLimitMock = checkRateLimitFn as ReturnType<typeof vi.fn>;
      const checkRateLimitCalls = checkRateLimitMock.mock.calls;
      expect(checkRateLimitCalls.some((call) => call[0] === "ga4" && call[1] === "deleteDataFilter")).toBe(true);
    });
  });
});
