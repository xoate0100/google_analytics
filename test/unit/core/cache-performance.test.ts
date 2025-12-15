/**
 * Cache performance metrics tests
 * Tests cache hit/miss ratios, TTL expiration accuracy, memory usage, and eviction policies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LRUCache, type LRUCacheOptions } from "../../../src/core/cache.js";

describe("Cache Performance Metrics", () => {
  let cache: LRUCache;
  const defaultOptions: LRUCacheOptions = {
    maxSize: 10,
    defaultTTL: 1000, // 1 second
  };

  beforeEach(() => {
    cache = new LRUCache(defaultOptions);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Cache hit/miss ratios", () => {
    it("should track cache hits correctly", async () => {
      await cache.set("key1", "value1");
      await cache.get("key1");
      await cache.get("key1");

      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(0);
      expect(metrics.hitRate).toBe(1.0);
    });

    it("should track cache misses correctly", async () => {
      await cache.get("nonexistent");
      await cache.get("nonexistent2");

      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(2);
      expect(metrics.hitRate).toBe(0.0);
    });

    it("should calculate hit rate correctly for mixed hits and misses", async () => {
      await cache.set("key1", "value1");
      await cache.set("key2", "value2");
      await cache.get("key1"); // hit
      await cache.get("key2"); // hit
      await cache.get("key3"); // miss
      await cache.get("key1"); // hit

      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(3);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBe(0.75);
    });
  });

  describe("TTL expiration accuracy", () => {
    it("should expire entries after TTL", async () => {
      await cache.set("key1", "value1", 1000);
      expect(await cache.get("key1")).toBe("value1");

      vi.advanceTimersByTime(999);
      expect(await cache.get("key1")).toBe("value1");

      vi.advanceTimersByTime(2);
      expect(await cache.get("key1")).toBeUndefined();
    });

    it("should not expire entries with infinite TTL", async () => {
      await cache.set("key1", "value1", 0);
      vi.advanceTimersByTime(100000);
      expect(await cache.get("key1")).toBe("value1");
    });

    it("should track expired entries in metrics", async () => {
      await cache.set("key1", "value1", 1000);
      await cache.set("key2", "value2", 1000);
      await cache.get("key1");

      vi.advanceTimersByTime(1001);
      await cache.get("key1"); // should be expired
      await cache.get("key2"); // should be expired

      const metrics = cache.getMetrics();
      expect(metrics.expirations).toBe(2);
    });
  });

  describe("Memory usage under load", () => {
    it("should track current size", async () => {
      const metrics = cache.getMetrics();
      expect(metrics.size).toBe(0);

      await cache.set("key1", "value1");
      expect(cache.getMetrics().size).toBe(1);

      await cache.set("key2", "value2");
      expect(cache.getMetrics().size).toBe(2);
    });

    it("should not exceed max size", async () => {
      for (let i = 0; i < 15; i++) {
        await cache.set(`key${i}`, `value${i}`);
      }

      const metrics = cache.getMetrics();
      expect(metrics.size).toBeLessThanOrEqual(10);
      expect(metrics.maxSize).toBe(10);
    });

    it("should track memory pressure when approaching max size", async () => {
      for (let i = 0; i < 9; i++) {
        await cache.set(`key${i}`, `value${i}`);
      }

      const metrics = cache.getMetrics();
      expect(metrics.utilization).toBe(0.9);
      expect(metrics.isMemoryPressure).toBe(true);
    });
  });

  describe("Cache eviction policies", () => {
    it("should track evictions when max size is reached", async () => {
      for (let i = 0; i < 15; i++) {
        await cache.set(`key${i}`, `value${i}`);
      }

      const metrics = cache.getMetrics();
      expect(metrics.evictions).toBeGreaterThan(0);
      expect(metrics.size).toBe(10);
    });

    it("should evict least recently used entries", async () => {
      // Fill cache
      for (let i = 0; i < 10; i++) {
        await cache.set(`key${i}`, `value${i}`);
      }

      // Access some keys to update LRU
      await cache.get("key0");
      await cache.get("key1");
      await cache.get("key2");

      // Add new entry - should evict least recently used (key3-key9)
      await cache.set("key10", "value10");

      // Recently accessed keys should still be there
      expect(await cache.get("key0")).toBe("value0");
      expect(await cache.get("key1")).toBe("value1");
      expect(await cache.get("key2")).toBe("value2");

      // Oldest unaccessed key should be evicted
      expect(await cache.get("key3")).toBeUndefined();
    });

    it("should track eviction count correctly", async () => {
      const initialMetrics = cache.getMetrics();
      expect(initialMetrics.evictions).toBe(0);

      // Fill cache and overflow
      for (let i = 0; i < 12; i++) {
        await cache.set(`key${i}`, `value${i}`);
      }

      const metrics = cache.getMetrics();
      expect(metrics.evictions).toBe(2); // 12 entries - 10 max = 2 evictions
    });
  });

  describe("Metrics reset", () => {
    it("should allow resetting metrics", async () => {
      await cache.set("key1", "value1");
      await cache.get("key1");
      await cache.get("key2");

      cache.resetMetrics();

      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.evictions).toBe(0);
      expect(metrics.expirations).toBe(0);
    });
  });
});
