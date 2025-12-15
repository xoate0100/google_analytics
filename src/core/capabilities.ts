/**
 * Capabilities registry implementation
 * Tracks available capabilities per product (ga4, gtm, ads)
 */

import type {
  ICapabilitiesRegistry,
  ProductCapabilities,
  ILogger,
} from "./types.js";
import {
  discoverGA4Capabilities,
  discoverGTMCapabilities,
  discoverAdsCapabilities,
} from "./discovery.js";

/**
 * Capabilities registry implementation
 * Stores and queries product capabilities
 */
export class CapabilitiesRegistry implements ICapabilitiesRegistry {
  private readonly capabilities: Map<string, ProductCapabilities>;

  constructor() {
    this.capabilities = new Map();
  }

  hasCapability(product: string, capability: string): boolean {
    const productCaps = this.capabilities.get(product);
    if (!productCaps) {
      return false;
    }

    // Check if capability exists in the product capabilities
    return capability in productCaps;
  }

  getProductCapabilities(
    product: string
  ): ProductCapabilities | undefined {
    const caps = this.capabilities.get(product);
    if (!caps) {
      return undefined;
    }

    // Return deep copy to prevent external mutation
    return JSON.parse(JSON.stringify(caps)) as ProductCapabilities;
  }

  setProductCapabilities(
    product: string,
    capabilities: ProductCapabilities
  ): void {
    // Store deep copy to prevent external mutation
    this.capabilities.set(
      product,
      JSON.parse(JSON.stringify(capabilities)) as ProductCapabilities
    );
  }

  async refresh(): Promise<void> {
    // Call discovery routines per product
    // Use a minimal logger for discovery
    const discoveryLogger = {
      info: () => {},
      debug: () => {},
      warn: () => {},
      error: () => {},
      child: () => discoveryLogger,
    } as ILogger;

    await discoverGA4Capabilities({
      registry: this,
      logger: discoveryLogger,
    });
    await discoverGTMCapabilities({
      registry: this,
      logger: discoveryLogger,
    });
    await discoverAdsCapabilities({
      registry: this,
      logger: discoveryLogger,
    });
  }
}

/**
 * Create a default capabilities registry instance
 */
export function createCapabilitiesRegistry(): ICapabilitiesRegistry {
  return new CapabilitiesRegistry();
}
