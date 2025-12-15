/**
 * Bootstrap Tool Handlers Tests
 * Tests for MCP tool handlers (tools/list, tools/call)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MCPServerBootstrap } from "../../../src/server/bootstrap.js";
import type { ILogger } from "../../../src/core/types.js";

describe("Bootstrap Tool Handlers", () => {
  let bootstrap: MCPServerBootstrap;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => mockLogger),
    };

    bootstrap = new MCPServerBootstrap({
      name: "test-server",
      version: "0.1.0",
      logger: mockLogger,
    });
    bootstrap.initialize();
  });

  it("should register tools that can be listed", () => {
    bootstrap.registerTool({
      name: "test.tool",
      description: "Test tool",
      inputSchema: {
        type: "object",
        properties: {},
      },
      handler: async () => ({ message: "test" }),
    });

    const tools = bootstrap.getRegisteredTools();
    expect(tools.has("test.tool")).toBe(true);
    expect(tools.get("test.tool")?.name).toBe("test.tool");
  });

  it("should handle list_tools request", async () => {
    bootstrap.registerTool({
      name: "test.tool1",
      description: "Test tool 1",
      inputSchema: {
        type: "object",
        properties: {},
      },
      handler: async () => ({ message: "test1" }),
    });

    bootstrap.registerTool({
      name: "test.tool2",
      description: "Test tool 2",
      inputSchema: {
        type: "object",
        properties: {},
      },
      handler: async () => ({ message: "test2" }),
    });

    const tools = bootstrap.getRegisteredTools();
    expect(tools.size).toBe(2);
    expect(tools.has("test.tool1")).toBe(true);
    expect(tools.has("test.tool2")).toBe(true);
  });

  it("should handle call_tool request with valid tool name", async () => {
    const mockHandler = vi.fn().mockResolvedValue({ result: "success" });

    bootstrap.registerTool({
      name: "test.tool",
      description: "Test tool",
      inputSchema: {
        type: "object",
        properties: {},
      },
      handler: mockHandler,
    });

    const tool = bootstrap.getRegisteredTools().get("test.tool");
    expect(tool).toBeDefined();
    const result = await tool?.handler({});
    expect(mockHandler).toHaveBeenCalledWith({});
    expect(result).toEqual({ result: "success" });
  });

  it("should handle call_tool request with input validation", async () => {
    const mockHandler = vi.fn().mockResolvedValue({ result: "success" });

    bootstrap.registerTool({
      name: "test.tool",
      description: "Test tool",
      inputSchema: {
        type: "object",
        properties: {
          param1: { type: "string" },
        },
        required: ["param1"],
      },
      handler: mockHandler,
    });

    const tool = bootstrap.getRegisteredTools().get("test.tool");
    expect(tool).toBeDefined();
    const result = await tool?.handler({ param1: "value1" });
    expect(mockHandler).toHaveBeenCalledWith({ param1: "value1" });
    expect(result).toEqual({ result: "success" });
  });

  it("should handle call_tool request with invalid tool name", () => {
    const tool = bootstrap.getRegisteredTools().get("nonexistent.tool");
    expect(tool).toBeUndefined();
  });

  it("should register tool with input schema", () => {
    bootstrap.registerTool({
      name: "test.tool",
      description: "Test tool",
      inputSchema: {
        type: "object",
        properties: {
          param1: { type: "string" },
        },
        required: ["param1"],
      },
      handler: vi.fn(),
    });

    const tool = bootstrap.getRegisteredTools().get("test.tool");
    expect(tool).toBeDefined();
    expect(tool?.inputSchema).toEqual({
      type: "object",
      properties: {
        param1: { type: "string" },
      },
      required: ["param1"],
    });
  });
});
