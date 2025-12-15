import { describe, it, expect, vi, beforeEach } from "vitest";
import { discoverGTMCapabilities, DiscoveryOptions } from "../../../src/core/discovery.js";
import { CapabilitiesRegistry } from "../../../src/core/capabilities.js";
import type { ILogger } from "../../../src/core/types.js";
import type { GTMClient } from "../../../src/gtm/client.js";

describe("GTM Route Verification", () => {
  let mockLogger: ILogger;
  let mockGTMClient: GTMClient;
  let registry: CapabilitiesRegistry;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => mockLogger),
    };

    mockGTMClient = {
      getTagManagerClient: vi.fn(),
      checkRateLimit: vi.fn().mockResolvedValue(undefined),
    } as unknown as GTMClient;

    registry = new CapabilitiesRegistry();
  });

  describe("discoverGTMCapabilities", () => {
    it("should verify GTM API endpoints are accessible", async () => {
      const mockTagManagerClient = {
        accounts: {
          list: vi.fn().mockResolvedValue({
            data: {
              account: [
                {
                  accountId: "123456",
                  name: "Test Account",
                },
              ],
            },
          }),
          containers: {
            list: vi.fn().mockResolvedValue({
              data: {
                container: [
                  {
                    accountId: "123456",
                    containerId: "987654",
                    name: "Test Container",
                  },
                ],
              },
            }),
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const options: DiscoveryOptions = {
        registry,
        logger: mockLogger,
        gtmClient: mockGTMClient,
      };

      await discoverGTMCapabilities(options);

      const caps = registry.getProductCapabilities("gtm");
      expect(caps).toBeDefined();
      expect(mockGTMClient.getTagManagerClient).toHaveBeenCalled();
    });

    it("should handle API errors gracefully", async () => {
      const mockTagManagerClient = {
        accounts: {
          list: vi.fn().mockRejectedValue(new Error("API Error")),
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const options: DiscoveryOptions = {
        registry,
        logger: mockLogger,
        gtmClient: mockGTMClient,
      };

      // Should not throw, but log error
      await expect(discoverGTMCapabilities(options)).resolves.toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should verify container and workspace access", async () => {
      const mockContainersList = vi.fn().mockResolvedValue({
        data: {
          container: [
            {
              accountId: "123456",
              containerId: "987654",
              name: "Test Container",
            },
          ],
        },
      });

      const mockWorkspacesList = vi.fn().mockResolvedValue({
        data: {
          workspace: [
            {
              accountId: "123456",
              containerId: "987654",
              workspaceId: "111111",
              name: "Default Workspace",
            },
          ],
        },
      });

      const mockTagManagerClient = {
        accounts: {
          list: vi.fn().mockResolvedValue({
            data: {
              account: [
                {
                  accountId: "123456",
                  name: "Test Account",
                },
              ],
            },
          }),
          containers: {
            list: mockContainersList,
            workspaces: {
              list: mockWorkspacesList,
            },
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const options: DiscoveryOptions = {
        registry,
        logger: mockLogger,
        gtmClient: mockGTMClient,
      };

      await discoverGTMCapabilities(options);

      // Verify all endpoints were called
      expect(mockTagManagerClient.accounts.list).toHaveBeenCalled();
      expect(mockContainersList).toHaveBeenCalled();
      expect(mockWorkspacesList).toHaveBeenCalled();
    });

    it("should update capabilities registry with GTM status", async () => {
      const mockTagManagerClient = {
        accounts: {
          list: vi.fn().mockResolvedValue({
            data: {
              account: [],
            },
          }),
          containers: {
            list: vi.fn().mockResolvedValue({
              data: {
                container: [],
              },
            }),
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const options: DiscoveryOptions = {
        registry,
        logger: mockLogger,
        gtmClient: mockGTMClient,
      };

      await discoverGTMCapabilities(options);

      const caps = registry.getProductCapabilities("gtm");
      expect(caps).toBeDefined();
      expect(registry.hasCapability("gtm", "accounts")).toBe(true);
    });
  });
});
