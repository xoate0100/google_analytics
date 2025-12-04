/**
 * Unit tests for envelope metrics integration
 * Tests latency histogram recording, success/failure counter tracking, and rollback counter tracking
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createOperationEnvelope,
  OperationEnvelopeBuilder,
  recordEnvelopeMetrics,
} from "../../../src/core/envelope.js";
import {
  MetricsCollector,
  createCounter,
  createHistogram,
} from "../../../src/core/metrics.js";
import type { OperationEnvelope } from "../../../src/core/types.js";

describe("Envelope Metrics Integration", () => {
  let metricsCollector: MetricsCollector;
  let latencyHistogram: ReturnType<typeof createHistogram>;
  let successCounter: ReturnType<typeof createCounter>;
  let failureCounter: ReturnType<typeof createCounter>;
  let rollbackCounter: ReturnType<typeof createCounter>;

  beforeEach(() => {
    metricsCollector = new MetricsCollector();
    latencyHistogram = createHistogram("operation_latency", "Operation latency", {
      collector: metricsCollector,
    });
    successCounter = createCounter("operation_success", "Operation success", {
      collector: metricsCollector,
    });
    failureCounter = createCounter("operation_failure", "Operation failure", {
      collector: metricsCollector,
    });
    rollbackCounter = createCounter("operation_rollback", "Operation rollback", {
      collector: metricsCollector,
    });
  });

  describe("Latency histogram recording", () => {
    it("should record latency in histogram", () => {
      const envelope = createOperationEnvelope({
        opName: "test.operation",
        actor: "test",
        target: { product: "ga4" },
        request: { args: {} },
      });
      envelope.latencyMs = 150;

      recordEnvelopeMetrics(envelope, {
        latencyHistogram,
        successCounter,
        failureCounter,
        rollbackCounter,
      });

      const stats = latencyHistogram.getStats();
      expect(stats.count).toBe(1);
      expect(stats.sum).toBe(150);
    });

    it("should record latency per tool", () => {
      const envelope1 = createOperationEnvelope({
        opName: "ga4.report.run",
        actor: "test",
        target: { product: "ga4" },
        request: { args: {} },
      });
      envelope1.latencyMs = 100;

      const envelope2 = createOperationEnvelope({
        opName: "gtm.tag.upsert",
        actor: "test",
        target: { product: "gtm" },
        request: { args: {} },
      });
      envelope2.latencyMs = 200;

      recordEnvelopeMetrics(envelope1, {
        latencyHistogram,
        successCounter,
        failureCounter,
        rollbackCounter,
      });
      recordEnvelopeMetrics(envelope2, {
        latencyHistogram,
        successCounter,
        failureCounter,
        rollbackCounter,
      });

      const stats = latencyHistogram.getStats();
      expect(stats.count).toBe(2);
      expect(stats.sum).toBe(300);
    });
  });

  describe("Success/failure counter tracking", () => {
    it("should increment success counter on successful operation", () => {
      const envelope = createOperationEnvelope({
        opName: "test.operation",
        actor: "test",
        target: { product: "ga4" },
        request: { args: {} },
      });
      envelope.result = { status: "success" };

      recordEnvelopeMetrics(envelope, {
        latencyHistogram,
        successCounter,
        failureCounter,
        rollbackCounter,
      });

      expect(successCounter.get()).toBe(1);
      expect(failureCounter.get()).toBe(0);
    });

    it("should increment failure counter on failed operation", () => {
      const envelope = createOperationEnvelope({
        opName: "test.operation",
        actor: "test",
        target: { product: "ga4" },
        request: { args: {} },
      });
      envelope.result = { status: "error", error: { type: "ValidationError" } };

      recordEnvelopeMetrics(envelope, {
        latencyHistogram,
        successCounter,
        failureCounter,
        rollbackCounter,
      });

      expect(successCounter.get()).toBe(0);
      expect(failureCounter.get()).toBe(1);
    });
  });

  describe("Rollback counter tracking", () => {
    it("should increment rollback counter when rollback is needed", () => {
      const envelope = createOperationEnvelope({
        opName: "test.operation",
        actor: "test",
        target: { product: "ga4" },
        request: { args: {} },
      });
      envelope.rollback = { needed: true, action: "delete" };

      recordEnvelopeMetrics(envelope, {
        latencyHistogram,
        successCounter,
        failureCounter,
        rollbackCounter,
      });

      expect(rollbackCounter.get()).toBe(1);
    });

    it("should not increment rollback counter when rollback is not needed", () => {
      const envelope = createOperationEnvelope({
        opName: "test.operation",
        actor: "test",
        target: { product: "ga4" },
        request: { args: {} },
      });
      envelope.rollback = { needed: false, action: null };

      recordEnvelopeMetrics(envelope, {
        latencyHistogram,
        successCounter,
        failureCounter,
        rollbackCounter,
      });

      expect(rollbackCounter.get()).toBe(0);
    });
  });

  describe("Metrics export", () => {
    it("should export all envelope metrics", () => {
      const envelope = createOperationEnvelope({
        opName: "test.operation",
        actor: "test",
        target: { product: "ga4" },
        request: { args: {} },
      });
      envelope.latencyMs = 150;
      envelope.result = { status: "success" };

      recordEnvelopeMetrics(envelope, {
        latencyHistogram,
        successCounter,
        failureCounter,
        rollbackCounter,
      });

      const exported = metricsCollector.export();
      expect(exported.counters.length).toBeGreaterThan(0);
      expect(exported.histograms.length).toBeGreaterThan(0);
    });
  });
});

