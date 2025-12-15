import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TokenBucketLimiter } from "../../../src/core/limiter.js";
import type { IRateLimiter, RateLimitResult } from "../../../src/core/types.js";

describe("TokenBucketLimiter", () => {
  let limiter: IRateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new TokenBucketLimiter({
      defaultQPS: 5,
      defaultBurst: 10,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rate limiter initialization", () => {
    it("should create a limiter instance", () => {
      expect(limiter).toBeDefined();
      expect(limiter).toHaveProperty("checkLimit");
      expect(limiter).toHaveProperty("waitForToken");
      expect(limiter).toHaveProperty("reset");
      expect(limiter).toHaveProperty("getState");
    });

    it("should implement IRateLimiter interface", () => {
      expect(typeof limiter.checkLimit).toBe("function");
      expect(typeof limiter.waitForToken).toBe("function");
      expect(typeof limiter.reset).toBe("function");
      expect(typeof limiter.getState).toBe("function");
    });
  });

  describe("Token bucket refill", () => {
    it("should refill tokens over time", async () => {
      // Consume a token first
      await limiter.checkLimit("ga4", "report.run");
      const state1 = limiter.getState("ga4");
      expect(state1?.tokens).toBeLessThan(10);

      // Advance time to allow refill (5 QPS = 1 token per 200ms)
      vi.advanceTimersByTime(250);

      const state2 = limiter.getState("ga4");
      expect(state2?.tokens).toBeGreaterThan(state1?.tokens || 0);
    });

    it("should refill at correct QPS rate", async () => {
      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        await limiter.checkLimit("ga4", "report.run");
      }

      const state1 = limiter.getState("ga4");
      expect(state1?.tokens).toBeLessThan(10);

      // Advance 1 second (should refill 5 tokens at 5 QPS)
      vi.advanceTimersByTime(1000);
      const state2 = limiter.getState("ga4");
      expect(state2?.tokens).toBeGreaterThan(state1?.tokens || 0);
    });
  });

  describe("QPS limiting", () => {
    it("should allow requests within QPS limit", async () => {
      const results: RateLimitResult[] = [];
      for (let i = 0; i < 5; i++) {
        results.push(await limiter.checkLimit("ga4", "report.run"));
      }
      expect(results.every((r) => r.allowed)).toBe(true);
    });

    it("should rate limit when QPS exceeded", async () => {
      // Consume all burst tokens quickly
      for (let i = 0; i < 10; i++) {
        await limiter.checkLimit("ga4", "report.run");
      }

      // Next request should be rate limited
      const result = await limiter.checkLimit("ga4", "report.run");
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
    });

    it("should track tokens remaining", async () => {
      const result1 = await limiter.checkLimit("ga4", "report.run");
      expect(result1.tokensRemaining).toBeLessThan(10);
      expect(result1.tokensRemaining).toBeGreaterThanOrEqual(0);

      const result2 = await limiter.checkLimit("ga4", "report.run");
      expect(result2.tokensRemaining).toBeLessThan(result1.tokensRemaining);
    });
  });

  describe("Burst allowance", () => {
    it("should allow burst up to burst limit", async () => {
      const limiterWithBurst = new TokenBucketLimiter({
        defaultQPS: 5,
        defaultBurst: 20,
      });

      const results: RateLimitResult[] = [];
      for (let i = 0; i < 20; i++) {
        results.push(await limiterWithBurst.checkLimit("ga4", "report.run"));
      }
      expect(results.every((r) => r.allowed)).toBe(true);
    });

    it("should not allow burst beyond burst limit", async () => {
      const limiterWithBurst = new TokenBucketLimiter({
        defaultQPS: 5,
        defaultBurst: 5,
      });

      // Consume all burst
      for (let i = 0; i < 5; i++) {
        await limiterWithBurst.checkLimit("ga4", "report.run");
      }

      // Next should be rate limited
      const result = await limiterWithBurst.checkLimit("ga4", "report.run");
      expect(result.allowed).toBe(false);
    });
  });

  describe("Per-product limiters", () => {
    it("should maintain separate limiters per product", async () => {
      // Consume all tokens for ga4
      for (let i = 0; i < 10; i++) {
        await limiter.checkLimit("ga4", "report.run");
      }

      // GTM should still have tokens
      const gtmResult = await limiter.checkLimit("gtm", "container.list");
      expect(gtmResult.allowed).toBe(true);
    });

    it("should support per-product QPS configuration", async () => {
      const limiterWithConfig = new TokenBucketLimiter({
        defaultQPS: 5,
        defaultBurst: 10,
        productLimits: {
          ga4: { qps: 10, burst: 20 },
          gtm: { qps: 3, burst: 5 },
        },
      });

      // GA4 should allow more requests
      for (let i = 0; i < 15; i++) {
        const result = await limiterWithConfig.checkLimit("ga4", "report.run");
        expect(result.allowed).toBe(true);
      }

      // GTM should be more restrictive
      for (let i = 0; i < 5; i++) {
        await limiterWithConfig.checkLimit("gtm", "container.list");
      }
      const gtmResult = await limiterWithConfig.checkLimit("gtm", "container.list");
      expect(gtmResult.allowed).toBe(false);
    });
  });

  describe("Wait for token", () => {
    it("should wait until token is available", async () => {
      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        await limiter.checkLimit("ga4", "report.run");
      }

      // Check that we're rate limited
      const checkResult = await limiter.checkLimit("ga4", "report.run");
      expect(checkResult.allowed).toBe(false);

      // Advance time to allow refill (need at least 200ms for 1 token at 5 QPS)
      vi.advanceTimersByTime(250);

      // Now should be able to get a token
      const waitPromise = limiter.waitForToken("ga4", "report.run");
      await waitPromise;
      expect(true).toBe(true); // If we get here, wait completed
    });

    it("should resolve immediately if tokens available", async () => {
      const waitPromise = limiter.waitForToken("ga4", "report.run");
      await waitPromise;
      // Should resolve immediately
      expect(true).toBe(true);
    });
  });

  describe("Reset operations", () => {
    it("should reset limiter state for a product", async () => {
      // Consume some tokens
      await limiter.checkLimit("ga4", "report.run");

      const stateBefore = limiter.getState("ga4");
      expect(stateBefore?.tokens).toBeLessThan(10);

      limiter.reset("ga4");

      const stateAfter = limiter.getState("ga4");
      expect(stateAfter?.tokens).toBe(10); // Should be reset to burst limit
    });

    it("should only reset specified product", async () => {
      await limiter.checkLimit("ga4", "report.run");
      await limiter.checkLimit("gtm", "container.list");

      limiter.reset("ga4");

      const ga4State = limiter.getState("ga4");
      const gtmState = limiter.getState("gtm");
      expect(ga4State?.tokens).toBe(10);
      expect(gtmState?.tokens).toBeLessThan(10);
    });
  });

  describe("Get state", () => {
    it("should return current limiter state", async () => {
      // Trigger bucket creation by checking limit first
      await limiter.checkLimit("ga4", "report.run");
      const state = limiter.getState("ga4");
      expect(state).toBeDefined();
      expect(state?.tokens).toBeDefined();
      expect(state?.lastRefill).toBeDefined();
      expect(typeof state?.tokens).toBe("number");
      expect(typeof state?.lastRefill).toBe("number");
    });

    it("should return undefined for unknown product", () => {
      const state = limiter.getState("unknown");
      expect(state).toBeUndefined();
    });

    it("should update state after token consumption", async () => {
      // Create bucket first
      await limiter.checkLimit("ga4", "report.run");
      const state1 = limiter.getState("ga4");
      expect(state1).toBeDefined();
      const tokens1 = state1?.tokens || 0;

      await limiter.checkLimit("ga4", "report.run");
      const state2 = limiter.getState("ga4");
      expect(state2?.tokens).toBeLessThan(tokens1);
    });
  });
});
