/**
 * Unit tests for cache tuning features
 * Tests adaptive TTL, size limit eviction policies, and cache statistics
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { LRUCache } from "../../../src/core/cache.js";
import type { ICache } from "../../../src/core/types.js";

describe("Cache Tuning", () => {
  let cache: ICache;

  beforeEach(() => {
    cache = new LRUCache({ maxSize: 10, defaultTTL: 1000 });
  });

  describe("Adaptive TTL based on data freshness", () => {
    it("should calculate adaptive TTL for real-time data (shorter TTL)", async () => {
      const cacheWithAdaptive = new LRUCache({
        maxSize: 10,
        defaultTTL: 1000,
      });
      // Real-time data should have shorter TTL
      const realtimeTTL = (cacheWithAdaptive as LRUCache).calculateAdaptiveTTL(
        "realtime",
        1000
      );
      expect(realtimeTTL).toBeLessThan(1000);
    });

    it("should calculate adaptive TTL for historical data (longer TTL)", async () => {
      const cacheWithAdaptive = new LRUCache({
        maxSize: 10,
        defaultTTL: 1000,
      });
      // Historical data should have longer TTL
      const historicalTTL = (cacheWithAdaptive as LRUCache).calculateAdaptiveTTL(
        "historical",
        1000
      );
      expect(historicalTTL).toBeGreaterThan(1000);
    });

    it("should use default TTL for unknown data types", async () => {
      const cacheWithAdaptive = new LRUCache({
        maxSize: 10,
        defaultTTL: 1000,
      });
      const defaultTTL = (cacheWithAdaptive as LRUCache).calculateAdaptiveTTL(
        "unknown",
        1000
      );
      expect(defaultTTL).toBe(1000);
    });
  });

  describe("Size limit eviction policies", () => {
    it("should evict based on LRU when size limit reached", async () => {
      const smallCache = new LRUCache({ maxSize: 3, defaultTTL: 1000 });
      await smallCache.set("key1", "value1");
      await smallCache.set("key2", "value2");
      await smallCache.set("key3", "value3");
      await smallCache.set("key4", "value4"); // Should evict key1
      expect(await smallCache.get<string>("key1")).toBeUndefined();
      expect(await smallCache.get<string>("key4")).toBe("value4");
    });

    it("should respect max size limit strictly", async () => {
      const smallCache = new LRUCache({ maxSize: 2, defaultTTL: 1000 });
      await smallCache.set("key1", "value1");
      await smallCache.set("key2", "value2");
      await smallCache.set("key3", "value3");
      const stats = (smallCache as LRUCache).getStatistics();
      expect(stats.size).toBeLessThanOrEqual(2);
    });
  });

  describe("Cache statistics tracking", () => {
    it("should track cache hits", async () => {
      await cache.set("key1", "value1");
      await cache.get("key1");
      const stats = (cache as LRUCache).getStatistics();
      expect(stats.hits).toBeGreaterThan(0);
    });

    it("should track cache misses", async () => {
      await cache.get("nonexistent");
      const stats = (cache as LRUCache).getStatistics();
      expect(stats.misses).toBeGreaterThan(0);
    });

    it("should track evictions", async () => {
      const smallCache = new LRUCache({ maxSize: 2, defaultTTL: 1000 });
      await smallCache.set("key1", "value1");
      await smallCache.set("key2", "value2");
      await smallCache.set("key3", "value3"); // Should evict key1
      const stats = (smallCache as LRUCache).getStatistics();
      expect(stats.evictions).toBeGreaterThan(0);
    });

    it("should calculate hit/miss ratio", async () => {
      await cache.set("key1", "value1");
      await cache.get("key1"); // hit
      await cache.get("key1"); // hit
      await cache.get("nonexistent"); // miss
      const stats = (cache as LRUCache).getStatistics();
      expect(stats.hitRatio).toBeGreaterThan(0);
      expect(stats.hitRatio).toBeLessThanOrEqual(1);
    });

    it("should reset statistics", async () => {
      await cache.set("key1", "value1");
      await cache.get("key1");
      (cache as LRUCache).resetStatistics();
      const stats = (cache as LRUCache).getStatistics();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
    });
  });
});
