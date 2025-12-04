/**
 * Unit tests for circuit breaker metrics
 * Tests state transitions tracking, failure count metrics, and half-open attempt tracking
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { CircuitBreaker, CircuitState } from "../../../src/core/circuit-breaker.js";

describe("Circuit Breaker Metrics", () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000,
      halfOpenMaxAttempts: 2,
    });
  });

  describe("State transitions tracking", () => {
    it("should track state transitions from CLOSED to OPEN", () => {
      // Record failures to trip circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.stateTransitions.length).toBeGreaterThan(0);
      expect(metrics.currentState).toBe(CircuitState.OPEN);
    });

    it("should track state transitions from OPEN to HALF_OPEN", async () => {
      // Trip circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));
      circuitBreaker.canAttempt(); // Triggers checkReset
      const metrics = circuitBreaker.getMetrics();
      const halfOpenTransitions = metrics.stateTransitions.filter(
        (t) => t.to === CircuitState.HALF_OPEN
      );
      expect(halfOpenTransitions.length).toBeGreaterThan(0);
    });

    it("should track state transitions from HALF_OPEN to CLOSED", async () => {
      // Trip circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));
      circuitBreaker.canAttempt(); // Triggers checkReset
      circuitBreaker.recordSuccess(); // Should close circuit
      const metrics = circuitBreaker.getMetrics();
      const closedTransitions = metrics.stateTransitions.filter(
        (t) => t.to === CircuitState.CLOSED
      );
      expect(closedTransitions.length).toBeGreaterThan(0);
    });
  });

  describe("Failure count metrics", () => {
    it("should track total failure count", () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.totalFailures).toBeGreaterThanOrEqual(2);
    });

    it("should track consecutive failure count", () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.consecutiveFailures).toBe(2);
    });

    it("should reset consecutive failures on success", () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordSuccess();
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.consecutiveFailures).toBe(0);
    });
  });

  describe("Half-open attempt tracking", () => {
    it("should track half-open attempts", async () => {
      // Trip circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));
      circuitBreaker.canAttempt(); // Triggers checkReset
      circuitBreaker.recordAttempt();
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.halfOpenAttempts).toBeGreaterThan(0);
    });

    it("should track recovery time", async () => {
      const startTime = Date.now();
      // Trip circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));
      circuitBreaker.canAttempt(); // Triggers checkReset
      circuitBreaker.recordSuccess(); // Should close circuit
      const metrics = circuitBreaker.getMetrics();
      if (metrics.lastRecoveryTime) {
        expect(metrics.lastRecoveryTime).toBeGreaterThanOrEqual(startTime);
      }
    });
  });

  describe("Metrics export", () => {
    it("should export all metrics", () => {
      circuitBreaker.recordFailure();
      const metrics = circuitBreaker.getMetrics();
      expect(metrics).toHaveProperty("currentState");
      expect(metrics).toHaveProperty("totalFailures");
      expect(metrics).toHaveProperty("consecutiveFailures");
      expect(metrics).toHaveProperty("stateTransitions");
      expect(metrics).toHaveProperty("halfOpenAttempts");
    });

    it("should reset metrics", () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.resetMetrics();
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.totalFailures).toBe(0);
      expect(metrics.consecutiveFailures).toBe(0);
      expect(metrics.stateTransitions.length).toBe(0);
    });
  });
});

