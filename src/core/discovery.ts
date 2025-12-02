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
}

/**
 * Discover GA4 capabilities
 * Stub implementation - will probe Data API, Admin API, and Measurement Protocol
 * @param options - Discovery options
 */
export async function discoverGA4Capabilities(
  options: DiscoveryOptions
): Promise<void> {
  const { registry, logger } = options;

  logger.info("Discovering GA4 capabilities (stub)");

  // Stub implementation - will be replaced with actual API probes
  const capabilities: ProductCapabilities = {
    data_api: "v1",
    admin_api: true,
    measurement_protocol: true,
    properties: [],
  };

  registry.setProductCapabilities("ga4", capabilities);
  return Promise.resolve();
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

