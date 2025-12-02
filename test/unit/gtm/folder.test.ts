import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeFolderList,
  executeFolderGet,
  executeFolderUpsert,
  executeFolderDelete,
} from "../../../src/gtm/tools.js";
import type { GTMClient } from "../../../src/gtm/client.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";
import type { ILogger } from "../../../src/core/types.js";

describe("GTM Folder Tools", () => {
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

  describe("gtm.folder.list", () => {
    it("should list folders in workspace", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              folders: {
                list: vi.fn().mockResolvedValue({
                  data: {
                    folder: [
                      {
                        accountId: "123456",
                        containerId: "987654",
                        workspaceId: "111111",
                        folderId: "1",
                        name: "Analytics Tags",
                      },
                      {
                        accountId: "123456",
                        containerId: "987654",
                        workspaceId: "111111",
                        folderId: "2",
                        name: "Marketing Tags",
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

      const result = await executeFolderList(
        {
          parent: "accounts/123456/containers/987654/workspaces/111111",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.folders).toBeDefined();
      expect(result.folders.length).toBe(2);
      expect(result.folders[0]?.name).toBe("Analytics Tags");
    });

    it("should handle empty folder list", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              folders: {
                list: vi.fn().mockResolvedValue({
                  data: {
                    folder: [],
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

      const result = await executeFolderList(
        {
          parent: "accounts/123456/containers/987654/workspaces/111111",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.folders).toBeDefined();
      expect(result.folders.length).toBe(0);
    });
  });

  describe("gtm.folder.get", () => {
    it("should get folder by path", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              folders: {
                get: vi.fn().mockResolvedValue({
                  data: {
                    accountId: "123456",
                    containerId: "987654",
                    workspaceId: "111111",
                    folderId: "1",
                    name: "Analytics Tags",
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

      const result = await executeFolderGet(
        {
          path: "accounts/123456/containers/987654/workspaces/111111/folders/1",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.name).toBe("Analytics Tags");
      expect(result.folderId).toBe("1");
    });
  });

  describe("gtm.folder.upsert", () => {
    it("should create new folder", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              folders: {
                create: vi.fn().mockResolvedValue({
                  data: {
                    accountId: "123456",
                    containerId: "987654",
                    workspaceId: "111111",
                    folderId: "1",
                    name: "New Folder",
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

      const result = await executeFolderUpsert(
        {
          parent: "accounts/123456/containers/987654/workspaces/111111",
          name: "New Folder",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.name).toBe("New Folder");
      expect(mockTagManagerClient.accounts.containers.workspaces.folders.create).toHaveBeenCalled();
    });

    it("should update existing folder", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              folders: {
                get: vi.fn().mockResolvedValue({
                  data: {
                    accountId: "123456",
                    containerId: "987654",
                    workspaceId: "111111",
                    folderId: "1",
                    name: "Old Name",
                  },
                }),
                update: vi.fn().mockResolvedValue({
                  data: {
                    accountId: "123456",
                    containerId: "987654",
                    workspaceId: "111111",
                    folderId: "1",
                    name: "New Name",
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

      const result = await executeFolderUpsert(
        {
          parent: "accounts/123456/containers/987654/workspaces/111111",
          folderId: "1",
          name: "New Name",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.name).toBe("New Name");
      expect(mockTagManagerClient.accounts.containers.workspaces.folders.update).toHaveBeenCalled();
    });
  });

  describe("gtm.folder.delete", () => {
    it("should delete folder", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              folders: {
                delete: vi.fn().mockResolvedValue(undefined),
              },
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeFolderDelete(
        {
          path: "accounts/123456/containers/987654/workspaces/111111/folders/1",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockTagManagerClient.accounts.containers.workspaces.folders.delete).toHaveBeenCalled();
    });
  });
});

