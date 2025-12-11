import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeDataLayerValidate,
  executeDataLayerSchemaGenerate,
} from "../../../src/gtm/tools.js";
import type { GTMClient } from "../../../src/gtm/client.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";
import type { ILogger } from "../../../src/core/types.js";

describe("GTM Data Layer Validation Tools", () => {
  let mockGTMClient: GTMClient;
  let mockRegistry: ICapabilitiesRegistry;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockGTMClient = {
      getTagManagerClient: vi.fn(),
      checkRateLimit: vi.fn().mockResolvedValue(undefined),
    } as unknown as GTMClient;

    mockRegistry = {
      hasCapability: vi.fn().mockReturnValue(true),
      getProductCapabilities: vi.fn().mockReturnValue({}),
      setProductCapabilities: vi.fn(),
    } as unknown as ICapabilitiesRegistry;

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => mockLogger),
    };
  });

  describe("gtm.datalayer.validate", () => {
    it("should validate data layer structure against schema", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              variables: {
                list: vi.fn().mockResolvedValue({
                  data: {
                    variable: [
                      {
                        name: "DLV - transactionId",
                        type: "v",
                        parameter: [
                          { key: "dataLayerName", value: "transactionId" },
                        ],
                      },
                    ],
                  },
                }),
              },
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeDataLayerValidate(
        {
          parent: "accounts/123456/containers/987654/workspaces/111111",
          dataLayer: {
            event: "purchase",
            transactionId: "T12345",
          },
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should return validation errors for invalid data layer", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              variables: {
                list: vi.fn().mockResolvedValue({
                  data: {
                    variable: [],
                  },
                }),
              },
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeDataLayerValidate(
        {
          parent: "accounts/123456/containers/987654/workspaces/111111",
          dataLayer: {
            // Missing required 'event' field
            transactionId: "T12345",
          },
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it("should handle missing schema gracefully", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              variables: {
                list: vi.fn().mockResolvedValue({
                  data: {
                    variable: [],
                  },
                }),
              },
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeDataLayerValidate(
        {
          parent: "accounts/123456/containers/987654/workspaces/111111",
          dataLayer: {
            event: "purchase",
          },
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result.valid).toBe(true);
    });
  });

  describe("gtm.datalayer.schema.generate", () => {
    it("should generate schema from data layer events", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              variables: {
                list: vi.fn().mockResolvedValue({
                  data: {
                    variable: [
                      {
                        name: "DLV - transactionId",
                        type: "v",
                        parameter: [
                          { key: "dataLayerName", value: "transactionId" },
                        ],
                        notes: "Transaction ID from data layer",
                      },
                      {
                        name: "DLV - value",
                        type: "v",
                        parameter: [
                          { key: "dataLayerName", value: "value" },
                        ],
                      },
                    ],
                  },
                }),
              },
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeDataLayerSchemaGenerate(
        {
          parent: "accounts/123456/containers/987654/workspaces/111111",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result.schema).toBeDefined();
      expect(result.schema.event).toBeDefined();
      expect(result.variables.length).toBeGreaterThan(0);
      expect(result.variables.some((v) => v.name === "event")).toBe(true);
      expect(result.variables.some((v) => v.name === "transactionId")).toBe(true);
    });

    it("should handle empty data layer", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              variables: {
                list: vi.fn().mockResolvedValue({
                  data: {
                    variable: [],
                  },
                }),
              },
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeDataLayerSchemaGenerate(
        {
          parent: "accounts/123456/containers/987654/workspaces/111111",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result.schema).toBeDefined();
      expect(result.schema.event).toBeDefined();
      expect(result.variables.length).toBe(1); // Only 'event' required field
      expect(result.variables[0]?.name).toBe("event");
    });
  });
});
