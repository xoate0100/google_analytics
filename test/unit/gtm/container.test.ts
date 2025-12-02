import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGTMTools } from "../../../src/gtm/tools.js";
import type { MCPServerBootstrap } from "../../../src/server/bootstrap.js";
import type { GTMClient } from "../../../src/gtm/client.js";
import type { ILogger, ICache } from "../../../src/core/types.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";

describe("GTM Container Tools", () => {
  let mockBootstrap: MCPServerBootstrap;
  let mockGTMClient: GTMClient;
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

    mockGTMClient = {
      getTagManagerClient: vi.fn(),
      checkRateLimit: vi.fn().mockResolvedValue(undefined),
    } as unknown as GTMClient;

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

  describe("registerGTMTools", () => {
    it("should register gtm.container.list tool", () => {
      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("gtm.container.list")).toBe(true);
    });

    it("should register gtm.container.get tool", () => {
      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("gtm.container.get")).toBe(true);
    });

    it("should register gtm.container.upsert tool", () => {
      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("gtm.container.upsert")).toBe(true);
    });

    it("should register gtm.container.delete tool", () => {
      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("gtm.container.delete")).toBe(true);
    });
  });

  describe("gtm.container.list handler", () => {
    it("should validate request schema", async () => {
      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("gtm.container.list") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        parent: "invalid-format",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should call Tag Manager API to list containers", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            list: vi.fn().mockResolvedValue({
              data: {
                container: [
                  {
                    accountId: "123456",
                    containerId: "987654",
                    name: "Test Container",
                    publicId: "GTM-XXXXX",
                    domainName: ["example.com"],
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

      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("gtm.container.list") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const result = await tool.handler({
        parent: "accounts/123456",
      });

      expect(mockGTMClient.checkRateLimit).toHaveBeenCalled();
      expect(result).toHaveProperty("containers");
    });
  });

  describe("gtm.container.get handler", () => {
    it("should validate request schema", async () => {
      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("gtm.container.get") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        path: "invalid-format",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should call Tag Manager API to get container", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            get: vi.fn().mockResolvedValue({
              data: {
                accountId: "123456",
                containerId: "987654",
                name: "Test Container",
                publicId: "GTM-XXXXX",
                domainName: ["example.com"],
              },
            }),
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("gtm.container.get") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const result = await tool.handler({
        path: "accounts/123456/containers/987654",
      });

      expect(mockGTMClient.checkRateLimit).toHaveBeenCalled();
      expect(result).toHaveProperty("name", "Test Container");
    });
  });
});

