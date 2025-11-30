/**
 * Capabilities registry implementation
 * Tracks available capabilities per product (ga4, gtm, ads)
 */

import type {
  ICapabilitiesRegistry,
  ProductCapabilities,
} from "./types.js";

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
    // Stub for now - will be implemented in task 1.7.2
    // This will call discovery routines per product
    return Promise.resolve();
  }
}

/**
 * Create a default capabilities registry instance
 */
export function createCapabilitiesRegistry(): ICapabilitiesRegistry {
  return new CapabilitiesRegistry();
}

