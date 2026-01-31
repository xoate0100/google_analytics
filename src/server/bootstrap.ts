/**
 * MCP Server Bootstrap
 * Initializes and manages the MCP server lifecycle
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { ILogger } from "../core/types.js";

/**
 * Tool definition
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Server bootstrap options
 */
export interface ServerBootstrapOptions {
  name: string;
  version: string;
  logger: ILogger;
}

/**
 * MCP Server Bootstrap
 * Manages server initialization, tool registration, and lifecycle
 */
export class MCPServerBootstrap {
  private server: Server | undefined;
  private readonly name: string;
  private readonly version: string;
  private readonly logger: ILogger;
  private initialized: boolean;

  constructor(options: ServerBootstrapOptions) {
    if (!options.name || !options.version) {
      throw new Error("Server name and version are required");
    }

    this.name = options.name;
    this.version = options.version;
    this.logger = options.logger;
    this.initialized = false;
  }

  /**
   * Initialize the MCP server
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.logger.info("Initializing MCP server", {
      name: this.name,
      version: this.version,
    });

    this.server = new Server(
      {
        name: this.name,
        version: this.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Set up error handler
    this.server.onerror = (error: Error): void => {
      this.logger.error(`Server error: ${error.message}`);
    };

    // Set up tool list handler
    this.setupToolListHandler();

    this.initialized = true;
    this.logger.info("MCP server initialized");
  }

  private readonly registeredTools: Map<string, ToolDefinition> = new Map();

  /**
   * Register a tool with the server
   * @param tool - Tool definition
   */
  registerTool(tool: ToolDefinition): void {
    if (!this.initialized || !this.server) {
      throw new Error("Server must be initialized before registering tools");
    }

    this.logger.info("Registering tool", { name: tool.name });

    // Store tool for later registration
    // Full tool registration will be implemented in task 1.9.2
    this.registeredTools.set(tool.name, tool);
  }

  /**
   * Get registered tools
   * @returns Map of registered tools
   */
  getRegisteredTools(): Map<string, ToolDefinition> {
    return this.registeredTools;
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    if (!this.initialized || !this.server) {
      throw new Error("Server must be initialized before starting");
    }

    this.logger.info("Starting MCP server");

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    this.logger.info("MCP server started");
  }

  /**
   * Stop the server
   */
  stop(): void {
    if (!this.server) {
      return;
    }

    this.logger.info("Stopping MCP server");
    // Server cleanup if needed
    this.initialized = false;
  }

  /**
   * Get the server instance
   * @returns Server instance
   */
  getServer(): Server {
    if (!this.initialized || !this.server) {
      throw new Error("Server not initialized");
    }
    return this.server;
  }

  /**
   * Set up tool list handler
   */
  private setupToolListHandler(): void {
    if (!this.server) {
      return;
    }

    this.setupToolsListHandler();
    this.setupToolsCallHandler();
  }

  /**
   * Set up tools/list handler
   */
  private setupToolsListHandler(): void {
    if (!this.server) {
      return;
    }

    const toolsListRequestSchema = z.object({
      method: z.literal("tools/list"),
      params: z.object({}),
    });
    const toolsListResultSchema = z.object({
      tools: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          inputSchema: z.record(z.unknown()),
        })
      ),
    });

    this.server.setRequestHandler(toolsListRequestSchema, () => {
      this.logger.info("tools/list requested");
      const tools = Array.from(this.registeredTools.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      return Promise.resolve(toolsListResultSchema.parse({ tools }));
    });
  }

  /**
   * Set up tools/call handler
   */
  private setupToolsCallHandler(): void {
    if (!this.server) {
      return;
    }

    const toolsCallRequestSchema = z.object({
      method: z.literal("tools/call"),
      params: z.object({
        name: z.string(),
        arguments: z.record(z.unknown()).optional(),
      }),
    });
    const toolsCallResultSchema = z.object({
      content: z.array(
        z.object({
          type: z.literal("text"),
          text: z.string(),
        })
      ),
    });

    this.server.setRequestHandler(
      toolsCallRequestSchema,
      async (request) => {
        const { name, arguments: args } = request.params;

        this.logger.info("tools/call requested", { name, hasArgs: !!args });

        const tool = this.registeredTools.get(name);
        if (!tool) {
          throw new Error(`Tool not found: ${name}`);
        }

        const validatedArgs = args || {};
        const result = await tool.handler(validatedArgs);

        return toolsCallResultSchema.parse({
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
        });
      }
    );
  }

  /**
   * Get server information
   */
  getServerInfo(): { name: string; version: string } {
    return {
      name: this.name,
      version: this.version,
    };
  }
}
