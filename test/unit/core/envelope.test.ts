import { describe, it, expect } from "vitest";
import {
  createOperationEnvelope,
  generateOpId,
  computeIdempotencyKey,
  OperationEnvelopeBuilder,
} from "../../../src/core/envelope.js";
import type { OperationTarget } from "../../../src/core/types.js";

describe("Operation Envelope", () => {
  describe("generateOpId", () => {
    it("should generate a valid UUID v7 format", () => {
      const opId = generateOpId();
      expect(opId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("should generate unique IDs", () => {
      const id1 = generateOpId();
      const id2 = generateOpId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("computeIdempotencyKey", () => {
    it("should generate idempotency key from request and target", () => {
      const target: OperationTarget = {
        product: "ga4",
        propertyId: "123456789",
      };
      const request = { args: { dimension: "country", metric: "sessions" } };

      const key1 = computeIdempotencyKey(request, target);
      const key2 = computeIdempotencyKey(request, target);

      expect(key1).toBe(key2); // Same inputs = same key
      expect(key1).toBeTruthy();
      expect(typeof key1).toBe("string");
    });

    it("should generate different keys for different requests", () => {
      const target: OperationTarget = {
        product: "ga4",
        propertyId: "123456789",
      };
      const request1 = { args: { dimension: "country" } };
      const request2 = { args: { dimension: "city" } };

      const key1 = computeIdempotencyKey(request1, target);
      const key2 = computeIdempotencyKey(request2, target);

      expect(key1).not.toBe(key2);
    });

    it("should generate different keys for different targets", () => {
      const target1: OperationTarget = {
        product: "ga4",
        propertyId: "123456789",
      };
      const target2: OperationTarget = {
        product: "ga4",
        propertyId: "987654321",
      };
      const request = { args: { dimension: "country" } };

      const key1 = computeIdempotencyKey(request, target1);
      const key2 = computeIdempotencyKey(request, target2);

      expect(key1).not.toBe(key2);
    });
  });

  describe("createOperationEnvelope", () => {
    it("should create a complete operation envelope", () => {
      const target: OperationTarget = {
        product: "ga4",
        propertyId: "123456789",
      };
      const request = { args: { dimension: "country" } };

      const envelope = createOperationEnvelope({
        opName: "ga4.report.run",
        actor: "test-user",
        target,
        request,
      });

      expect(envelope.opId).toBeDefined();
      expect(envelope.opName).toBe("ga4.report.run");
      expect(envelope.idempotencyKey).toBeDefined();
      expect(envelope.timestamp).toBeDefined();
      expect(envelope.actor).toBe("test-user");
      expect(envelope.target).toEqual(target);
      expect(envelope.request).toEqual(request);
      expect(envelope.precheck).toBeDefined();
      expect(envelope.attempt).toBeDefined();
      expect(envelope.result).toBeDefined();
      expect(envelope.postcheck).toBeDefined();
      expect(envelope.rollback).toBeDefined();
      expect(typeof envelope.latencyMs).toBe("number");
      expect(Array.isArray(envelope.warnings)).toBe(true);
      expect(typeof envelope.notes).toBe("string");
    });

    it("should initialize with default values", () => {
      const target: OperationTarget = { product: "ga4" };
      const request = { args: {} };

      const envelope = createOperationEnvelope({
        opName: "test.op",
        actor: "user",
        target,
        request,
      });

      expect(envelope.precheck.capability).toBe(false);
      expect(envelope.precheck.exists).toBe(false);
      expect(envelope.precheck.conflicts).toEqual([]);
      expect(envelope.attempt.n).toBe(1);
      expect(envelope.attempt.retryPolicy).toBe("exp-jitter");
      expect(envelope.result.status).toBe("success");
      expect(envelope.postcheck.readBack).toBe(false);
      expect(envelope.postcheck.stateMatch).toBe(false);
      expect(envelope.rollback.needed).toBe(false);
      expect(envelope.rollback.action).toBeNull();
      expect(envelope.latencyMs).toBe(0);
      expect(envelope.warnings).toEqual([]);
      expect(envelope.notes).toBe("");
    });
  });

  describe("OperationEnvelopeBuilder", () => {
    it("should build envelope incrementally", () => {
      const target: OperationTarget = { product: "ga4" };
      const request = { args: {} };

      const builder = new OperationEnvelopeBuilder({
        opName: "test.op",
        actor: "user",
        target,
        request,
      });

      builder.setPrecheck({ capability: true, exists: true, conflicts: [] });
      builder.setAttempt({ n: 2, retryPolicy: "linear", rateLimitState: { tokens: 50 } });
      builder.setResult({ status: "success", resourceId: "res-123" });
      builder.setPostcheck({ readBack: true, stateMatch: true });
      builder.setLatencyMs(150);

      const envelope = builder.build();

      expect(envelope.precheck.capability).toBe(true);
      expect(envelope.precheck.exists).toBe(true);
      expect(envelope.attempt.n).toBe(2);
      expect(envelope.result.status).toBe("success");
      expect(envelope.result.resourceId).toBe("res-123");
      expect(envelope.postcheck.readBack).toBe(true);
      expect(envelope.latencyMs).toBe(150);
    });

    it("should add warnings", () => {
      const builder = new OperationEnvelopeBuilder({
        opName: "test.op",
        actor: "user",
        target: { product: "ga4" },
        request: { args: {} },
      });

      builder.addWarning("Warning 1");
      builder.addWarning("Warning 2");

      const envelope = builder.build();
      expect(envelope.warnings).toEqual(["Warning 1", "Warning 2"]);
    });

    it("should set notes", () => {
      const builder = new OperationEnvelopeBuilder({
        opName: "test.op",
        actor: "user",
        target: { product: "ga4" },
        request: { args: {} },
      });

      builder.setNotes("Test notes");

      const envelope = builder.build();
      expect(envelope.notes).toBe("Test notes");
    });
  });
});

