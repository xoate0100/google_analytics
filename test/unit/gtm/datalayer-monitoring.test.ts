import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeDataLayerMonitor,
  executeDataLayerEventsList,
} from "../../../src/gtm/tools.js";
import type { GTMClient } from "../../../src/gtm/client.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";
import type { ILogger } from "../../../src/core/types.js";

describe("GTM Data Layer Monitoring Tools", () => {
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

  describe("gtm.datalayer.monitor", () => {
    it("should monitor data layer events in real-time", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              variables: {
                list: vi.fn().mockResolvedValue({
                  data: {
                    variable: [
                      {
                        name: "DLV - event",
                        type: "v",
                        parameter: [
                          { key: "dataLayerName", value: "event" },
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

      const result = await executeDataLayerMonitor(
        {
          parent: "accounts/123456/containers/987654/workspaces/111111",
          eventName: "purchase",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.monitoring).toBe(true);
    });

    it("should handle missing event name", async () => {
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

      const result = await executeDataLayerMonitor(
        {
          parent: "accounts/123456/containers/987654/workspaces/111111",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.monitoring).toBe(true);
    });
  });

  describe("gtm.datalayer.events.list", () => {
    it("should list data layer events", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              triggers: {
                list: vi.fn().mockResolvedValue({
                  data: {
                    trigger: [
                      {
                        name: "Purchase Event Trigger",
                        type: "customEvent",
                        customEventFilter: [
                          {
                            type: "equals",
                            parameter: [
                              { key: "arg0", value: "{{event}}" },
                              { key: "arg1", value: "purchase" },
                            ],
                          },
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

      const result = await executeDataLayerEventsList(
        {
          parent: "accounts/123456/containers/987654/workspaces/111111",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.events).toBeDefined();
      expect(Array.isArray(result.events)).toBe(true);
    });

    it("should handle empty event list", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              triggers: {
                list: vi.fn().mockResolvedValue({
                  data: {
                    trigger: [],
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

      const result = await executeDataLayerEventsList(
        {
          parent: "accounts/123456/containers/987654/workspaces/111111",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.events).toBeDefined();
      expect(result.events.length).toBe(0);
    });
  });
});

