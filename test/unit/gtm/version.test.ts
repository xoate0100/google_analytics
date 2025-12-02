import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeVersionList,
  executeVersionGet,
  executeVersionCreate,
  executeVersionRestore,
} from "../../../src/gtm/tools.js";
import type { GTMClient } from "../../../src/gtm/client.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";
import type { ILogger } from "../../../src/core/types.js";

describe("GTM Version Tools", () => {
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

  describe("gtm.version.list", () => {
    it("should list container versions", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            versions: {
              list: vi.fn().mockResolvedValue({
                data: {
                  version: [
                    {
                      accountId: "123456",
                      containerId: "987654",
                      containerVersionId: "1",
                      name: "Version 1",
                      description: "Initial version",
                    },
                    {
                      accountId: "123456",
                      containerId: "987654",
                      containerVersionId: "2",
                      name: "Version 2",
                      description: "Updated version",
                    },
                  ],
                },
              }),
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeVersionList(
        {
          parent: "accounts/123456/containers/987654",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.versions).toBeDefined();
      expect(result.versions.length).toBe(2);
      expect(result.versions[0]?.name).toBe("Version 1");
    });

    it("should handle empty version list", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            versions: {
              list: vi.fn().mockResolvedValue({
                data: {
                  version: [],
                },
              }),
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeVersionList(
        {
          parent: "accounts/123456/containers/987654",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.versions).toBeDefined();
      expect(result.versions.length).toBe(0);
    });
  });

  describe("gtm.version.get", () => {
    it("should get version by path", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            versions: {
              get: vi.fn().mockResolvedValue({
                data: {
                  accountId: "123456",
                  containerId: "987654",
                  containerVersionId: "1",
                  name: "Version 1",
                  description: "Initial version",
                },
              }),
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeVersionGet(
        {
          path: "accounts/123456/containers/987654/versions/1",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.name).toBe("Version 1");
      expect(result.containerVersionId).toBe("1");
    });
  });

  describe("gtm.version.create", () => {
    it("should create version from workspace", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            versions: {
              create: vi.fn().mockResolvedValue({
                data: {
                  accountId: "123456",
                  containerId: "987654",
                  containerVersionId: "1",
                  name: "New Version",
                  description: "Created from workspace",
                },
              }),
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeVersionCreate(
        {
          parent: "accounts/123456/containers/987654",
          workspaceId: "111111",
          name: "New Version",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.name).toBe("New Version");
      expect(mockTagManagerClient.accounts.containers.versions.create).toHaveBeenCalled();
    });
  });

  describe("gtm.version.restore", () => {
    it("should restore version", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            versions: {
              restore: vi.fn().mockResolvedValue({
                data: {
                  accountId: "123456",
                  containerId: "987654",
                  containerVersionId: "1",
                  name: "Restored Version",
                },
              }),
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeVersionRestore(
        {
          path: "accounts/123456/containers/987654/versions/1",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.name).toBe("Restored Version");
      expect(mockTagManagerClient.accounts.containers.versions.restore).toHaveBeenCalled();
    });
  });
});

