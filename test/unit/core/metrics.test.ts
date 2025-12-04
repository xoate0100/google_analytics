/**
 * Unit tests for metrics collection system
 * Tests counter metrics, histogram metrics, gauge metrics, and metrics export
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  MetricsCollector,
  createCounter,
  createHistogram,
  createGauge,
} from "../../../src/core/metrics.js";

describe("Metrics Collection System", () => {
  let metricsCollector: MetricsCollector;

  beforeEach(() => {
    metricsCollector = new MetricsCollector();
  });

  describe("Counter metrics", () => {
    it("should create and increment counter", () => {
      const counter = createCounter("test_counter", "Test counter");
      counter.inc();
      counter.inc(5);
      expect(counter.get()).toBe(6);
    });

    it("should reset counter", () => {
      const counter = createCounter("test_counter", "Test counter");
      counter.inc(10);
      counter.reset();
      expect(counter.get()).toBe(0);
    });

    it("should register counter with collector", () => {
      const counter = createCounter("test_counter", "Test counter", {
        collector: metricsCollector,
      });
      counter.inc();
      const exported = metricsCollector.export();
      expect(exported.counters).toHaveLength(1);
      expect(exported.counters[0].value).toBe(1);
    });
  });

  describe("Histogram metrics", () => {
    it("should create and record histogram values", () => {
      const histogram = createHistogram("test_histogram", "Test histogram");
      histogram.observe(10);
      histogram.observe(20);
      histogram.observe(30);
      const stats = histogram.getStats();
      expect(stats.count).toBe(3);
      expect(stats.sum).toBe(60);
    });

    it("should calculate percentiles", () => {
      const histogram = createHistogram("test_histogram", "Test histogram");
      for (let i = 1; i <= 100; i++) {
        histogram.observe(i);
      }
      const stats = histogram.getStats();
      expect(stats.p50).toBeGreaterThan(0);
      expect(stats.p95).toBeGreaterThan(0);
      expect(stats.p99).toBeGreaterThan(0);
    });

    it("should reset histogram", () => {
      const histogram = createHistogram("test_histogram", "Test histogram");
      histogram.observe(10);
      histogram.reset();
      const stats = histogram.getStats();
      expect(stats.count).toBe(0);
    });
  });

  describe("Gauge metrics", () => {
    it("should create and set gauge value", () => {
      const gauge = createGauge("test_gauge", "Test gauge");
      gauge.set(42);
      expect(gauge.get()).toBe(42);
    });

    it("should increment gauge", () => {
      const gauge = createGauge("test_gauge", "Test gauge");
      gauge.set(10);
      gauge.inc();
      expect(gauge.get()).toBe(11);
    });

    it("should decrement gauge", () => {
      const gauge = createGauge("test_gauge", "Test gauge");
      gauge.set(10);
      gauge.dec();
      expect(gauge.get()).toBe(9);
    });

    it("should reset gauge", () => {
      const gauge = createGauge("test_gauge", "Test gauge");
      gauge.set(42);
      gauge.reset();
      expect(gauge.get()).toBe(0);
    });
  });

  describe("Metrics export", () => {
    it("should export all registered metrics", () => {
      const counter = createCounter("test_counter", "Test counter", {
        collector: metricsCollector,
      });
      const histogram = createHistogram("test_histogram", "Test histogram", {
        collector: metricsCollector,
      });
      const gauge = createGauge("test_gauge", "Test gauge", {
        collector: metricsCollector,
      });

      counter.inc(5);
      histogram.observe(10);
      gauge.set(42);

      const exported = metricsCollector.export();
      expect(exported.counters).toHaveLength(1);
      expect(exported.histograms).toHaveLength(1);
      expect(exported.gauges).toHaveLength(1);
    });

    it("should export metrics in JSON format", () => {
      const counter = createCounter("test_counter", "Test counter", {
        collector: metricsCollector,
      });
      counter.inc(5);
      const exported = metricsCollector.export();
      const json = JSON.stringify(exported);
      expect(json).toContain("test_counter");
      expect(json).toContain("5");
    });

    it("should clear all metrics", () => {
      const counter = createCounter("test_counter", "Test counter", {
        collector: metricsCollector,
      });
      counter.inc(5);
      metricsCollector.clear();
      const exported = metricsCollector.export();
      expect(exported.counters).toHaveLength(0);
    });
  });
});

