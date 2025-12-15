import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { registerGA4Tools } from "../../../src/ga4/tools.js";
import type { MCPServerBootstrap } from "../../../src/server/bootstrap.js";
import type { GA4Client } from "../../../src/ga4/client.js";
import type { ILogger, ICache } from "../../../src/core/types.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";

describe("GA4 Tools", () => {
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
      checkRateLimit: vi.fn().mockResolvedValue(undefined),
    } as unknown as GA4Client;

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => mockLogger),
    };

    mockCache = {
      get: vi.fn().mockResolvedValue(undefined),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      invalidate: vi.fn().mockResolvedValue(undefined),
    } as unknown as ICache;

    mockCapabilitiesRegistry = {
      hasCapability: vi.fn().mockReturnValue(true),
      getProductCapabilities: vi.fn().mockReturnValue(undefined),
      setProductCapabilities: vi.fn(),
      refresh: vi.fn().mockResolvedValue(undefined),
    } as unknown as ICapabilitiesRegistry;
  });

  describe("registerGA4Tools", () => {
    it("should register ga4.report.run tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.report.run")).toBe(true);
    });

    it("should register ga4.report.batch tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.report.batch")).toBe(true);
    });

    it("should register ga4.report.pivot tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.report.pivot")).toBe(true);
    });

    it("should register ga4.realtime.snapshot tool", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.realtime.snapshot")).toBe(true);
    });

    it("should register tool with correct schema", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.report.run") as {
        name: string;
        description: string;
        inputSchema: z.ZodSchema;
        handler: (args: unknown) => Promise<unknown>;
      };

      expect(tool.name).toBe("ga4.report.run");
      expect(tool.description).toContain("GA4 report");
      expect(tool.inputSchema).toBeDefined();
    });
  });

  describe("ga4.report.run handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.report.run") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        property: "invalid",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should check rate limit before making request", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.report.run") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const validArgs = {
        property: "properties/123456789",
        dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
        metrics: [{ name: "sessions" }],
      };

      // Mock the analytics data client
      const mockDataClient = {
        properties: {
          runReport: vi.fn().mockResolvedValue({
            data: {
              dimensionHeaders: [],
              metricHeaders: [{ name: "sessions", type: "TYPE_INTEGER" }],
              rows: [],
              rowCount: 0,
              metadata: {
                currencyCode: "USD",
                dataLossFromOtherRow: false,
                subjectToThresholding: false,
                timeZone: "America/New_York",
              },
            },
          }),
        },
      };

      vi.mocked(mockGA4Client.getAnalyticsDataClient).mockReturnValue(mockDataClient as never);

      await tool.handler(validArgs);

      const checkRateLimitMock = mockGA4Client.checkRateLimit as ReturnType<typeof vi.fn>;
      const checkRateLimitCalls = checkRateLimitMock.mock.calls;
      expect(checkRateLimitCalls.some((call) => call[0] === "ga4" && call[1] === "runReport")).toBe(true);
    });
  });

  describe("ga4.report.batch handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.report.batch") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        property: "invalid",
        requests: [],
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should check rate limit before making request", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.report.batch") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const validArgs = {
        property: "properties/123456789",
        requests: [
          {
            dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
            metrics: [{ name: "sessions" }],
          },
        ],
      };

      // Mock the analytics data client
      const mockDataClient = {
        properties: {
          batchRunReports: vi.fn().mockResolvedValue({
            data: {
              reports: [
                {
                  dimensionHeaders: [],
                  metricHeaders: [{ name: "sessions", type: "TYPE_INTEGER" }],
                  rows: [],
                  rowCount: 0,
                  metadata: {
                    currencyCode: "USD",
                    dataLossFromOtherRow: false,
                    subjectToThresholding: false,
                    timeZone: "America/New_York",
                  },
                },
              ],
            },
          }),
        },
      };

      vi.mocked(mockGA4Client.getAnalyticsDataClient).mockReturnValue(mockDataClient as never);

      await tool.handler(validArgs);

      const checkRateLimitFn = mockGA4Client.checkRateLimit;
      const checkRateLimitMock = checkRateLimitFn as ReturnType<typeof vi.fn>;
      const checkRateLimitCalls = checkRateLimitMock.mock.calls;
      expect(checkRateLimitCalls.some((call) => call[0] === "ga4" && call[1] === "batchRunReports")).toBe(true);
    });
  });

  describe("ga4.report.pivot handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.report.pivot") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        property: "invalid",
        dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
        metrics: [{ name: "sessions" }],
        pivots: [],
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should check rate limit before making request", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.report.pivot") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const validArgs = {
        property: "properties/123456789",
        dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
        metrics: [{ name: "sessions" }],
        pivots: [
          {
            fieldNames: ["country"],
            limit: 10,
          },
        ],
      };

      // Mock the analytics data client
      const mockDataClient = {
        properties: {
          runPivotReport: vi.fn().mockResolvedValue({
            data: {
              pivotHeaders: [
                {
                  pivotHeaderEntries: [
                    { dimensionName: "country", dimensionValue: "United States" },
                  ],
                },
              ],
              dimensionHeaders: [],
              metricHeaders: [{ name: "sessions", type: "TYPE_INTEGER" }],
              rows: [],
              metadata: {
                currencyCode: "USD",
                dataLossFromOtherRow: false,
                subjectToThresholding: false,
                timeZone: "America/New_York",
              },
            },
          }),
        },
      };

      vi.mocked(mockGA4Client.getAnalyticsDataClient).mockReturnValue(mockDataClient as never);

      await tool.handler(validArgs);

      const checkRateLimitFn = mockGA4Client.checkRateLimit;
      const checkRateLimitMock = checkRateLimitFn as ReturnType<typeof vi.fn>;
      const checkRateLimitCalls = checkRateLimitMock.mock.calls;
      expect(checkRateLimitCalls.some((call) => call[0] === "ga4" && call[1] === "runPivotReport")).toBe(true);
    });
  });

  describe("ga4.realtime.snapshot handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.realtime.snapshot") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        property: "invalid",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should check rate limit before making request", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.realtime.snapshot") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const validArgs = {
        property: "properties/123456789",
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        limit: 100,
      };

      // Mock the analytics data client
      const mockDataClient = {
        properties: {
          runRealtimeReport: vi.fn().mockResolvedValue({
            data: {
              dimensionHeaders: [{ name: "country" }],
              metricHeaders: [{ name: "activeUsers", type: "TYPE_INTEGER" }],
              rows: [
                {
                  dimensionValues: [{ value: "United States" }],
                  metricValues: [{ value: "500" }],
                },
              ],
              rowCount: 1,
              totals: [
                {
                  dimensionValues: [],
                  metricValues: [{ value: "1000" }],
                },
              ],
            },
          }),
        },
      };

      vi.mocked(mockGA4Client.getAnalyticsDataClient).mockReturnValue(mockDataClient as never);

      await tool.handler(validArgs);

      const checkRateLimitFn = mockGA4Client.checkRateLimit;
      const checkRateLimitMock = checkRateLimitFn as ReturnType<typeof vi.fn>;
      const checkRateLimitCalls = checkRateLimitMock.mock.calls;
      expect(checkRateLimitCalls.some((call) => call[0] === "ga4" && call[1] === "runRealtimeReport")).toBe(true);
    });
  });
});
