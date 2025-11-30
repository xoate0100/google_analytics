/**
 * LRU Cache implementation with TTL support
 * Implements ICache interface with LRU eviction and TTL expiration
 */

import type { ICache } from "./types.js";

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number; // 0 means no expiration
  accessTime: number;
}

/**
 * Global access counter to ensure unique access times
 * Even if Date.now() returns the same value, this ensures ordering
 */
let accessCounter = 0;

function getNextAccessTime(): number {
  accessCounter += 1;
  // Combine timestamp with counter to ensure uniqueness
  // Use high-precision timestamp if available, otherwise use counter
  return Date.now() * 10000 + (accessCounter % 10000);
}

/**
 * LRU Cache options
 */
export interface LRUCacheOptions {
  maxSize: number;
  defaultTTL?: number; // in milliseconds, 0 means infinite
}

/**
 * LRU Cache implementation
 * Evicts least recently used entries when max size is reached
 * Supports TTL expiration
 */
export class LRUCache implements ICache {
  private readonly entries: Map<string, CacheEntry<unknown>>;
  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(options: LRUCacheOptions) {
    this.entries = new Map();
    this.maxSize = options.maxSize;
    this.defaultTTL = options.defaultTTL ?? 0;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.entries.get(key);
    if (!entry) {
      return Promise.resolve(undefined);
    }

    // Check expiration
    if (this.isExpired(entry)) {
      this.entries.delete(key);
      return Promise.resolve(undefined);
    }

    // Update access time for LRU
    entry.accessTime = getNextAccessTime();
    return Promise.resolve(entry.value as T);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const now = Date.now();
    const ttlMs = ttl ?? this.defaultTTL;
    const expiresAt = ttlMs > 0 ? now + ttlMs : 0;

    // If key exists, update it
    if (this.entries.has(key)) {
      const entry = this.entries.get(key)!;
      entry.value = value;
      entry.expiresAt = expiresAt;
      entry.accessTime = getNextAccessTime();
      return Promise.resolve();
    }

    // Check if we need to evict
    if (this.entries.size >= this.maxSize) {
      this.evictLRU();
    }

    // Add new entry
    this.entries.set(key, {
      value,
      expiresAt,
      accessTime: getNextAccessTime(),
    });
    return Promise.resolve();
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key);
    return Promise.resolve();
  }

  async clear(): Promise<void> {
    this.entries.clear();
    return Promise.resolve();
  }

  async invalidate(pattern: string): Promise<void> {
    if (pattern.includes("*")) {
      // Pattern matching: convert * to regex
      const regexPattern = pattern.replace(/\*/g, ".*");
      const regex = new RegExp(`^${regexPattern}$`);
      for (const key of this.entries.keys()) {
        if (regex.test(key)) {
          this.entries.delete(key);
        }
      }
    } else {
      // Exact match
      this.entries.delete(pattern);
    }
    return Promise.resolve();
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    if (entry.expiresAt === 0) {
      return false; // No expiration
    }
    return Date.now() > entry.expiresAt;
  }

  private evictLRU(): void {
    if (this.entries.size === 0) {
      return;
    }

    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.entries.entries()) {
      // Skip expired entries (they should be cleaned up, but handle them anyway)
      if (this.isExpired(entry)) {
        this.entries.delete(key);
        continue;
      }
      if (entry.accessTime < oldestTime) {
        oldestTime = entry.accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.entries.delete(oldestKey);
    }
  }
}

/**
 * Create a default LRU cache instance
 */
export function createCache(options: LRUCacheOptions): ICache {
  return new LRUCache(options);
}

