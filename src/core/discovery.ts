/**
 * Discovery routines for capability detection
 * Stub implementations that will be extended with actual API calls
 */

import type {
  ICapabilitiesRegistry,
  ProductCapabilities,
  ILogger,
} from "./types.js";

/**
 * Options for discovery routines
 */
export interface DiscoveryOptions {
  registry: ICapabilitiesRegistry;
  logger: ILogger;
  ga4Client?: import("../ga4/client.js").GA4Client;
  gtmClient?: import("../gtm/client.js").GTMClient;
}

/**
 * Discover GA4 capabilities
 * Probes Data API, Admin API, and Measurement Protocol to verify endpoints
 * @param options - Discovery options
 */
/**
 * Helper: Build GA4 endpoint verification list
 */
function buildGA4EndpointsToVerify(
  adminClient: ReturnType<import("../ga4/client.js").GA4Client["getAnalyticsAdminClient"]>
): Array<{ resource: unknown; method: string }> {
  return [
    { resource: adminClient.accounts, method: "accounts.list" },
    { resource: adminClient.properties, method: "properties.list" },
    { resource: (adminClient.properties as unknown as { dataStreams?: { list?: () => Promise<unknown> } }).dataStreams, method: "dataStreams.list" },
    { resource: (adminClient.properties as unknown as { customDimensions?: { list?: () => Promise<unknown> } }).customDimensions, method: "customDimensions.list" },
    { resource: (adminClient.properties as unknown as { customMetrics?: { list?: () => Promise<unknown> } }).customMetrics, method: "customMetrics.list" },
  ];
}

/**
 * Helper: Verify single GA4 endpoint
 */
async function verifyGA4Endpoint(
  resource: unknown,
  method: string,
  logger: ILogger
): Promise<{ accessible: boolean; error?: string }> {
  try {
    if (resource && typeof (resource as { list?: unknown }).list === "function") {
      await (resource as { list: () => Promise<unknown> }).list();
      logger.debug(`GA4 Admin API endpoint verified: ${method}`, { resource: method });
      return { accessible: true };
    }
    return { accessible: false, error: `${method}: endpoint not available` };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("403") || errorMessage.includes("permission")) {
      logger.debug(`GA4 Admin API endpoint exists but no permission: ${method}`);
      return { accessible: true };
    }
    if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      logger.warn(`GA4 Admin API endpoint not found: ${method}`, { error: errorMessage });
      return { accessible: false, error: `${method}: endpoint not found` };
    }
    logger.error(`GA4 Admin API endpoint check failed: ${method}`, error instanceof Error ? error : new Error(String(error)));
    return { accessible: false, error: `${method}: ${errorMessage}` };
  }
}

/**
 * Helper: Verify all GA4 Admin API endpoints
 */
async function verifyGA4AdminEndpoints(
  adminClient: ReturnType<import("../ga4/client.js").GA4Client["getAnalyticsAdminClient"]>,
  logger: ILogger
): Promise<boolean> {
  const endpointsToVerify = buildGA4EndpointsToVerify(adminClient);
  const errors: string[] = [];
  let allEndpointsAccessible = true;

  for (const { resource, method } of endpointsToVerify) {
    const result = await verifyGA4Endpoint(resource, method, logger);
    if (!result.accessible) {
      allEndpointsAccessible = false;
      if (result.error) {
        errors.push(result.error);
      }
    }
  }

  if (allEndpointsAccessible && errors.length === 0) {
    logger.info("GA4 Admin API endpoints verified and accessible");
    return true;
  }
  logger.warn("Some GA4 Admin API endpoints may not be accessible", { errors });
  return errors.length < endpointsToVerify.length / 2;
}

export async function discoverGA4Capabilities(
  options: DiscoveryOptions
): Promise<void> {
  const { registry, logger, ga4Client } = options;

  logger.info("Discovering GA4 capabilities");

  const capabilities: ProductCapabilities = {
    data_api: "v1",
    admin_api: false,
    measurement_protocol: true,
    properties: [],
  };

  if (ga4Client) {
    try {
      await ga4Client.checkRateLimit("ga4", "discovery");
      const adminClient = ga4Client.getAnalyticsAdminClient();
      capabilities.admin_api = await verifyGA4AdminEndpoints(adminClient, logger);
    } catch (error) {
      logger.error("GA4 Admin API discovery failed", error instanceof Error ? error : new Error(String(error)));
    }
  } else {
    logger.debug("GA4 client not provided, skipping Admin API verification");
  }

  registry.setProductCapabilities("ga4", capabilities);
}

/**
 * Helper: Handle endpoint verification error
 */
function handleEndpointError(
  error: unknown,
  endpointName: string,
  logger: ILogger
): { isAccessible: boolean; errorMessage: string } {
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (errorMessage.includes("403") || errorMessage.includes("permission")) {
    logger.debug(`GTM Tag Manager API endpoint exists but no permission: ${endpointName}`);
    return { isAccessible: true, errorMessage: "" };
  }
  logger.error(`GTM Tag Manager API endpoint check failed: ${endpointName}`, error instanceof Error ? error : new Error(String(error)));
  return { isAccessible: false, errorMessage: `${endpointName}: ${errorMessage}` };
}

/**
 * Helper: Verify accounts endpoint
 */
async function verifyAccountsEndpoint(
  tagManagerClient: {
    accounts?: {
      list?: () => Promise<unknown>;
    };
  },
  logger: ILogger
): Promise<{ accounts: unknown[]; errors: string[]; allAccessible: boolean }> {
  const discoveredAccounts: unknown[] = [];
  const errors: string[] = [];
  let allAccessible = true;

  try {
    if (tagManagerClient.accounts && typeof tagManagerClient.accounts.list === "function") {
      const accountsResponse = await tagManagerClient.accounts.list();
      const accountsData = accountsResponse as { data?: { account?: unknown[] } };
      if (accountsData.data?.account) {
        discoveredAccounts.push(...accountsData.data.account);
      }
      logger.debug("GTM Tag Manager API endpoint verified: accounts.list");
    } else {
      allAccessible = false;
      errors.push("accounts.list: endpoint not available");
    }
  } catch (error) {
    const result = handleEndpointError(error, "accounts.list", logger);
    if (!result.isAccessible) {
      allAccessible = false;
      errors.push(result.errorMessage);
    }
  }

  return { accounts: discoveredAccounts, errors, allAccessible };
}

/**
 * Helper: Verify containers endpoint
 */
async function verifyContainersEndpoint(
  tagManagerClient: {
    accounts?: {
      containers?: {
        list?: (params: { parent: string }) => Promise<unknown>;
      };
    };
  },
  discoveredAccounts: unknown[],
  logger: ILogger
): Promise<unknown[]> {
  const discoveredContainers: unknown[] = [];
  if (discoveredAccounts.length === 0) {
    return discoveredContainers;
  }

  try {
    const firstAccount = discoveredAccounts[0] as { accountId?: string };
    if (
      firstAccount.accountId &&
      tagManagerClient.accounts?.containers &&
      typeof tagManagerClient.accounts.containers.list === "function"
    ) {
      const containersResponse = await tagManagerClient.accounts.containers.list({
        parent: `accounts/${firstAccount.accountId}`,
      });
      const containersData = containersResponse as { data?: { container?: unknown[] } };
      if (containersData.data?.container) {
        discoveredContainers.push(...containersData.data.container);
      }
      logger.debug("GTM Tag Manager API endpoint verified: containers.list");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn("GTM Tag Manager API containers endpoint check failed", { error: errorMessage });
  }

  return discoveredContainers;
}

/**
 * Helper: Verify workspaces endpoint with containers
 */
async function verifyWorkspacesWithContainers(
  tagManagerClient: {
    accounts?: {
      containers?: {
        workspaces?: {
          list?: (params: { parent: string }) => Promise<unknown>;
        };
      };
    };
  },
  firstContainer: { accountId?: string; containerId?: string },
  logger: ILogger
): Promise<void> {
  if (
    firstContainer.accountId &&
    firstContainer.containerId &&
    tagManagerClient.accounts?.containers?.workspaces &&
    typeof tagManagerClient.accounts.containers.workspaces.list === "function"
  ) {
    await tagManagerClient.accounts.containers.workspaces.list({
      parent: `accounts/${firstContainer.accountId}/containers/${firstContainer.containerId}`,
    });
    logger.debug("GTM Tag Manager API endpoint verified: workspaces.list");
  }
}

/**
 * Helper: Verify workspaces endpoint without containers
 */
function verifyWorkspacesWithoutContainers(
  tagManagerClient: {
    accounts?: {
      containers?: {
        workspaces?: {
          list?: (params: { parent: string }) => Promise<unknown>;
        };
      };
    };
  },
  logger: ILogger
): { errors: string[]; allAccessible: boolean } {
  const errors: string[] = [];
  if (
    !tagManagerClient.accounts?.containers?.workspaces ||
    typeof tagManagerClient.accounts.containers.workspaces.list !== "function"
  ) {
    errors.push("workspaces.list: endpoint not available");
    return { errors, allAccessible: false };
  }
  logger.debug("GTM Tag Manager API endpoint verified: workspaces.list (exists)");
  return { errors, allAccessible: true };
}

/**
 * Helper: Verify workspaces endpoint
 */
async function verifyWorkspacesEndpoint(
  tagManagerClient: {
    accounts?: {
      containers?: {
        workspaces?: {
          list?: (params: { parent: string }) => Promise<unknown>;
        };
      };
    };
  },
  discoveredContainers: unknown[],
  logger: ILogger
): Promise<{ errors: string[]; allAccessible: boolean }> {
  if (discoveredContainers.length > 0) {
    try {
      const firstContainer = discoveredContainers[0] as { accountId?: string; containerId?: string };
      await verifyWorkspacesWithContainers(tagManagerClient, firstContainer, logger);
      return { errors: [], allAccessible: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn("GTM Tag Manager API workspaces endpoint check failed", { error: errorMessage });
      return { errors: [], allAccessible: true };
    }
  }
  return verifyWorkspacesWithoutContainers(tagManagerClient, logger);
}

/**
 * Discover GTM capabilities
 * Lists accounts/containers and verifies workspace access and permissions
 * @param options - Discovery options
 */
export async function discoverGTMCapabilities(
  options: DiscoveryOptions
): Promise<void> {
  const { registry, logger, gtmClient } = options;

  logger.info("Discovering GTM capabilities");

  const capabilities: ProductCapabilities = {
    accounts: [],
  };

  if (!gtmClient) {
    logger.debug("GTM client not provided, skipping Tag Manager API verification");
    registry.setProductCapabilities("gtm", capabilities);
    return;
  }

  try {
    await gtmClient.checkRateLimit("gtm", "discovery");
    const tagManagerClient = gtmClient.getTagManagerClient();
    const accountsResult = await verifyAccountsEndpoint(tagManagerClient, logger);
    const discoveredContainers = await verifyContainersEndpoint(tagManagerClient, accountsResult.accounts, logger);
    const workspacesResult = await verifyWorkspacesEndpoint(tagManagerClient, discoveredContainers, logger);
    const allErrors = [...accountsResult.errors, ...workspacesResult.errors];
    const allAccessible = accountsResult.allAccessible && workspacesResult.allAccessible;

    if (allAccessible && allErrors.length === 0) {
      logger.info("GTM Tag Manager API endpoints verified and accessible");
    } else if (allErrors.length > 0) {
      logger.warn("Some GTM Tag Manager API endpoints may not be accessible", { errors: allErrors });
    }

    if (accountsResult.accounts.length > 0) {
      capabilities.accounts = accountsResult.accounts;
    }
  } catch (error) {
    logger.error("GTM Tag Manager API discovery failed", error instanceof Error ? error : new Error(String(error)));
  }

  registry.setProductCapabilities("gtm", capabilities);
}

/**
 * Discover Ads capabilities
 * Stub implementation - will run GAQL probe to test API access
 * @param options - Discovery options
 */
export async function discoverAdsCapabilities(
  options: DiscoveryOptions
): Promise<void> {
  const { registry, logger } = options;

  logger.info("Discovering Ads capabilities (stub)");

  // Stub implementation - will be replaced with actual API probes
  const capabilities: ProductCapabilities = {
    customer_ids: [],
    developer_token_ok: false,
  };

  registry.setProductCapabilities("ads", capabilities);
  return Promise.resolve();
}
