import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGA4Tools } from "../../../src/ga4/tools.js";
import type { MCPServerBootstrap } from "../../../src/server/bootstrap.js";
import type { GA4Client } from "../../../src/ga4/client.js";
import type { MeasurementProtocolClient } from "../../../src/ga4/measurement.js";
import type { ILogger, ICache } from "../../../src/core/types.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";

describe("GA4 Measurement Protocol Tools", () => {
  let mockBootstrap: MCPServerBootstrap;
  let mockGA4Client: GA4Client;
  let mockMeasurementClient: MeasurementProtocolClient;
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

    mockMeasurementClient = {
      sendEvent: vi.fn().mockResolvedValue(undefined),
      validateEvent: vi.fn().mockResolvedValue({
        validationMessages: [],
      }),
    } as unknown as MeasurementProtocolClient;

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
    it("should register ga4.measurement.send tool when measurement client provided", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        measurementClient: mockMeasurementClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.measurement.send")).toBe(true);
    });

    it("should register ga4.measurement.validate tool when measurement client provided", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        measurementClient: mockMeasurementClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.measurement.validate")).toBe(true);
    });

    it("should not register measurement tools when measurement client not provided", () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("ga4.measurement.send")).toBe(false);
      expect(registeredTools.has("ga4.measurement.validate")).toBe(false);
    });
  });

  describe("ga4.measurement.send handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        measurementClient: mockMeasurementClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.measurement.send") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        events: [], // Empty events array is invalid
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should send event via measurement client", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        measurementClient: mockMeasurementClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.measurement.send") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const validArgs = {
        client_id: "test-client-id",
        events: [{ name: "test_event", params: { value: 100 } }],
      };

      await tool.handler(validArgs);

      expect(mockMeasurementClient.sendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: "test-client-id",
          events: [{ name: "test_event", params: { value: 100 } }],
        })
      );
    });
  });

  describe("ga4.measurement.validate handler", () => {
    it("should validate request schema", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        measurementClient: mockMeasurementClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.measurement.validate") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        events: [], // Empty events array is invalid
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should validate event via measurement client", async () => {
      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        measurementClient: mockMeasurementClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.measurement.validate") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const validArgs = {
        client_id: "test-client-id",
        events: [{ name: "test_event", params: { value: 100 } }],
      };

      await tool.handler(validArgs);

      expect(mockMeasurementClient.validateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: "test-client-id",
          events: [{ name: "test_event", params: { value: 100 } }],
        })
      );
    });

    it("should return validation response", async () => {
      const validationMessages = [
        { fieldPath: "events[0].name", description: "Event name is valid" },
      ];

      vi.mocked(mockMeasurementClient.validateEvent).mockResolvedValue({
        validationMessages,
      });

      registerGA4Tools({
        bootstrap: mockBootstrap,
        ga4Client: mockGA4Client,
        measurementClient: mockMeasurementClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("ga4.measurement.validate") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const validArgs = {
        client_id: "test-client-id",
        events: [{ name: "test_event" }],
      };

      const result = await tool.handler(validArgs);

      expect(result).toEqual({ validationMessages });
    });
  });
});

