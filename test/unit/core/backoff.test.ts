import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AdaptiveBackoff } from "../../../src/core/backoff.js";

describe("AdaptiveBackoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Exponential backoff with jitter", () => {
    it("should calculate exponential backoff delay", () => {
      const backoff = new AdaptiveBackoff({
        initialDelay: 250,
        maxDelay: 30000,
        multiplier: 2,
      });

      const delay1 = backoff.calculateDelay(1);
      expect(delay1).toBeGreaterThanOrEqual(250);
      expect(delay1).toBeLessThan(500);

      const delay2 = backoff.calculateDelay(2);
      expect(delay2).toBeGreaterThanOrEqual(500);
      expect(delay2).toBeLessThan(1000);

      const delay3 = backoff.calculateDelay(3);
      expect(delay3).toBeGreaterThanOrEqual(1000);
      expect(delay3).toBeLessThan(2000);
    });

    it("should cap delay at maxDelay", () => {
      const backoff = new AdaptiveBackoff({
        initialDelay: 250,
        maxDelay: 1000,
        multiplier: 2,
      });

      const delay = backoff.calculateDelay(10); // Should exceed maxDelay
      expect(delay).toBeLessThanOrEqual(1000);
    });

    it("should add jitter to prevent thundering herd", () => {
      const backoff = new AdaptiveBackoff({
        initialDelay: 1000,
        maxDelay: 30000,
        multiplier: 2,
      });

      const delays: number[] = [];
      for (let i = 0; i < 10; i++) {
        delays.push(backoff.calculateDelay(2));
      }

      // All delays should be different due to jitter
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe("Retry-After header parsing", () => {
    it("should parse Retry-After header in seconds", () => {
      const backoff = new AdaptiveBackoff({
        initialDelay: 250,
        maxDelay: 30000,
        multiplier: 2,
      });

      const delay = backoff.parseRetryAfter("60");
      expect(delay).toBe(60000); // 60 seconds in milliseconds
    });

    it("should parse Retry-After header as HTTP date", () => {
      const backoff = new AdaptiveBackoff({
        initialDelay: 250,
        maxDelay: 30000,
        multiplier: 2,
      });

      const futureDate = new Date(Date.now() + 60000);
      const delay = backoff.parseRetryAfter(futureDate.toUTCString());
      expect(delay).toBeGreaterThan(50000);
      expect(delay).toBeLessThan(70000);
    });

    it("should use exponential backoff if Retry-After not provided", () => {
      const backoff = new AdaptiveBackoff({
        initialDelay: 250,
        maxDelay: 30000,
        multiplier: 2,
      });

      const delay = backoff.getDelay(1, undefined);
      expect(delay).toBeGreaterThanOrEqual(250);
    });

    it("should prefer Retry-After over exponential backoff", () => {
      const backoff = new AdaptiveBackoff({
        initialDelay: 250,
        maxDelay: 30000,
        multiplier: 2,
      });

      const delay = backoff.getDelay(1, "120"); // 120 seconds
      expect(delay).toBe(120000);
    });
  });

  describe("getDelay method", () => {
    it("should return delay based on attempt number and Retry-After", () => {
      const backoff = new AdaptiveBackoff({
        initialDelay: 250,
        maxDelay: 30000,
        multiplier: 2,
      });

      const delay1 = backoff.getDelay(1, undefined);
      expect(delay1).toBeGreaterThanOrEqual(250);

      const delay2 = backoff.getDelay(2, "60");
      expect(delay2).toBe(60000);
    });
  });
});

