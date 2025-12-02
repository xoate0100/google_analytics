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
 * Stub implementation - will list accounts/containers and test publish permissions
 * @param options - Discovery options
 */
export async function discoverGTMCapabilities(
  options: DiscoveryOptions
): Promise<void> {
  const { registry, logger } = options;

  logger.info("Discovering GTM capabilities (stub)");

  // Stub implementation - will be replaced with actual API probes
  const capabilities: ProductCapabilities = {
    accounts: [],
  };

  registry.setProductCapabilities("gtm", capabilities);
  return Promise.resolve();
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

