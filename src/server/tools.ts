/**
 * Core utility tools registration
 * Registers auth, capabilities, and core utility tools with the MCP server
 */

import type { MCPServerBootstrap } from "./bootstrap.js";
import type { ILogger, ICapabilitiesRegistry } from "../core/types.js";
import type { OAuthClient, TokenInfo } from "../core/oauth.js";
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
  oauthClient: OAuthClient,
  tokenStorage: TokenStorage,
  logger: ILogger
): void {
  registerAuthLoginTool(bootstrap, oauthClient, tokenStorage, logger);
  registerAuthRotateTool(bootstrap, oauthClient, tokenStorage, logger);
  registerAuthStatusTool(bootstrap, tokenStorage, logger);
}

/**
 * Start device flow and return user instructions
 */
async function startDeviceFlowWithInstructions(
  oauthClient: OAuthClient,
  logger: ILogger
): Promise<{
  userCode: string;
  verificationUrl: string;
  deviceCode: string;
  expiresIn: number;
  message: string;
}> {
  const scopes = oauthClient.getDefaultScopes();
  const deviceFlow = await oauthClient.startDeviceFlow(scopes);

  logger.info("Device flow started", {
    userCode: deviceFlow.userCode,
    expiresIn: deviceFlow.expiresIn,
  });

  return {
    userCode: deviceFlow.userCode,
    verificationUrl: deviceFlow.verificationUrl,
    deviceCode: deviceFlow.deviceCode,
    expiresIn: deviceFlow.expiresIn,
    message: `Please visit ${deviceFlow.verificationUrl} and enter code: ${deviceFlow.userCode}`,
  };
}

/**
 * Update polling interval based on error
 */
function updatePollingInterval(
  error: unknown,
  currentInterval: number
): number {
  const errorObj = error as {
    context?: { retryAfter?: number; error?: string };
  };
  const errorCode = errorObj.context?.error;

  if (errorCode === "authorization_pending" && errorObj.context?.retryAfter) {
    return errorObj.context.retryAfter;
  }
  if (errorCode === "slow_down" && errorObj.context?.retryAfter) {
    return errorObj.context.retryAfter;
  }

  return currentInterval;
}

/**
 * Poll for tokens with exponential backoff
 */
async function pollForTokensWithRetry(
  oauthClient: OAuthClient,
  deviceCode: string,
  interval: number,
  maxAttempts: number,
  logger: ILogger
): Promise<TokenInfo> {
  let attempt = 0;
  let currentInterval = interval;

  while (attempt < maxAttempts) {
    try {
      return await oauthClient.pollForTokens(deviceCode, currentInterval);
    } catch (error) {
      const errorObj = error as { context?: { error?: string } };
      if (errorObj.context?.error === "expired_token") {
        throw error;
      }

      currentInterval = updatePollingInterval(error, currentInterval);
      attempt++;

      if (attempt >= maxAttempts) {
        throw error;
      }

      logger.info("Polling for tokens, attempt", { attempt, currentInterval });
      await new Promise((resolve) =>
        setTimeout(resolve, currentInterval * 1000)
      );
    }
  }

  throw new Error("Max polling attempts reached");
}

/**
 * Handle token polling and storage
 */
async function handleTokenPolling(
  oauthClient: OAuthClient,
  tokenStorage: TokenStorage,
  deviceCode: string,
  logger: ILogger
): Promise<{ message: string; authenticated: boolean }> {
  const tokens: TokenInfo = await pollForTokensWithRetry(
    oauthClient,
    deviceCode,
    5,
    60,
    logger
  );

  const credentials: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    scopes?: string[];
  } = {
    accessToken: tokens.accessToken,
  };

  if (tokens.refreshToken) {
    credentials.refreshToken = tokens.refreshToken;
  }
  if (tokens.expiresAt !== undefined) {
    credentials.expiresAt = tokens.expiresAt;
  }
  if (tokens.scopes !== undefined) {
    credentials.scopes = tokens.scopes;
  }

  await tokenStorage.storeTokens("google", credentials);

  logger.info("Authentication successful, tokens stored");
  return {
    message: "Authentication successful! Tokens have been stored.",
    authenticated: true,
  };
}

/**
 * Handle device flow initiation
 */
async function handleDeviceFlowInitiation(
  oauthClient: OAuthClient,
  logger: ILogger
): Promise<{
  userCode: string;
  verificationUrl: string;
  deviceCode: string;
  expiresIn: number;
  message: string;
  nextStep: string;
}> {
  const instructions = await startDeviceFlowWithInstructions(
    oauthClient,
    logger
  );

  return {
    ...instructions,
    nextStep:
      "After authorizing, call auth.login again with deviceCode parameter",
  };
}

function registerAuthLoginTool(
  bootstrap: MCPServerBootstrap,
  oauthClient: OAuthClient,
  tokenStorage: TokenStorage,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "auth.login",
    description: "Authenticate with Google services using OAuth device flow",
    inputSchema: {
      type: "object",
      properties: {
        deviceCode: {
          type: "string",
          description:
            "Optional device code from previous auth.login call to poll for tokens",
        },
      },
    },
    handler: async (args) => {
      logger.info("auth.login called", { hasDeviceCode: !!args.deviceCode });

      try {
        if (args.deviceCode) {
          return await handleTokenPolling(
            oauthClient,
            tokenStorage,
            args.deviceCode as string,
            logger
          );
        }

        return await handleDeviceFlowInitiation(oauthClient, logger);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(`Authentication failed: ${errorMessage}`);
        throw error;
      }
    },
  });
}

function registerAuthRotateTool(
  bootstrap: MCPServerBootstrap,
  _oauthClient: OAuthClient,
  _tokenStorage: TokenStorage,
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
