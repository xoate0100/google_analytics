import { describe, it, expect } from "vitest";
import {
  performPrecheck,
  PrecheckOptions,
} from "../../../src/core/precheck.js";
import { CapabilitiesRegistry } from "../../../src/core/capabilities.js";
import { createOperationEnvelope } from "../../../src/core/envelope.js";
import { PreconditionError } from "../../../src/core/errors.js";
import type { OperationTarget } from "../../../src/core/types.js";

describe("Pre-check validation", () => {
  describe("performPrecheck", () => {
    it("should check capability from registry", async () => {
      const registry = new CapabilitiesRegistry();
      registry.setProductCapabilities("ga4", {
        data_api: "v1",
        admin_api: true,
      });

      const target: OperationTarget = { product: "ga4" };
      const envelope = createOperationEnvelope({
        opName: "ga4.report.run",
        actor: "user",
        target,
        request: { args: {} },
      });

      const options: PrecheckOptions = {
        envelope,
        capabilitiesRegistry: registry,
        requiredCapability: "data_api",
      };

      const precheck = await performPrecheck(options);

      expect(precheck.capability).toBe(true);
      expect(precheck.exists).toBe(false);
      expect(precheck.conflicts).toEqual([]);
    });

    it("should fail if capability is missing", async () => {
      const registry = new CapabilitiesRegistry();
      registry.setProductCapabilities("ga4", {
        data_api: "v1",
      });

      const target: OperationTarget = { product: "ga4" };
      const envelope = createOperationEnvelope({
        opName: "ga4.report.run",
        actor: "user",
        target,
        request: { args: {} },
      });

      const options: PrecheckOptions = {
        envelope,
        capabilitiesRegistry: registry,
        requiredCapability: "admin_api",
      };

      await expect(performPrecheck(options)).rejects.toThrow(
        PreconditionError
      );
    });

    it("should check existence when existenceChecker provided", async () => {
      const registry = new CapabilitiesRegistry();
      registry.setProductCapabilities("ga4", { data_api: "v1" });

      const target: OperationTarget = {
        product: "ga4",
        propertyId: "123456789",
      };
      const envelope = createOperationEnvelope({
        opName: "ga4.property.get",
        actor: "user",
        target,
        request: { args: {} },
      });

      const existenceChecker = async (): Promise<boolean> => {
        return Promise.resolve(true);
      };

      const options: PrecheckOptions = {
        envelope,
        capabilitiesRegistry: registry,
        requiredCapability: "data_api",
        existenceChecker,
      };

      const precheck = await performPrecheck(options);
      expect(precheck.exists).toBe(true);
    });

    it("should detect conflicts when conflictChecker provided", async () => {
      const registry = new CapabilitiesRegistry();
      registry.setProductCapabilities("gtm", { accounts: [] });

      const target: OperationTarget = {
        product: "gtm",
        containerId: "GTM-XXXXX",
      };
      const envelope = createOperationEnvelope({
        opName: "gtm.create_tag",
        actor: "user",
        target,
        request: { args: { name: "Existing Tag" } },
      });

      const conflictChecker = async (): Promise<string[]> => {
        return Promise.resolve(["Tag name 'Existing Tag' already exists"]);
      };

      const options: PrecheckOptions = {
        envelope,
        capabilitiesRegistry: registry,
        requiredCapability: "accounts",
        conflictChecker,
      };

      const precheck = await performPrecheck(options);
      expect(precheck.conflicts).toEqual([
        "Tag name 'Existing Tag' already exists",
      ]);
    });

    it("should check idempotency when idempotencyChecker provided", async () => {
      const registry = new CapabilitiesRegistry();
      registry.setProductCapabilities("ga4", { data_api: "v1" });

      const target: OperationTarget = {
        product: "ga4",
        propertyId: "123456789",
      };
      const envelope = createOperationEnvelope({
        opName: "ga4.property.update",
        actor: "user",
        target,
        request: { args: { displayName: "My Property" } },
      });

      const idempotencyChecker = async (): Promise<boolean> => {
        // Simulate that current state matches request
        return Promise.resolve(true);
      };

      const options: PrecheckOptions = {
        envelope,
        capabilitiesRegistry: registry,
        requiredCapability: "data_api",
        idempotencyChecker,
      };

      const precheck = await performPrecheck(options);
      // If idempotent, should short-circuit (exists would be true)
      expect(precheck.exists).toBe(true);
    });

    it("should combine all checks", async () => {
      const registry = new CapabilitiesRegistry();
      registry.setProductCapabilities("gtm", { accounts: [] });

      const target: OperationTarget = {
        product: "gtm",
        containerId: "GTM-XXXXX",
      };
      const envelope = createOperationEnvelope({
        opName: "gtm.create_tag",
        actor: "user",
        target,
        request: { args: { name: "New Tag" } },
      });

      const existenceChecker = async (): Promise<boolean> => false;
      const conflictChecker = async (): Promise<string[]> => [];
      const idempotencyChecker = async (): Promise<boolean> => false;

      const options: PrecheckOptions = {
        envelope,
        capabilitiesRegistry: registry,
        requiredCapability: "accounts",
        existenceChecker,
        conflictChecker,
        idempotencyChecker,
      };

      const precheck = await performPrecheck(options);
      expect(precheck.capability).toBe(true);
      expect(precheck.exists).toBe(false);
      expect(precheck.conflicts).toEqual([]);
    });
  });
});

