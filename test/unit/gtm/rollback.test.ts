import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createGTMTagRollback,
  createGTMTriggerRollback,
  createGTMVariableRollback,
} from "../../../src/core/postcheck.js";
import type { GTMClient } from "../../../src/gtm/client.js";
import type { ILogger } from "../../../src/core/types.js";
import type { OperationEnvelope } from "../../../src/core/types.js";

describe("GTM Rollback Mechanics", () => {
  let mockGTMClient: GTMClient;
  let mockLogger: ILogger;
  let mockEnvelope: OperationEnvelope;

  beforeEach(() => {
    mockGTMClient = {
      getTagManagerClient: vi.fn(),
      checkRateLimit: vi.fn().mockResolvedValue(undefined),
    } as unknown as GTMClient;

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => mockLogger),
    };

    mockEnvelope = {
      opId: "test-op-id",
      opName: "gtm.tag.upsert",
      idempotencyKey: "test-key",
      timestamp: new Date().toISOString(),
      actor: "user",
      target: {
        product: "gtm",
        accountId: "123456",
        containerId: "987654",
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
        resourceId: "222222",
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

  describe("createGTMTagRollback", () => {
    it("should create rollback action for tag delete", async () => {
      const deleteEnvelope: OperationEnvelope = {
        ...mockEnvelope,
        opName: "gtm.tag.delete",
        result: {
          status: "success" as const,
          resourceId: "222222",
        },
      };

      const previousState = {
        accountId: "123456",
        containerId: "987654",
        workspaceId: "111111",
        tagId: "222222",
        name: "GA4 Configuration",
        type: "GOOGLE_ANALYTICS_GA4_CONFIGURATION",
      };

      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              tags: {
                create: vi.fn().mockResolvedValue({
                  data: previousState,
                }),
              },
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const rollback = createGTMTagRollback(
        deleteEnvelope,
        previousState,
        mockGTMClient,
        mockLogger
      );

      expect(rollback.needed).toBe(true);
      expect(rollback.action).toBeDefined();
    });

    it("should create rollback action for tag update", async () => {
      const updateEnvelope: OperationEnvelope = {
        ...mockEnvelope,
        opName: "gtm.tag.upsert",
        result: {
          status: "success" as const,
          resourceId: "222222",
        },
      };

      const previousState = {
        accountId: "123456",
        containerId: "987654",
        workspaceId: "111111",
        tagId: "222222",
        name: "Old Tag Name",
        type: "GOOGLE_ANALYTICS_GA4_CONFIGURATION",
      };

      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              tags: {
                update: vi.fn().mockResolvedValue({
                  data: previousState,
                }),
              },
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const rollback = createGTMTagRollback(
        updateEnvelope,
        previousState,
        mockGTMClient,
        mockLogger
      );

      expect(rollback.needed).toBe(true);
      expect(rollback.action).toBeDefined();
    });
  });

  describe("createGTMTriggerRollback", () => {
    it("should create rollback action for trigger delete", async () => {
      const deleteEnvelope: OperationEnvelope = {
        ...mockEnvelope,
        opName: "gtm.trigger.delete",
        result: {
          status: "success" as const,
          resourceId: "333333",
        },
      };

      const previousState = {
        accountId: "123456",
        containerId: "987654",
        workspaceId: "111111",
        triggerId: "333333",
        name: "Page View",
        type: "PAGEVIEW",
      };

      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              triggers: {
                create: vi.fn().mockResolvedValue({
                  data: previousState,
                }),
              },
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const rollback = createGTMTriggerRollback(
        deleteEnvelope,
        previousState,
        mockGTMClient,
        mockLogger
      );

      expect(rollback.needed).toBe(true);
      expect(rollback.action).toBeDefined();
    });
  });

  describe("createGTMVariableRollback", () => {
    it("should create rollback action for variable delete", async () => {
      const deleteEnvelope: OperationEnvelope = {
        ...mockEnvelope,
        opName: "gtm.variable.delete",
        result: {
          status: "success" as const,
          resourceId: "444444",
        },
      };

      const previousState = {
        accountId: "123456",
        containerId: "987654",
        workspaceId: "111111",
        variableId: "444444",
        name: "Page URL",
        type: "v",
      };

      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              variables: {
                create: vi.fn().mockResolvedValue({
                  data: previousState,
                }),
              },
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const rollback = createGTMVariableRollback(
        deleteEnvelope,
        previousState,
        mockGTMClient,
        mockLogger
      );

      expect(rollback.needed).toBe(true);
      expect(rollback.action).toBeDefined();
    });
  });
});
