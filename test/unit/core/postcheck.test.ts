import { describe, it, expect } from "vitest";
import {
  performPostcheck,
  PostcheckOptions,
  executeRollback,
} from "../../../src/core/postcheck.js";
import { createOperationEnvelope } from "../../../src/core/envelope.js";
import type { OperationTarget } from "../../../src/core/types.js";

describe("Post-check validation and rollback", () => {
  describe("performPostcheck", () => {
    it("should perform read-back verification", async () => {
      const target: OperationTarget = { product: "ga4", propertyId: "123" };
      const envelope = createOperationEnvelope({
        opName: "ga4.property.update",
        actor: "user",
        target,
        request: { args: { displayName: "Updated Property" } },
      });

      const readBackChecker = async (): Promise<unknown> => {
        return Promise.resolve({ displayName: "Updated Property" });
      };

      const stateMatcher = async (
        expected: unknown,
        actual: unknown
      ): Promise<boolean> => {
        return JSON.stringify(expected) === JSON.stringify(actual);
      };

      const options: PostcheckOptions = {
        envelope,
        readBackChecker,
        stateMatcher,
        expectedState: { displayName: "Updated Property" },
      };

      const postcheck = await performPostcheck(options);

      expect(postcheck.readBack).toBe(true);
      expect(postcheck.stateMatch).toBe(true);
      expect(postcheck.discrepancies).toBeUndefined();
    });

    it("should detect state mismatch", async () => {
      const target: OperationTarget = { product: "gtm", containerId: "GTM-123" };
      const envelope = createOperationEnvelope({
        opName: "gtm.create_tag",
        actor: "user",
        target,
        request: { args: { name: "New Tag", type: "GA4_CONFIG" } },
      });

      const readBackChecker = async (): Promise<unknown> => {
        return Promise.resolve({
          name: "New Tag",
          type: "GA4_EVENT", // Mismatch!
        });
      };

      const stateMatcher = async (
        expected: unknown,
        actual: unknown
      ): Promise<{ match: boolean; discrepancies: string[] }> => {
        const exp = expected as { name: string; type: string };
        const act = actual as { name: string; type: string };
        const discrepancies: string[] = [];

        if (exp.type !== act.type) {
          discrepancies.push(
            `Type mismatch: expected '${exp.type}', got '${act.type}'`
          );
        }

        return {
          match: discrepancies.length === 0,
          discrepancies,
        };
      };

      const options: PostcheckOptions = {
        envelope,
        readBackChecker,
        stateMatcher,
        expectedState: { name: "New Tag", type: "GA4_CONFIG" },
      };

      const postcheck = await performPostcheck(options);

      expect(postcheck.readBack).toBe(true);
      expect(postcheck.stateMatch).toBe(false);
      expect(postcheck.discrepancies).toEqual([
        "Type mismatch: expected 'GA4_CONFIG', got 'GA4_EVENT'",
      ]);
    });

    it("should handle read-back failure", async () => {
      const target: OperationTarget = { product: "ga4" };
      const envelope = createOperationEnvelope({
        opName: "ga4.property.create",
        actor: "user",
        target,
        request: { args: {} },
      });

      const readBackChecker = async (): Promise<unknown> => {
        throw new Error("Resource not found");
      };

      const options: PostcheckOptions = {
        envelope,
        readBackChecker,
        stateMatcher: async () => ({ match: false, discrepancies: [] }),
        expectedState: {},
      };

      const postcheck = await performPostcheck(options);

      expect(postcheck.readBack).toBe(false);
      expect(postcheck.stateMatch).toBe(false);
    });

    it("should support simple boolean state matcher", async () => {
      const target: OperationTarget = { product: "ga4" };
      const envelope = createOperationEnvelope({
        opName: "ga4.property.get",
        actor: "user",
        target,
        request: { args: {} },
      });

      const readBackChecker = async (): Promise<unknown> => {
        return Promise.resolve({ id: "123", name: "Property" });
      };

      const stateMatcher = async (): Promise<boolean> => {
        return Promise.resolve(true);
      };

      const options: PostcheckOptions = {
        envelope,
        readBackChecker,
        stateMatcher,
        expectedState: { id: "123", name: "Property" },
      };

      const postcheck = await performPostcheck(options);

      expect(postcheck.readBack).toBe(true);
      expect(postcheck.stateMatch).toBe(true);
    });
  });

  describe("executeRollback", () => {
    it("should execute rollback action when needed", async () => {
      let rollbackExecuted = false;

      const rollbackAction = async (): Promise<void> => {
        rollbackExecuted = true;
      };

      await executeRollback({
        needed: true,
        action: rollbackAction,
      });

      expect(rollbackExecuted).toBe(true);
    });

    it("should not execute rollback when not needed", async () => {
      let rollbackExecuted = false;

      const rollbackAction = async (): Promise<void> => {
        rollbackExecuted = true;
      };

      await executeRollback({
        needed: false,
        action: rollbackAction,
      });

      expect(rollbackExecuted).toBe(false);
    });

    it("should handle null rollback action", async () => {
      await expect(
        executeRollback({
          needed: true,
          action: null,
        })
      ).resolves.toBeUndefined();
    });

    it("should handle rollback errors gracefully", async () => {
      const rollbackAction = async (): Promise<void> => {
        throw new Error("Rollback failed");
      };

      await expect(
        executeRollback({
          needed: true,
          action: rollbackAction,
        })
      ).rejects.toThrow("Rollback failed");
    });
  });

  describe("Post-check with rollback decision", () => {
    it("should determine rollback needed on state mismatch", async () => {
      const target: OperationTarget = { product: "gtm" };
      const envelope = createOperationEnvelope({
        opName: "gtm.create_tag",
        actor: "user",
        target,
        request: { args: { name: "Tag" } },
      });

      const readBackChecker = async (): Promise<unknown> => {
        return Promise.resolve({ name: "Different Tag" });
      };

      const stateMatcher = async (): Promise<boolean> => false;

      const postcheck = await performPostcheck({
        envelope,
        readBackChecker,
        stateMatcher,
        expectedState: { name: "Tag" },
      });

      // Rollback should be needed when state doesn't match
      expect(postcheck.stateMatch).toBe(false);
    });
  });
});
