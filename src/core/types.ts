/**
 * Core type definitions for MCP Google Marketing server
 * Follows SOLID principles: DIP (interfaces), ISP (≤10 methods per interface)
 */

import type { MCPError } from "./errors.js";

/**
 * Idempotency key type
 * Used to ensure operations are idempotent
 */
export type IdempotencyKey = string;

/**
 * Operation result type
 * Represents the result of an operation (success or error)
 */
export type OperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: MCPError };

/**
 * Operation target information
 * Identifies the target resource for an operation
 */
export interface OperationTarget {
  product: "ga4" | "gtm" | "ads";
  accountId?: string;
  propertyId?: string;
  containerId?: string;
  [key: string]: unknown;
}

/**
 * Pre-check information
 * Results of pre-operation validation
 */
export interface Precheck {
  capability: boolean;
  exists: boolean;
  conflicts: string[];
}

/**
 * Attempt information
 * Details about the current operation attempt
 */
export interface Attempt {
  n: number;
  retryPolicy: "exp-jitter" | "linear" | "none";
  rateLimitState: {
    tokens: number;
    lastRefill?: number;
  };
}

/**
 * Operation result status
 */
export interface OperationResultStatus {
  status: "success" | "failure" | "partial";
  resourceId?: string;
  etag?: string;
  error?: MCPError;
}

/**
 * Post-check information
 * Results of post-operation validation
 */
export interface Postcheck {
  readBack: boolean;
  stateMatch: boolean;
  discrepancies?: string[];
}

/**
 * Rollback information
 * Details about rollback operations
 */
export interface Rollback {
  needed: boolean;
  action: (() => Promise<void>) | null;
  compensation?: unknown;
}

/**
 * Operation envelope
 * Wraps all operations with metadata for observability and idempotency
 */
export interface OperationEnvelope {
  opId: string; // UUID v7
  opName: string; // e.g., "ga4.report.run"
  idempotencyKey: IdempotencyKey;
  timestamp: string; // ISO8601
  actor: string;
  target: OperationTarget;
  request: {
    args: Record<string, unknown>;
  };
  precheck: Precheck;
  attempt: Attempt;
  result: OperationResultStatus;
  postcheck: Postcheck;
  rollback: Rollback;
  latencyMs: number;
  warnings: string[];
  notes: string;
}

/**
 * Logger interface (ISP: ≤10 methods)
 * Structured logging with correlation IDs
 */
export interface ILogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  child(context: Record<string, unknown>): ILogger;
}

/**
 * Cache interface (ISP: ≤10 methods)
 * LRU cache with TTL and ETag support
 */
export interface ICache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  invalidate(pattern: string): Promise<void>;
}

/**
 * Rate limiter state
 */
export interface RateLimiterState {
  tokens: number;
  lastRefill: number;
  burstAllowance?: number;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  tokensRemaining: number;
  retryAfter?: number;
}

/**
 * Rate limiter interface (ISP: ≤10 methods)
 * Token bucket rate limiter with adaptive backoff
 */
export interface IRateLimiter {
  checkLimit(product: string, operation: string): Promise<RateLimitResult>;
  waitForToken(product: string, operation: string): Promise<void>;
  reset(product: string): void;
  getState(product: string): RateLimiterState | undefined;
}

/**
 * Product capabilities type
 * Represents capabilities for a specific product (ga4, gtm, ads)
 */
export type ProductCapabilities = Record<string, unknown>;

/**
 * Capabilities registry interface (ISP: ≤10 methods)
 * Tracks available capabilities per product
 */
export interface ICapabilitiesRegistry {
  hasCapability(product: string, capability: string): boolean;
  getProductCapabilities(product: string): ProductCapabilities | undefined;
  setProductCapabilities(
    product: string,
    capabilities: ProductCapabilities
  ): void;
  refresh(): Promise<void>;
}
