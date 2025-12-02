import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  MCPServerBootstrap,
  ServerBootstrapOptions,
} from "../../../src/server/bootstrap.js";
import type { ILogger } from "../../../src/core/types.js";

describe("MCP Server Bootstrap", () => {
  let mockLogger: ILogger;
  let bootstrapOptions: ServerBootstrapOptions;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => mockLogger),
    };

    bootstrapOptions = {
      name: "mcp-google-marketing",
      version: "0.1.0",
      logger: mockLogger,
    };
  });

  describe("constructor", () => {
    it("should create server bootstrap with required options", () => {
      const bootstrap = new MCPServerBootstrap(bootstrapOptions);
      expect(bootstrap).toBeDefined();
    });

    it("should throw error if name is missing", () => {
      expect(() => {
        new MCPServerBootstrap({
          ...bootstrapOptions,
          name: "",
        });
      }).toThrow();
    });

    it("should throw error if version is missing", () => {
      expect(() => {
        new MCPServerBootstrap({
          ...bootstrapOptions,
          version: "",
        });
      }).toThrow();
    });
  });

  describe("initialize", () => {
    it("should initialize the MCP server", async () => {
      const bootstrap = new MCPServerBootstrap(bootstrapOptions);
      bootstrap.initialize();

      const infoCalls = (mockLogger.info as ReturnType<typeof vi.fn>).mock.calls;
      expect(infoCalls.some((call) => 
        call[0] === "Initializing MCP server"
      )).toBe(true);
    });

    it("should be idempotent (can be called multiple times)", () => {
      const bootstrap = new MCPServerBootstrap(bootstrapOptions);
      bootstrap.initialize();
      bootstrap.initialize();

      // Should not throw or cause issues
      expect(bootstrap).toBeDefined();
    });
  });

  describe("registerTool", () => {
    it("should register a tool", () => {
      const bootstrap = new MCPServerBootstrap(bootstrapOptions);
      bootstrap.initialize();

      const tool = {
        name: "test.tool",
        description: "Test tool",
        inputSchema: {
          type: "object",
          properties: {
            param: { type: "string" },
          },
        },
        handler: vi.fn(),
      };

      bootstrap.registerTool(tool);

      const infoCalls = (mockLogger.info as ReturnType<typeof vi.fn>).mock.calls;
      expect(infoCalls.some((call) => 
        call[0] === "Registering tool" && 
        call[1]?.name === "test.tool"
      )).toBe(true);

      const registeredTools = bootstrap.getRegisteredTools();
      expect(registeredTools.has("test.tool")).toBe(true);
    });

    it("should throw error if server not initialized", () => {
      const bootstrap = new MCPServerBootstrap(bootstrapOptions);

      const tool = {
        name: "test.tool",
        description: "Test tool",
        inputSchema: {},
        handler: vi.fn(),
      };

      expect(() => bootstrap.registerTool(tool)).toThrow();
    });
  });

  describe("getServer", () => {
    it("should return server instance after initialization", () => {
      const bootstrap = new MCPServerBootstrap(bootstrapOptions);
      bootstrap.initialize();

      const server = bootstrap.getServer();
      expect(server).toBeDefined();
    });

    it("should throw error if server not initialized", () => {
      const bootstrap = new MCPServerBootstrap(bootstrapOptions);

      expect(() => bootstrap.getServer()).toThrow();
    });
  });

  describe("start", () => {
    it("should start the server", async () => {
      const bootstrap = new MCPServerBootstrap(bootstrapOptions);
      bootstrap.initialize();

      // Note: Actual start might require transport setup
      // This is a stub test for now
      await expect(bootstrap.start()).resolves.toBeUndefined();
    });
  });

  describe("stop", () => {
    it("should stop the server", () => {
      const bootstrap = new MCPServerBootstrap(bootstrapOptions);
      bootstrap.initialize();

      expect(() => bootstrap.stop()).not.toThrow();
    });
  });
});

