import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeTagSequenceUpdate,
  executeTagPriorityUpdate,
} from "../../../src/gtm/tools.js";
import type { GTMClient } from "../../../src/gtm/client.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";
import type { ILogger } from "../../../src/core/types.js";

describe("GTM Tag Sequencing and Priority Tools", () => {
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

  describe("gtm.tag.sequence.update", () => {
    it("should update tag sequencing with blocking triggers", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              tags: {
                get: vi.fn().mockResolvedValue({
                  data: {
                    tagId: "222222",
                    name: "Test Tag",
                    fingerprint: "abc123",
                    firingTriggerId: ["trigger1"],
                    blockingTriggerId: [],
                  },
                }),
                update: vi.fn().mockResolvedValue({
                  data: {
                    tagId: "222222",
                    name: "Test Tag",
                    firingTriggerId: ["trigger1"],
                    blockingTriggerId: ["consent-tag"],
                    tagFiringOption: "ONCE_PER_EVENT",
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

      const result = await executeTagSequenceUpdate(
        {
          path: "accounts/123456/containers/987654/workspaces/111111/tags/222222",
          blockingTriggerId: ["consent-tag"],
          tagFiringOption: "ONCE_PER_EVENT",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.blockingTriggerId).toEqual(["consent-tag"]);
      expect(result.tagFiringOption).toBe("ONCE_PER_EVENT");
      expect(mockTagManagerClient.accounts.containers.workspaces.tags.update).toHaveBeenCalled();
    });

    it("should update tag sequencing with setup and teardown tags", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              tags: {
                get: vi.fn().mockResolvedValue({
                  data: {
                    tagId: "222222",
                    name: "Test Tag",
                    fingerprint: "abc123",
                  },
                }),
                update: vi.fn().mockResolvedValue({
                  data: {
                    tagId: "222222",
                    setupTagId: ["setup-tag"],
                    teardownTagId: ["teardown-tag"],
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

      const result = await executeTagSequenceUpdate(
        {
          path: "accounts/123456/containers/987654/workspaces/111111/tags/222222",
          setupTagId: ["setup-tag"],
          teardownTagId: ["teardown-tag"],
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.setupTagId).toEqual(["setup-tag"]);
      expect(result.teardownTagId).toEqual(["teardown-tag"]);
    });
  });

  describe("gtm.tag.priority.update", () => {
    it("should update tag priority", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              tags: {
                get: vi.fn().mockResolvedValue({
                  data: {
                    tagId: "222222",
                    name: "Test Tag",
                    fingerprint: "abc123",
                    priority: 0,
                  },
                }),
                update: vi.fn().mockResolvedValue({
                  data: {
                    tagId: "222222",
                    name: "Test Tag",
                    priority: 100,
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

      const result = await executeTagPriorityUpdate(
        {
          path: "accounts/123456/containers/987654/workspaces/111111/tags/222222",
          priority: 100,
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.priority).toBe(100);
      expect(mockTagManagerClient.accounts.containers.workspaces.tags.update).toHaveBeenCalled();
    });

    it("should handle negative priority values", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              tags: {
                get: vi.fn().mockResolvedValue({
                  data: {
                    tagId: "222222",
                    name: "Test Tag",
                    fingerprint: "abc123",
                    priority: 0,
                  },
                }),
                update: vi.fn().mockResolvedValue({
                  data: {
                    tagId: "222222",
                    priority: -50,
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

      const result = await executeTagPriorityUpdate(
        {
          path: "accounts/123456/containers/987654/workspaces/111111/tags/222222",
          priority: -50,
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.priority).toBe(-50);
    });
  });
});
