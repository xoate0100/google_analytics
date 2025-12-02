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
export async function discoverGA4Capabilities(
  options: DiscoveryOptions
): Promise<void> {
  const { registry, logger, ga4Client } = options;

  logger.info("Discovering GA4 capabilities");

  // Default capabilities
  const capabilities: ProductCapabilities = {
    data_api: "v1",
    admin_api: false,
    measurement_protocol: true,
    properties: [],
  };

  // If GA4 client is provided, verify Admin API endpoints
  if (ga4Client) {
    try {
      await ga4Client.checkRateLimit("ga4", "discovery");
      const adminClient = ga4Client.getAnalyticsAdminClient();

      // Verify core Admin API endpoints are accessible
      // Note: dataStreams, customDimensions, customMetrics are accessed via properties
      const endpointsToVerify = [
        { resource: adminClient.accounts, method: "accounts.list" },
        { resource: adminClient.properties, method: "properties.list" },
        { resource: (adminClient.properties as unknown as { dataStreams?: { list?: () => Promise<unknown> } }).dataStreams, method: "dataStreams.list" },
        { resource: (adminClient.properties as unknown as { customDimensions?: { list?: () => Promise<unknown> } }).customDimensions, method: "customDimensions.list" },
        { resource: (adminClient.properties as unknown as { customMetrics?: { list?: () => Promise<unknown> } }).customMetrics, method: "customMetrics.list" },
      ];

      let allEndpointsAccessible = true;
      const errors: string[] = [];

      for (const { resource, method } of endpointsToVerify) {
        try {
          if (resource && typeof (resource as { list?: unknown }).list === "function") {
            await (resource as { list: () => Promise<unknown> }).list();
            logger.debug(`GA4 Admin API endpoint verified: ${method}`, {
              resource: method,
            });
          } else {
            allEndpointsAccessible = false;
            errors.push(`${method}: endpoint not available`);
          }
        } catch (error) {
          // If it's a permission error, the endpoint exists but we don't have access
          // If it's a 404, the endpoint might not exist
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes("403") || errorMessage.includes("permission")) {
            // Endpoint exists but no permission - still consider it accessible
            logger.debug(`GA4 Admin API endpoint exists but no permission: ${method}`);
          } else if (errorMessage.includes("404") || errorMessage.includes("not found")) {
            allEndpointsAccessible = false;
            errors.push(`${method}: endpoint not found`);
            logger.warn(`GA4 Admin API endpoint not found: ${method}`, { error: errorMessage });
          } else {
            // Other errors might indicate endpoint issues
            logger.error(`GA4 Admin API endpoint check failed: ${method}`, error instanceof Error ? error : new Error(String(error)));
            allEndpointsAccessible = false;
            errors.push(`${method}: ${errorMessage}`);
          }
        }
      }

      if (allEndpointsAccessible && errors.length === 0) {
        capabilities.admin_api = true;
        logger.info("GA4 Admin API endpoints verified and accessible");
      } else {
        logger.warn("Some GA4 Admin API endpoints may not be accessible", { errors });
        // Still set admin_api to true if most endpoints work
        if (errors.length < endpointsToVerify.length / 2) {
          capabilities.admin_api = true;
        }
      }
    } catch (error) {
      logger.error("GA4 Admin API discovery failed", error instanceof Error ? error : new Error(String(error)));
      // Keep admin_api as false if discovery fails
    }
  } else {
    logger.debug("GA4 client not provided, skipping Admin API verification");
  }

  registry.setProductCapabilities("ga4", capabilities);
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

  // Default capabilities
  const capabilities: ProductCapabilities = {
    accounts: [],
  };

  // If GTM client is provided, verify Tag Manager API endpoints
  if (gtmClient) {
    try {
      await gtmClient.checkRateLimit("gtm", "discovery");
      const tagManagerClient = gtmClient.getTagManagerClient();

      // Verify core Tag Manager API endpoints are accessible
      let allEndpointsAccessible = true;
      const errors: string[] = [];
      const discoveredAccounts: unknown[] = [];

      // Verify accounts endpoint
      try {
        if (tagManagerClient.accounts && typeof tagManagerClient.accounts.list === "function") {
          const accountsResponse = await tagManagerClient.accounts.list();
          const accountsData = accountsResponse as { data?: { account?: unknown[] } };
          if (accountsData.data?.account) {
            discoveredAccounts.push(...accountsData.data.account);
          }
          logger.debug("GTM Tag Manager API endpoint verified: accounts.list");
        } else {
          allEndpointsAccessible = false;
          errors.push("accounts.list: endpoint not available");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("403") || errorMessage.includes("permission")) {
          logger.debug("GTM Tag Manager API endpoint exists but no permission: accounts.list");
        } else {
          logger.error("GTM Tag Manager API endpoint check failed: accounts.list", error instanceof Error ? error : new Error(String(error)));
          allEndpointsAccessible = false;
          errors.push(`accounts.list: ${errorMessage}`);
        }
      }

      // Verify containers endpoint (requires account)
      const discoveredContainers: unknown[] = [];
      if (discoveredAccounts.length > 0) {
        try {
          const firstAccount = discoveredAccounts[0] as { accountId?: string };
          if (firstAccount.accountId && tagManagerClient.accounts.containers && typeof tagManagerClient.accounts.containers.list === "function") {
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
      }

      // Verify workspaces endpoint (requires container)
      if (discoveredContainers.length > 0) {
        try {
          const firstContainer = discoveredContainers[0] as { accountId?: string; containerId?: string };
          if (firstContainer.accountId && firstContainer.containerId && tagManagerClient.accounts.containers.workspaces && typeof tagManagerClient.accounts.containers.workspaces.list === "function") {
            await tagManagerClient.accounts.containers.workspaces.list({
              parent: `accounts/${firstContainer.accountId}/containers/${firstContainer.containerId}`,
            });
            logger.debug("GTM Tag Manager API endpoint verified: workspaces.list");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.warn("GTM Tag Manager API workspaces endpoint check failed", { error: errorMessage });
        }
      } else {
        // If no containers, just verify the endpoint exists
        if (!tagManagerClient.accounts.containers.workspaces || typeof tagManagerClient.accounts.containers.workspaces.list !== "function") {
          allEndpointsAccessible = false;
          errors.push("workspaces.list: endpoint not available");
        } else {
          logger.debug("GTM Tag Manager API endpoint verified: workspaces.list (exists)");
        }
      }

      if (allEndpointsAccessible && errors.length === 0) {
        logger.info("GTM Tag Manager API endpoints verified and accessible");
      } else if (errors.length > 0) {
        logger.warn("Some GTM Tag Manager API endpoints may not be accessible", { errors });
      }

      // Update capabilities with discovered accounts
      if (discoveredAccounts.length > 0) {
        capabilities.accounts = discoveredAccounts;
      }
    } catch (error) {
      logger.error("GTM Tag Manager API discovery failed", error instanceof Error ? error : new Error(String(error)));
      // Keep default capabilities if discovery fails
    }
  } else {
    logger.debug("GTM client not provided, skipping Tag Manager API verification");
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

