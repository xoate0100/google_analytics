/**
 * MCP Google Marketing Ops Server
 * Main entry point for the MCP server
 */

import { MCPServerBootstrap } from "./server/bootstrap.js";
import { PinoLogger } from "./core/logger.js";
import { LRUCache } from "./core/cache.js";
import { TokenBucketLimiter } from "./core/limiter.js";
import { CapabilitiesRegistry } from "./core/capabilities.js";
import { OAuthClient } from "./core/oauth.js";
import { TokenStorage } from "./core/token-storage.js";
import { GA4Client } from "./ga4/client.js";
import { GTMClient } from "./gtm/client.js";
import { AdsClient } from "./ads/client.js";
import { registerCoreUtilityTools } from "./server/tools.js";
import { registerGA4Tools } from "./ga4/tools.js";
import { registerGTMTools } from "./gtm/tools.js";
import { registerAdsTools } from "./ads/tools.js";
import { registerWorkflowTools } from "./workflows/index.js";
import type { ILogger } from "./core/types.js";

/**
 * Initialize core components (cache, rate limiter, capabilities)
 */
function initializeCoreComponents(): {
  cache: LRUCache;
  rateLimiter: TokenBucketLimiter;
  capabilitiesRegistry: CapabilitiesRegistry;
} {
  const cache = new LRUCache({
    maxSize: 1000,
    defaultTTL: 300000,
  });

  const rateLimiter = new TokenBucketLimiter({
    defaultQPS: 50,
    defaultBurst: 5,
    productLimits: {
      ga4: { qps: 100, burst: 10 },
      gtm: { qps: 50, burst: 5 },
      ads: { qps: 50, burst: 5 },
    },
  });

  const capabilitiesRegistry = new CapabilitiesRegistry();

  return { cache, rateLimiter, capabilitiesRegistry };
}

/**
 * Initialize OAuth client and token storage
 */
function initializeAuthComponents(logger: ILogger): {
  oauthClient: OAuthClient;
  tokenStorage: TokenStorage;
} {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required"
    );
  }

  const oauthClient = new OAuthClient({
    clientId,
    clientSecret,
    logger,
  });

  const credentialsPath =
    process.env.MCP_CREDENTIALS_PATH || "~/.mcp/google/credentials.enc.json";
  const encryptionKey =
    process.env.MCP_ENCRYPTION_KEY || process.env.GOOGLE_CLIENT_SECRET;

  if (!encryptionKey) {
    throw new Error(
      "MCP_ENCRYPTION_KEY or GOOGLE_CLIENT_SECRET environment variable is required"
    );
  }

  const tokenStorage = new TokenStorage({
    credentialsPath,
    encryptionKey,
    logger,
  });

  return { oauthClient, tokenStorage };
}

/**
 * Initialize API clients
 */
function initializeAPIClients(
  logger: ILogger,
  rateLimiter: TokenBucketLimiter,
  oauthClient: OAuthClient
): {
  ga4Client: GA4Client;
  gtmClient: GTMClient;
  adsClient: AdsClient | undefined;
} {
  const ga4Client = new GA4Client({
    logger,
    rateLimiter,
    oauthClient,
  });

  const gtmClient = new GTMClient({
    logger,
    rateLimiter,
    oauthClient,
  });

  const developerToken = process.env.GOOGLE_ADS_DEV_TOKEN;
  if (!developerToken) {
    logger.warn("GOOGLE_ADS_DEV_TOKEN not set, Ads tools will not be available");
  }

  const loginCustomerId = process.env.LOGIN_CUSTOMER_ID;
  const adsClient = developerToken
    ? new AdsClient({
        logger,
        rateLimiter,
        oauthClient,
        developerToken,
        ...(loginCustomerId ? { loginCustomerId } : {}),
      })
    : undefined;

  return { ga4Client, gtmClient, adsClient };
}

/**
 * Options for registering all tools
 */
interface RegisterAllToolsOptions {
  bootstrap: MCPServerBootstrap;
  cache: LRUCache;
  capabilitiesRegistry: CapabilitiesRegistry;
  oauthClient: OAuthClient;
  tokenStorage: TokenStorage;
  ga4Client: GA4Client;
  gtmClient: GTMClient;
  adsClient: AdsClient | undefined;
  logger: ILogger;
}

/**
 * Register core and product tools
 */
function registerProductTools(options: RegisterAllToolsOptions): void {
  const { bootstrap, cache, capabilitiesRegistry, ga4Client, gtmClient, adsClient, logger } = options;

  registerGA4Tools({
    bootstrap,
    ga4Client,
    cache,
    capabilitiesRegistry,
    logger,
  });

  registerGTMTools({
    bootstrap,
    gtmClient,
    cache,
    capabilitiesRegistry,
    logger,
  });

  if (adsClient) {
    registerAdsTools(
      bootstrap,
      adsClient,
      cache,
      capabilitiesRegistry,
      logger
    );
  }
}

/**
 * Register workflow tools if Ads client is available
 */
function registerWorkflowToolsIfAvailable(options: RegisterAllToolsOptions): void {
  const { bootstrap, ga4Client, adsClient, cache, capabilitiesRegistry, logger } = options;

  if (adsClient) {
    registerWorkflowTools({
      bootstrap,
      ga4Client,
      adsClient,
      cache,
      capabilitiesRegistry,
      logger,
    });
  } else {
    logger.warn("Skipping workflow tools registration (Ads client not available)");
  }
}

/**
 * Register all tools with the bootstrap
 */
function registerAllTools(options: RegisterAllToolsOptions): void {
  const { bootstrap, capabilitiesRegistry, oauthClient, tokenStorage, logger } = options;

  logger.info("Registering tools");

  registerCoreUtilityTools({
    bootstrap,
    capabilitiesRegistry,
    oauthClient,
    tokenStorage,
    logger,
  });

  registerProductTools(options);
  registerWorkflowToolsIfAvailable(options);
}

/**
 * Initialize all server components
 */
function initializeServer(): {
  bootstrap: MCPServerBootstrap;
  logger: ILogger;
} {
  const logLevel = (process.env.LOG_LEVEL as "debug" | "info" | "warn" | "error") || "info";
  const logger: ILogger = new PinoLogger({ level: logLevel });

  logger.info("Initializing MCP Google Marketing Ops Server");

  const { cache, rateLimiter, capabilitiesRegistry } =
    initializeCoreComponents();
  const { oauthClient, tokenStorage } = initializeAuthComponents(logger);
  const { ga4Client, gtmClient, adsClient } = initializeAPIClients(
    logger,
    rateLimiter,
    oauthClient
  );

  const bootstrap = new MCPServerBootstrap({
    name: "mcp-google-marketing",
    version: "0.1.0",
    logger,
  });
  bootstrap.initialize();

  registerAllTools({
    bootstrap,
    cache,
    capabilitiesRegistry,
    oauthClient,
    tokenStorage,
    ga4Client,
    gtmClient,
    adsClient,
    logger,
  });

  const toolCount = bootstrap.getRegisteredTools().size;
  logger.info(`Server initialized with ${toolCount} tools`);

  return { bootstrap, logger };
}

/**
 * Start the MCP server
 */
async function startServer(): Promise<void> {
  try {
    const { bootstrap, logger } = initializeServer();

    logger.info("Starting MCP server");
    await bootstrap.start();

    logger.info("MCP server started and ready");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`Failed to start server: ${errorMessage}`);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

export { startServer, initializeServer };
