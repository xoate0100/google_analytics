import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGTMTools } from "../../../src/gtm/tools.js";
import type { MCPServerBootstrap } from "../../../src/server/bootstrap.js";
import type { GTMClient } from "../../../src/gtm/client.js";
import type { ILogger, ICache } from "../../../src/core/types.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";

describe("GTM Variable Tools", () => {
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
    it("should register gtm.variable.list tool", () => {
      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("gtm.variable.list")).toBe(true);
    });

    it("should register gtm.variable.get tool", () => {
      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("gtm.variable.get")).toBe(true);
    });

    it("should register gtm.variable.upsert tool", () => {
      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("gtm.variable.upsert")).toBe(true);
    });

    it("should register gtm.variable.delete tool", () => {
      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("gtm.variable.delete")).toBe(true);
    });

    it("should register gtm.builtinVariable.list tool", () => {
      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("gtm.builtinVariable.list")).toBe(true);
    });

    it("should register gtm.builtinVariable.enable tool", () => {
      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      expect(registeredTools.has("gtm.builtinVariable.enable")).toBe(true);
    });
  });

  describe("gtm.variable.list handler", () => {
    it("should validate request schema", async () => {
      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("gtm.variable.list") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        parent: "invalid-format",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should call Tag Manager API to list variables", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              variables: {
                list: vi.fn().mockResolvedValue({
                  data: {
                    variable: [
                      {
                        accountId: "123456",
                        containerId: "987654",
                        workspaceId: "111111",
                        variableId: "444444",
                        name: "Page URL",
                        type: "v",
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

      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("gtm.variable.list") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const result = await tool.handler({
        parent: "accounts/123456/containers/987654/workspaces/111111",
      });

      expect(mockGTMClient.checkRateLimit).toHaveBeenCalled();
      expect(result).toHaveProperty("variables");
    });
  });

  describe("gtm.variable.get handler", () => {
    it("should validate request schema", async () => {
      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("gtm.variable.get") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const invalidArgs = {
        path: "invalid-format",
      };

      await expect(tool.handler(invalidArgs)).rejects.toThrow();
    });

    it("should call Tag Manager API to get variable", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            workspaces: {
              variables: {
                get: vi.fn().mockResolvedValue({
                  data: {
                    accountId: "123456",
                    containerId: "987654",
                    workspaceId: "111111",
                    variableId: "444444",
                    name: "Page URL",
                    type: "v",
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

      registerGTMTools({
        bootstrap: mockBootstrap,
        gtmClient: mockGTMClient,
        cache: mockCache,
        capabilitiesRegistry: mockCapabilitiesRegistry,
        logger: mockLogger,
      });

      const tool = registeredTools.get("gtm.variable.get") as {
        handler: (args: unknown) => Promise<unknown>;
      };

      const result = await tool.handler({
        path: "accounts/123456/containers/987654/workspaces/111111/variables/444444",
      });

      expect(mockGTMClient.checkRateLimit).toHaveBeenCalled();
      expect(result).toHaveProperty("name", "Page URL");
    });
  });
});
