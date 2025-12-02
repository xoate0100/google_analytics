import { describe, it, expect, beforeEach } from "vitest";
import { LRUCache } from "../../../src/core/cache.js";
import type { ICache } from "../../../src/core/types.js";

describe("LRUCache", () => {
  let cache: ICache;

  beforeEach(() => {
    cache = new LRUCache({ maxSize: 10, defaultTTL: 1000 });
  });

  describe("Cache get/set operations", () => {
    it("should store and retrieve values", async () => {
      await cache.set("key1", "value1");
      const value = await cache.get<string>("key1");
      expect(value).toBe("value1");
    });

    it("should return undefined for non-existent keys", async () => {
      const value = await cache.get<string>("nonexistent");
      expect(value).toBeUndefined();
    });

    it("should store and retrieve objects", async () => {
      const obj = { name: "test", count: 42 };
      await cache.set("obj1", obj);
      const retrieved = await cache.get<typeof obj>("obj1");
      expect(retrieved).toEqual(obj);
    });

    it("should overwrite existing values", async () => {
      await cache.set("key1", "value1");
      await cache.set("key1", "value2");
      const value = await cache.get<string>("key1");
      expect(value).toBe("value2");
    });
  });

  describe("TTL expiration", () => {
    it("should expire entries after TTL", async () => {
      await cache.set("key1", "value1", 100);
      await new Promise((resolve) => setTimeout(resolve, 150));
      const value = await cache.get<string>("key1");
      expect(value).toBeUndefined();
    });

    it("should not expire entries before TTL", async () => {
      await cache.set("key1", "value1", 1000);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const value = await cache.get<string>("key1");
      expect(value).toBe("value1");
    });

    it("should use default TTL when not specified", async () => {
      const cacheWithDefaultTTL = new LRUCache({ maxSize: 10, defaultTTL: 200 });
      await cacheWithDefaultTTL.set("key1", "value1");
      await new Promise((resolve) => setTimeout(resolve, 250));
      const value = await cacheWithDefaultTTL.get<string>("key1");
      expect(value).toBeUndefined();
    });

    it("should allow infinite TTL when set to 0", async () => {
      await cache.set("key1", "value1", 0);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const value = await cache.get<string>("key1");
      expect(value).toBe("value1");
    });
  });

  describe("LRU eviction", () => {
    it("should evict least recently used entry when max size reached", async () => {
      const smallCache = new LRUCache({ maxSize: 3, defaultTTL: 1000 });
      await smallCache.set("key1", "value1");
      await smallCache.set("key2", "value2");
      await smallCache.set("key3", "value3");
      await smallCache.set("key4", "value4"); // Should evict key1
      expect(await smallCache.get<string>("key1")).toBeUndefined();
      expect(await smallCache.get<string>("key2")).toBe("value2");
      expect(await smallCache.get<string>("key3")).toBe("value3");
      expect(await smallCache.get<string>("key4")).toBe("value4");
    });

    it("should update access order on get", async () => {
      const smallCache = new LRUCache({ maxSize: 3, defaultTTL: 1000 });
      await smallCache.set("key1", "value1");
      await smallCache.set("key2", "value2");
      await smallCache.set("key3", "value3");
      await smallCache.get("key1"); // Access key1 to make it recently used
      await smallCache.set("key4", "value4"); // Should evict key2 (least recently used)
      expect(await smallCache.get<string>("key1")).toBe("value1");
      expect(await smallCache.get<string>("key2")).toBeUndefined();
      expect(await smallCache.get<string>("key3")).toBe("value3");
      expect(await smallCache.get<string>("key4")).toBe("value4");
    });

    it("should update access order on set", async () => {
      const smallCache = new LRUCache({ maxSize: 3, defaultTTL: 1000 });
      await smallCache.set("key1", "value1");
      await smallCache.set("key2", "value2");
      await smallCache.set("key3", "value3");
      await smallCache.set("key1", "value1-updated"); // Update key1 to make it recently used
      await smallCache.set("key4", "value4"); // Should evict key2 (least recently used)
      expect(await smallCache.get<string>("key1")).toBe("value1-updated");
      expect(await smallCache.get<string>("key2")).toBeUndefined();
    });
  });

  describe("Delete operations", () => {
    it("should delete entries", async () => {
      await cache.set("key1", "value1");
      await cache.delete("key1");
      const value = await cache.get<string>("key1");
      expect(value).toBeUndefined();
    });

    it("should handle deleting non-existent keys", async () => {
      await expect(cache.delete("nonexistent")).resolves.not.toThrow();
    });
  });

  describe("Clear operations", () => {
    it("should clear all entries", async () => {
      await cache.set("key1", "value1");
      await cache.set("key2", "value2");
      await cache.clear();
      expect(await cache.get<string>("key1")).toBeUndefined();
      expect(await cache.get<string>("key2")).toBeUndefined();
    });
  });

  describe("Invalidate operations", () => {
    it("should invalidate entries matching pattern", async () => {
      await cache.set("ga4:report:123", "value1");
      await cache.set("ga4:report:456", "value2");
      await cache.set("gtm:container:789", "value3");
      await cache.invalidate("ga4:report:*");
      expect(await cache.get<string>("ga4:report:123")).toBeUndefined();
      expect(await cache.get<string>("ga4:report:456")).toBeUndefined();
      expect(await cache.get<string>("gtm:container:789")).toBe("value3");
    });

    it("should handle invalidate with exact match", async () => {
      await cache.set("key1", "value1");
      await cache.set("key2", "value2");
      await cache.invalidate("key1");
      expect(await cache.get<string>("key1")).toBeUndefined();
      expect(await cache.get<string>("key2")).toBe("value2");
    });

    it("should handle invalidate with no matches", async () => {
      await cache.set("key1", "value1");
      await cache.invalidate("nonexistent:*");
      expect(await cache.get<string>("key1")).toBe("value1");
    });
  });

  describe("ICache interface compliance", () => {
    it("should implement ICache interface", () => {
      expect(cache).toHaveProperty("get");
      expect(cache).toHaveProperty("set");
      expect(cache).toHaveProperty("delete");
      expect(cache).toHaveProperty("clear");
      expect(cache).toHaveProperty("invalidate");
      expect(typeof cache.get).toBe("function");
      expect(typeof cache.set).toBe("function");
      expect(typeof cache.delete).toBe("function");
      expect(typeof cache.clear).toBe("function");
      expect(typeof cache.invalidate).toBe("function");
    });
  });

  describe("ETag support", () => {
    it("should store ETag with cache entry", async () => {
      const cacheWithETag = new LRUCache({ maxSize: 10, defaultTTL: 1000 });
      await cacheWithETag.set("key1", "value1", undefined, "etag-123");
      const etag = await cacheWithETag.getETag("key1");
      expect(etag).toBe("etag-123");
    });

    it("should return undefined ETag for non-existent keys", async () => {
      const cacheWithETag = new LRUCache({ maxSize: 10, defaultTTL: 1000 });
      const etag = await cacheWithETag.getETag("nonexistent");
      expect(etag).toBeUndefined();
    });

    it("should check If-None-Match and return cached value if match", async () => {
      const cacheWithETag = new LRUCache({ maxSize: 10, defaultTTL: 1000 });
      await cacheWithETag.set("key1", "value1", undefined, "etag-123");
      const result = await cacheWithETag.getWithETag<string>("key1", "etag-123");
      expect(result).toEqual({ value: "value1", etag: "etag-123", cached: true });
    });

    it("should return value and new ETag if If-None-Match does not match", async () => {
      const cacheWithETag = new LRUCache({ maxSize: 10, defaultTTL: 1000 });
      await cacheWithETag.set("key1", "value1", undefined, "etag-123");
      const result = await cacheWithETag.getWithETag<string>("key1", "etag-456");
      expect(result).toEqual({ value: "value1", etag: "etag-123", cached: false });
    });

    it("should update ETag when value is updated", async () => {
      const cacheWithETag = new LRUCache({ maxSize: 10, defaultTTL: 1000 });
      await cacheWithETag.set("key1", "value1", undefined, "etag-123");
      await cacheWithETag.set("key1", "value2", undefined, "etag-456");
      const etag = await cacheWithETag.getETag("key1");
      expect(etag).toBe("etag-456");
    });
  });

  describe("Write-through invalidation", () => {
    it("should invalidate related keys after write", async () => {
      const cacheWithInvalidation = new LRUCache({
        maxSize: 10,
        defaultTTL: 1000,
        onWrite: async (key: string): Promise<void> => {
          // Invalidate related keys
          await cacheWithInvalidation.invalidate(`${key}:related:*`);
        },
      });
      await cacheWithInvalidation.set("ga4:report:123", "value1");
      await cacheWithInvalidation.set("ga4:report:123:related:meta", "meta1");
      await cacheWithInvalidation.set("ga4:report:123", "value2"); // Write should invalidate related
      expect(await cacheWithInvalidation.get<string>("ga4:report:123")).toBe("value2");
      expect(await cacheWithInvalidation.get<string>("ga4:report:123:related:meta")).toBeUndefined();
    });

    it("should support custom invalidation patterns", async () => {
      const invalidationPatterns: string[] = [];
      const cacheWithInvalidation = new LRUCache({
        maxSize: 10,
        defaultTTL: 1000,
        onWrite: async (key: string): Promise<void> => {
          if (key.startsWith("ga4:report:")) {
            // Invalidate other reports, but not the one being written
            invalidationPatterns.push("ga4:report:*");
            // Invalidate all except the current key
            const keysToInvalidate: string[] = [];
            for (const cacheKey of cacheWithInvalidation["entries"].keys()) {
              if (cacheKey.startsWith("ga4:report:") && cacheKey !== key) {
                keysToInvalidate.push(cacheKey);
              }
            }
            for (const cacheKey of keysToInvalidate) {
              await cacheWithInvalidation.delete(cacheKey);
            }
          }
        },
      });
      await cacheWithInvalidation.set("ga4:report:123", "value1");
      await cacheWithInvalidation.set("ga4:report:456", "value2");
      await cacheWithInvalidation.set("ga4:report:123", "value3"); // Should invalidate other reports
      expect(await cacheWithInvalidation.get<string>("ga4:report:123")).toBe("value3");
      expect(await cacheWithInvalidation.get<string>("ga4:report:456")).toBeUndefined();
      expect(invalidationPatterns.length).toBeGreaterThan(0);
    });

    it("should not invalidate unrelated keys", async () => {
      const cacheWithInvalidation = new LRUCache({
        maxSize: 10,
        defaultTTL: 1000,
        onWrite: async (key: string): Promise<void> => {
          if (key.startsWith("ga4:")) {
            await cacheWithInvalidation.invalidate("ga4:*");
          }
        },
      });
      await cacheWithInvalidation.set("gtm:container:123", "value1");
      await cacheWithInvalidation.set("ga4:report:123", "value2");
      expect(await cacheWithInvalidation.get<string>("gtm:container:123")).toBe("value1");
    });
  });
});

