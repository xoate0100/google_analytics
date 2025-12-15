import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createGA4PropertyRollback,
  createGA4DataStreamRollback,
  createGA4ConversionRollback,
} from "../../../src/core/postcheck.js";
import type { GA4Client } from "../../../src/ga4/client.js";
import type { ILogger } from "../../../src/core/types.js";
import type { OperationEnvelope } from "../../../src/core/types.js";

describe("GA4 Rollback Mechanics", () => {
  let mockGA4Client: GA4Client;
  let mockLogger: ILogger;
  let mockEnvelope: OperationEnvelope;

  beforeEach(() => {
    mockGA4Client = {
      getAnalyticsAdminClient: vi.fn(),
      checkRateLimit: vi.fn().mockResolvedValue(undefined),
    } as unknown as GA4Client;

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => mockLogger),
    };

    mockEnvelope = {
      opId: "test-op-id",
      opName: "ga4.property.upsert",
      idempotencyKey: "test-key",
      timestamp: new Date().toISOString(),
      actor: "user",
      target: {
        product: "ga4",
        accountId: "123456",
        propertyId: "987654",
      },
      request: {
        args: {},
      },
      precheck: {
        capability: true,
        exists: false,
        conflicts: [],
      },
      attempt: {
        n: 1,
        retryPolicy: "exp-jitter",
        rateLimitState: {
          tokens: 100,
        },
      },
      result: {
        status: "success",
        resourceId: "987654",
      },
      postcheck: {
        readBack: true,
        stateMatch: false,
      },
      rollback: {
        needed: false,
        action: null,
      },
      latencyMs: 100,
      warnings: [],
      notes: "",
    };
  });

  describe("createGA4PropertyRollback", () => {
    it("should create rollback action for property delete", async () => {
      const deleteEnvelope: OperationEnvelope = {
        ...mockEnvelope,
        opName: "ga4.property.delete",
        result: {
          status: "success" as const,
          resourceId: "987654",
        },
      };

      const previousState = {
        name: "properties/987654",
        displayName: "Test Property",
        timeZone: "America/New_York",
      };

      const mockAdminClient = {
        properties: {
          create: vi.fn().mockResolvedValue({
            data: previousState,
          }),
        },
      };

      (mockGA4Client.getAnalyticsAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockAdminClient
      );

      const rollback = createGA4PropertyRollback(
        deleteEnvelope,
        previousState,
        mockGA4Client,
        mockLogger
      );

      expect(rollback.needed).toBe(true);
      expect(rollback.action).toBeDefined();

      // Execute rollback
      if (rollback.action) {
        await rollback.action();
        expect(mockAdminClient.properties.create).toHaveBeenCalled();
      }
    });

    it("should create rollback action for property update", async () => {
      const previousState = {
        name: "properties/987654",
        displayName: "Old Property Name",
        timeZone: "America/New_York",
      };

      const mockAdminClient = {
        properties: {
          patch: vi.fn().mockResolvedValue({
            data: previousState,
          }),
        },
      };

      (mockGA4Client.getAnalyticsAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockAdminClient
      );

      const rollback = createGA4PropertyRollback(
        mockEnvelope,
        previousState,
        mockGA4Client,
        mockLogger
      );

      expect(rollback.needed).toBe(true);
      expect(rollback.action).toBeDefined();
    });

    it("should handle rollback errors gracefully", async () => {
      const deleteEnvelope: OperationEnvelope = {
        ...mockEnvelope,
        opName: "ga4.property.delete",
        result: {
          status: "success" as const,
          resourceId: "987654",
        },
      };

      const previousState = {
        name: "properties/987654",
        displayName: "Test Property",
        timeZone: "America/New_York",
      };

      const mockAdminClient = {
        properties: {
          create: vi.fn().mockRejectedValue(new Error("API Error")),
        },
      };

      (mockGA4Client.getAnalyticsAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockAdminClient
      );

      const rollback = createGA4PropertyRollback(
        deleteEnvelope,
        previousState,
        mockGA4Client,
        mockLogger
      );

      if (rollback.action) {
        await expect(rollback.action()).rejects.toThrow();
        expect(mockLogger.error).toHaveBeenCalled();
      }
    });
  });

  describe("createGA4DataStreamRollback", () => {
    it("should create rollback action for data stream delete", async () => {
      const deleteEnvelope: OperationEnvelope = {
        ...mockEnvelope,
        opName: "ga4.datastream.delete",
        result: {
          status: "success" as const,
          resourceId: "properties/987654/dataStreams/111111",
        },
      };

      const previousState = {
        name: "properties/987654/dataStreams/111111",
        displayName: "Test Data Stream",
        type: "WEB_DATA_STREAM",
      };

      const mockAdminClient = {
        properties: {
          dataStreams: {
            create: vi.fn().mockResolvedValue({
              data: previousState,
            }),
          },
        },
      };

      (mockGA4Client.getAnalyticsAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockAdminClient
      );

      const rollback = createGA4DataStreamRollback(
        deleteEnvelope,
        previousState,
        mockGA4Client,
        mockLogger
      );

      expect(rollback.needed).toBe(true);
      expect(rollback.action).toBeDefined();
    });
  });

  describe("createGA4ConversionRollback", () => {
    it("should create rollback action for conversion delete", async () => {
      const deleteEnvelope: OperationEnvelope = {
        ...mockEnvelope,
        opName: "ga4.conversion.delete",
        result: {
          status: "success" as const,
          resourceId: "properties/987654/conversions/222222",
        },
      };

      const previousState = {
        name: "properties/987654/conversions/222222",
        eventName: "purchase",
        countingMethod: "ONCE_PER_EVENT",
      };

      const mockAdminClient = {
        properties: {
          conversions: {
            create: vi.fn().mockResolvedValue({
              data: previousState,
            }),
          },
        },
      };

      (mockGA4Client.getAnalyticsAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockAdminClient
      );

      const rollback = createGA4ConversionRollback(
        deleteEnvelope,
        previousState,
        mockGA4Client,
        mockLogger
      );

      expect(rollback.needed).toBe(true);
      expect(rollback.action).toBeDefined();
    });
  });
});
