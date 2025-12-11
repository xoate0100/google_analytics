import { describe, it, expect, beforeEach } from "vitest";
import {
  CapabilitiesRegistry,
  createCapabilitiesRegistry,
} from "../../../src/core/capabilities.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";

describe("CapabilitiesRegistry", () => {
  let registry: ICapabilitiesRegistry;

  beforeEach(() => {
    registry = new CapabilitiesRegistry();
  });

  describe("Registry initialization", () => {
    it("should create a registry instance", () => {
      expect(registry).toBeDefined();
      expect(registry).toHaveProperty("hasCapability");
      expect(registry).toHaveProperty("getProductCapabilities");
      expect(registry).toHaveProperty("setProductCapabilities");
      expect(registry).toHaveProperty("refresh");
    });

    it("should implement ICapabilitiesRegistry interface", () => {
      expect(typeof registry.hasCapability).toBe("function");
      expect(typeof registry.getProductCapabilities).toBe("function");
      expect(typeof registry.setProductCapabilities).toBe("function");
      expect(typeof registry.refresh).toBe("function");
    });
  });

  describe("hasCapability", () => {
    it("should return false for unknown capabilities", () => {
      expect(registry.hasCapability("ga4", "data_api")).toBe(false);
      expect(registry.hasCapability("gtm", "publish")).toBe(false);
      expect(registry.hasCapability("ads", "gaql")).toBe(false);
    });

    it("should return true for registered capabilities", () => {
      registry.setProductCapabilities("ga4", {
        data_api: "v1",
        admin_api: true,
        measurement_protocol: true,
      });

      expect(registry.hasCapability("ga4", "data_api")).toBe(true);
      expect(registry.hasCapability("ga4", "admin_api")).toBe(true);
      expect(registry.hasCapability("ga4", "measurement_protocol")).toBe(true);
    });

    it("should handle nested capability paths", () => {
      registry.setProductCapabilities("ga4", {
        properties: [
          {
            id: "123456789",
            name: "My Property",
          },
        ],
      });

      // For now, we'll check if the product has the capability structure
      expect(registry.hasCapability("ga4", "properties")).toBe(true);
    });
  });

  describe("getProductCapabilities", () => {
    it("should return undefined for unknown products", () => {
      expect(registry.getProductCapabilities("unknown")).toBeUndefined();
    });

    it("should return capabilities for registered products", () => {
      const ga4Caps = {
        data_api: "v1",
        admin_api: true,
        measurement_protocol: true,
      };

      registry.setProductCapabilities("ga4", ga4Caps);
      const retrieved = registry.getProductCapabilities("ga4");

      expect(retrieved).toEqual(ga4Caps);
    });

    it("should return deep copy of capabilities", () => {
      const ga4Caps = {
        data_api: "v1",
        properties: [{ id: "123", name: "Test" }],
      };

      registry.setProductCapabilities("ga4", ga4Caps);
      const retrieved = registry.getProductCapabilities("ga4");

      expect(retrieved).not.toBe(ga4Caps); // Different reference
      expect(retrieved).toEqual(ga4Caps); // Same content
    });
  });

  describe("setProductCapabilities", () => {
    it("should set capabilities for a product", () => {
      const gtmCaps = {
        accounts: [
          {
            id: "111",
            name: "My Account",
            containers: [],
          },
        ],
      };

      registry.setProductCapabilities("gtm", gtmCaps);
      expect(registry.getProductCapabilities("gtm")).toEqual(gtmCaps);
    });

    it("should overwrite existing capabilities", () => {
      registry.setProductCapabilities("ga4", { data_api: "v1" });
      registry.setProductCapabilities("ga4", { data_api: "v1beta" });

      const caps = registry.getProductCapabilities("ga4");
      expect(caps?.data_api).toBe("v1beta");
    });

    it("should handle multiple products", () => {
      registry.setProductCapabilities("ga4", { data_api: "v1" });
      registry.setProductCapabilities("gtm", { accounts: [] });
      registry.setProductCapabilities("ads", { customer_ids: [] });

      expect(registry.hasCapability("ga4", "data_api")).toBe(true);
      expect(registry.hasCapability("gtm", "accounts")).toBe(true);
      expect(registry.hasCapability("ads", "customer_ids")).toBe(true);
    });
  });

  describe("refresh", () => {
    it("should call discovery routines for all products", async () => {
      await registry.refresh();

      // Should have populated capabilities for all products
      expect(registry.hasCapability("ga4", "data_api")).toBe(true);
      expect(registry.hasCapability("gtm", "accounts")).toBe(true);
      expect(registry.hasCapability("ads", "customer_ids")).toBe(true);
    });
  });

  describe("createCapabilitiesRegistry", () => {
    it("should create a registry instance", () => {
      const reg = createCapabilitiesRegistry();
      expect(reg).toBeDefined();
      expect(reg).toHaveProperty("hasCapability");
    });
  });
});
