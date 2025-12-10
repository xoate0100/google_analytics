/**
 * Core utility tools registration
 * Registers auth, capabilities, and core utility tools with the MCP server
 */

import type { MCPServerBootstrap } from "./bootstrap.js";
import type { ILogger, ICapabilitiesRegistry } from "../core/types.js";
import type { OAuthClient } from "../core/oauth.js";
import type { TokenStorage } from "../core/token-storage.js";

/**
 * Options for registering core utility tools
 */
export interface CoreToolsOptions {
  bootstrap: MCPServerBootstrap;
  capabilitiesRegistry: ICapabilitiesRegistry;
  oauthClient: OAuthClient;
  tokenStorage: TokenStorage;
  logger: ILogger;
}

/**
 * Register all core utility tools
 * @param options - Tool registration options
 */
export function registerCoreUtilityTools(
  options: CoreToolsOptions
): void {
  const { bootstrap, capabilitiesRegistry, oauthClient, tokenStorage, logger } =
    options;

  logger.info("Registering core utility tools");

  // Auth tools
  registerAuthTools(bootstrap, oauthClient, tokenStorage, logger);

  // Capabilities tools
  registerCapabilitiesTools(bootstrap, capabilitiesRegistry, logger);

  // Core utility tools
  registerCoreTools(bootstrap, logger);

  logger.info("Core utility tools registered");
}

/**
 * Register authentication tools
 */
function registerAuthTools(
  bootstrap: MCPServerBootstrap,
  _oauthClient: OAuthClient,
  tokenStorage: TokenStorage,
  logger: ILogger
): void {
  registerAuthLoginTool(bootstrap, logger);
  registerAuthRotateTool(bootstrap, logger);
  registerAuthStatusTool(bootstrap, tokenStorage, logger);
}

function registerAuthLoginTool(
  bootstrap: MCPServerBootstrap,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "auth.login",
    description: "Authenticate with Google services using OAuth device flow",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      logger.info("auth.login called");
      return Promise.resolve({
        message: "Authentication flow not yet implemented",
      });
    },
  });
}

function registerAuthRotateTool(
  bootstrap: MCPServerBootstrap,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "auth.rotate",
    description: "Rotate authentication tokens",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      logger.info("auth.rotate called");
      return Promise.resolve({
        message: "Token rotation not yet implemented",
      });
    },
  });
}

function registerAuthStatusTool(
  bootstrap: MCPServerBootstrap,
  tokenStorage: TokenStorage,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "auth.status",
    description: "Check authentication status and token information",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      logger.info("auth.status called");
      const products = await tokenStorage.listProducts();
      return Promise.resolve({
        authenticated: products.length > 0,
        products: products,
      });
    },
  });
}

/**
 * Register capabilities tools
 */
function registerCapabilitiesTools(
  bootstrap: MCPServerBootstrap,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  // capabilities.refresh
  bootstrap.registerTool({
    name: "capabilities.refresh",
    description: "Refresh capability registry by running discovery routines",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      logger.info("capabilities.refresh called");
      await capabilitiesRegistry.refresh();
      return { message: "Capabilities refreshed" };
    },
  });

  // capabilities.get
  bootstrap.registerTool({
    name: "capabilities.get",
    description: "Get current capabilities for a product",
    inputSchema: {
      type: "object",
      properties: {
        product: {
          type: "string",
          description: "Product name (ga4, gtm, ads)",
        },
      },
    },
    handler: async (args) => {
      logger.info("capabilities.get called", { args });
      const product = args.product as string | undefined;
      if (!product) {
        return Promise.resolve({ error: "Product name is required" });
      }
      const capabilities = capabilitiesRegistry.getProductCapabilities(product);
      return Promise.resolve({
        product,
        capabilities: capabilities || null,
      });
    },
  });
}

/**
 * Register core utility tools
 */
function registerCoreTools(
  bootstrap: MCPServerBootstrap,
  logger: ILogger
): void {
  registerHealthcheckTool(bootstrap, logger);
  registerVersionTool(bootstrap, logger);
  registerDryRunTool(bootstrap, logger);
}

function registerHealthcheckTool(
  bootstrap: MCPServerBootstrap,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "core.healthcheck",
    description: "Check server health status",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      logger.info("core.healthcheck called");
      return Promise.resolve({
        status: "healthy",
        timestamp: new Date().toISOString(),
      });
    },
  });
}

function registerVersionTool(
  bootstrap: MCPServerBootstrap,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "core.version",
    description: "Get server version information",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      logger.info("core.version called");
      const serverInfo = bootstrap.getServerInfo();
      return Promise.resolve({
        version: serverInfo.version,
        name: serverInfo.name,
      });
    },
  });
}

function registerDryRunTool(
  bootstrap: MCPServerBootstrap,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "core.dryRun",
    description: "Enable or disable dry-run mode",
    inputSchema: {
      type: "object",
      properties: {
        enabled: {
          type: "boolean",
          description: "Enable (true) or disable (false) dry-run mode",
        },
      },
      required: ["enabled"],
    },
    handler: async (args) => {
      logger.info("core.dryRun called", { args });
      const enabled = args.enabled as boolean;
      process.env.MCP_MARKETING_DRY_RUN = enabled ? "1" : "0";
      return Promise.resolve({
        dryRunEnabled: enabled,
        message: `Dry-run mode ${enabled ? "enabled" : "disabled"}`,
      });
    },
  });
}
