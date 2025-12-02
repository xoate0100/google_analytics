/**
 * Token bucket rate limiter implementation
 * Supports per-product QPS and burst limits
 */

import type {
  IRateLimiter,
  RateLimitResult,
  RateLimiterState,
} from "./types.js";

/**
 * Product-specific rate limit configuration
 */
export interface ProductLimits {
  qps: number; // Queries per second
  burst: number; // Maximum burst allowance
}

/**
 * Token bucket limiter options
 */
export interface TokenBucketLimiterOptions {
  defaultQPS: number;
  defaultBurst: number;
  productLimits?: Record<string, ProductLimits>;
}

/**
 * Internal token bucket state
 */
interface TokenBucket {
  tokens: number;
  lastRefill: number;
  qps: number;
  burst: number;
}

/**
 * Token bucket rate limiter implementation
 * Uses token bucket algorithm with per-product configuration
 */
export class TokenBucketLimiter implements IRateLimiter {
  private readonly buckets: Map<string, TokenBucket>;
  private readonly defaultQPS: number;
  private readonly defaultBurst: number;
  private readonly productLimits: Record<string, ProductLimits>;

  constructor(options: TokenBucketLimiterOptions) {
    this.buckets = new Map();
    this.defaultQPS = options.defaultQPS;
    this.defaultBurst = options.defaultBurst;
    this.productLimits = options.productLimits || {};
  }

  async checkLimit(
    product: string,
    _operation: string
  ): Promise<RateLimitResult> {
    const bucket = this.getOrCreateBucket(product);
    this.refillTokens(bucket);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      const result: RateLimitResult = {
        allowed: true,
        tokensRemaining: Math.floor(bucket.tokens),
      };
      return Promise.resolve(result);
    }

    // Calculate retry after (time until next token available)
    const tokensNeeded = 1 - bucket.tokens;
    const refillTime = (tokensNeeded / bucket.qps) * 1000; // Convert to ms
    return Promise.resolve({
      allowed: false,
      tokensRemaining: 0,
      retryAfter: Math.ceil(refillTime),
    });
  }

  async waitForToken(product: string, operation: string): Promise<void> {
    const result = await this.checkLimit(product, operation);
    if (result.allowed) {
      return Promise.resolve();
    }

    // Wait for retry after time
    if (result.retryAfter) {
      await new Promise((resolve) =>
        setTimeout(resolve, result.retryAfter)
      );
      // Retry after waiting
      return this.waitForToken(product, operation);
    }

    return Promise.resolve();
  }

  reset(product: string): void {
    const bucket = this.buckets.get(product);
    if (bucket) {
      bucket.tokens = bucket.burst;
      bucket.lastRefill = Date.now();
    }
  }

  getState(product: string): RateLimiterState | undefined {
    const bucket = this.buckets.get(product);
    if (!bucket) {
      return undefined;
    }
    this.refillTokens(bucket);
    return {
      tokens: Math.floor(bucket.tokens),
      lastRefill: bucket.lastRefill,
      burstAllowance: bucket.burst,
    };
  }

  private getOrCreateBucket(product: string): TokenBucket {
    let bucket = this.buckets.get(product);
    if (!bucket) {
      const limits = this.productLimits[product] || {
        qps: this.defaultQPS,
        burst: this.defaultBurst,
      };
      bucket = {
        tokens: limits.burst,
        lastRefill: Date.now(),
        qps: limits.qps,
        burst: limits.burst,
      };
      this.buckets.set(product, bucket);
    }
    return bucket;
  }

  private refillTokens(bucket: TokenBucket): void {
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = (elapsed / 1000) * bucket.qps; // QPS = tokens per second

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.tokens + tokensToAdd, bucket.burst);
      bucket.lastRefill = now;
    }
  }
}

/**
 * Create a default rate limiter instance
 */
export function createRateLimiter(
  options: TokenBucketLimiterOptions
): IRateLimiter {
  return new TokenBucketLimiter(options);
}

