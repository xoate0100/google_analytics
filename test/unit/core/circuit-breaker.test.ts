import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CircuitBreaker, CircuitState } from "../../../src/core/circuit-breaker.js";

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    vi.useFakeTimers();
    breaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000, // 60 seconds
      halfOpenMaxAttempts: 3,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Circuit breaker states", () => {
    it("should start in closed state", () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it("should allow requests in closed state", () => {
      expect(breaker.isOpen()).toBe(false);
      expect(breaker.canAttempt()).toBe(true);
    });
  });

  describe("Failure tracking", () => {
    it("should track consecutive failures", () => {
      for (let i = 0; i < 4; i++) {
        breaker.recordFailure();
      }
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.canAttempt()).toBe(true);

      breaker.recordFailure(); // 5th failure
      expect(breaker.getState()).toBe(CircuitState.OPEN);
      expect(breaker.canAttempt()).toBe(false);
    });

    it("should reset failure count on success", () => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordSuccess();
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      // Should need 5 more failures to trip
      for (let i = 0; i < 4; i++) {
        breaker.recordFailure();
      }
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe("Circuit opening", () => {
    it("should open circuit after threshold failures", () => {
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }
      expect(breaker.getState()).toBe(CircuitState.OPEN);
      expect(breaker.canAttempt()).toBe(false);
    });

    it("should not allow attempts when open", () => {
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }
      expect(breaker.canAttempt()).toBe(false);
    });
  });

  describe("Half-open state", () => {
    it("should transition to half-open after reset timeout", () => {
      // Trip the circuit
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Advance time past reset timeout
      vi.advanceTimersByTime(61000);
      breaker.checkReset(); // Should transition to half-open

      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
      expect(breaker.canAttempt()).toBe(true);
    });

    it("should allow limited attempts in half-open state", () => {
      // Trip and reset to half-open
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }
      vi.advanceTimersByTime(61000);
      breaker.checkReset();

      // Should allow attempts up to halfOpenMaxAttempts
      expect(breaker.canAttempt()).toBe(true);
      breaker.recordAttempt();

      // After max attempts, should not allow more
      breaker.recordAttempt();
      breaker.recordAttempt();
      expect(breaker.canAttempt()).toBe(false);
    });

    it("should close circuit on success in half-open", () => {
      // Trip and reset to half-open
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }
      vi.advanceTimersByTime(61000);
      breaker.checkReset();

      breaker.recordAttempt();
      breaker.recordSuccess();

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.canAttempt()).toBe(true);
    });

    it("should reopen circuit on failure in half-open", () => {
      // Trip and reset to half-open
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }
      vi.advanceTimersByTime(61000);
      breaker.checkReset();

      breaker.recordAttempt();
      breaker.recordFailure();

      expect(breaker.getState()).toBe(CircuitState.OPEN);
      expect(breaker.canAttempt()).toBe(false);
    });
  });

  describe("Per-product circuit breakers", () => {
    it("should maintain separate breakers per product", () => {
      const breaker2 = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 30000,
        halfOpenMaxAttempts: 2,
      });

      // Trip first breaker
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure();
      }
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Second breaker should still be closed
      expect(breaker2.getState()).toBe(CircuitState.CLOSED);
      breaker2.recordFailure();
      breaker2.recordFailure();
      expect(breaker2.getState()).toBe(CircuitState.CLOSED);
    });
  });
});
