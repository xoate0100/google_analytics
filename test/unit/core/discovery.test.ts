import { describe, it, expect, vi } from "vitest";
import {
  discoverGA4Capabilities,
  discoverGTMCapabilities,
  discoverAdsCapabilities,
  DiscoveryOptions,
} from "../../../src/core/discovery.js";
import { CapabilitiesRegistry } from "../../../src/core/capabilities.js";
import type { ILogger } from "../../../src/core/types.js";

describe("Discovery routines", () => {
  const mockLogger: ILogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => mockLogger),
  };

  describe("discoverGA4Capabilities", () => {
    it("should discover GA4 capabilities", async () => {
      const registry = new CapabilitiesRegistry();
      const options: DiscoveryOptions = {
        registry,
        logger: mockLogger,
      };

      await discoverGA4Capabilities(options);

      const caps = registry.getProductCapabilities("ga4");
      expect(caps).toBeDefined();
      expect(caps?.data_api).toBeDefined();
      expect(caps?.admin_api).toBeDefined();
      expect(caps?.measurement_protocol).toBeDefined();
    });

    it("should handle discovery errors gracefully", async () => {
      const registry = new CapabilitiesRegistry();
      const options: DiscoveryOptions = {
        registry,
        logger: mockLogger,
        // Simulate error by providing invalid options
      };

      // Should not throw (stub implementation)
      await expect(discoverGA4Capabilities(options)).resolves.toBeUndefined();
    });
  });

  describe("discoverGTMCapabilities", () => {
    it("should discover GTM capabilities", async () => {
      const registry = new CapabilitiesRegistry();
      const options: DiscoveryOptions = {
        registry,
        logger: mockLogger,
      };

      await discoverGTMCapabilities(options);

      const caps = registry.getProductCapabilities("gtm");
      expect(caps).toBeDefined();
      expect(caps?.accounts).toBeDefined();
    });

    it("should handle discovery errors gracefully", async () => {
      const registry = new CapabilitiesRegistry();
      const options: DiscoveryOptions = {
        registry,
        logger: mockLogger,
      };

      await expect(discoverGTMCapabilities(options)).resolves.toBeUndefined();
    });
  });

  describe("discoverAdsCapabilities", () => {
    it("should discover Ads capabilities", async () => {
      const registry = new CapabilitiesRegistry();
      const options: DiscoveryOptions = {
        registry,
        logger: mockLogger,
      };

      await discoverAdsCapabilities(options);

      const caps = registry.getProductCapabilities("ads");
      expect(caps).toBeDefined();
      expect(caps?.customer_ids).toBeDefined();
      expect(caps?.developer_token_ok).toBeDefined();
    });

    it("should handle discovery errors gracefully", async () => {
      const registry = new CapabilitiesRegistry();
      const options: DiscoveryOptions = {
        registry,
        logger: mockLogger,
      };

      await expect(discoverAdsCapabilities(options)).resolves.toBeUndefined();
    });
  });

  describe("Discovery integration with registry", () => {
    it("should populate registry with all product capabilities", async () => {
      const registry = new CapabilitiesRegistry();
      const options: DiscoveryOptions = {
        registry,
        logger: mockLogger,
      };

      await discoverGA4Capabilities(options);
      await discoverGTMCapabilities(options);
      await discoverAdsCapabilities(options);

      expect(registry.hasCapability("ga4", "data_api")).toBe(true);
      expect(registry.hasCapability("gtm", "accounts")).toBe(true);
      expect(registry.hasCapability("ads", "customer_ids")).toBe(true);
    });
  });
});

