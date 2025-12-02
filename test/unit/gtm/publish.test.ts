import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeWorkspacePublish,
  executePreviewCreate,
  executePreviewGet,
} from "../../../src/gtm/tools.js";
import type { GTMClient } from "../../../src/gtm/client.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";
import type { ILogger } from "../../../src/core/types.js";

describe("GTM Publish and Preview Tools", () => {
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

  describe("gtm.workspace.publish", () => {
    it("should publish workspace", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              get: vi.fn().mockResolvedValue({
                data: {
                  fingerprint: "abc123",
                },
              }),
              publish: vi.fn().mockResolvedValue({
                data: {
                  accountId: "123456",
                  containerId: "987654",
                  containerVersionId: "1",
                },
              }),
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeWorkspacePublish(
        {
          path: "accounts/123456/containers/987654/workspaces/111111",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.containerVersionId).toBe("1");
      expect(mockTagManagerClient.accounts.containers.workspaces.publish).toHaveBeenCalled();
    });

    it("should handle publish with explicit fingerprint", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              publish: vi.fn().mockResolvedValue({
                data: {
                  accountId: "123456",
                  containerId: "987654",
                  containerVersionId: "2",
                },
              }),
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeWorkspacePublish(
        {
          path: "accounts/123456/containers/987654/workspaces/111111",
          fingerprint: "xyz789",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.containerVersionId).toBe("2");
    });
  });

  describe("gtm.preview.create", () => {
    it("should create preview environment", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            versions: {
              create: vi.fn().mockResolvedValue({
                data: {
                  containerVersionId: "1",
                },
              }),
            },
            environments: {
              create: vi.fn().mockResolvedValue({
                data: {
                  environmentId: "env1",
                  authorizationCode: "auth123",
                },
              }),
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executePreviewCreate(
        {
          parent: "accounts/123456/containers/987654",
          workspaceId: "111111",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.environmentId).toBe("env1");
    });
  });

  describe("gtm.preview.get", () => {
    it("should get preview environment", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            environments: {
              get: vi.fn().mockResolvedValue({
                data: {
                  environmentId: "env1",
                  name: "Preview Environment",
                  authorizationCode: "auth123",
                },
              }),
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executePreviewGet(
        {
          path: "accounts/123456/containers/987654/environments/env1",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.environmentId).toBe("env1");
      expect(result.name).toBe("Preview Environment");
    });
  });
});

