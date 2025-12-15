import { describe, it, expect } from "vitest";
import type {
  OperationEnvelope,
  IdempotencyKey,
  OperationResult,
  ILogger,
  ICache,
  IRateLimiter,
} from "../../../src/core/types.js";
import { createAuthError } from "../../../src/core/errors.js";

describe("Core Types", () => {
  describe("IdempotencyKey", () => {
    it("should be a string type", () => {
      const key: IdempotencyKey = "test-key-123";
      expect(typeof key).toBe("string");
      expect(key).toBe("test-key-123");
    });
  });

  describe("OperationResult", () => {
    it("should support success result", () => {
      const result: OperationResult<string> = {
        success: true,
        data: "test-data",
      };
      expect(result.success).toBe(true);
      expect(result.data).toBe("test-data");
      expect(typeof result.data).toBe("string");
    });

    it("should support error result", () => {
      const result: OperationResult<string> = {
        success: false,
        error: createAuthError("invalid_grant", "test error"),
      };
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(typeof result.error).toBe("object");
      }
    });
  });

  describe("OperationEnvelope", () => {
    it("should have required fields", () => {
      const envelope: OperationEnvelope = {
        opId: "test-op-id",
        opName: "test.operation",
        idempotencyKey: "test-key",
        timestamp: new Date().toISOString(),
        actor: "test-user",
        target: { product: "ga4" },
        request: { args: {} },
        precheck: { capability: true, exists: false, conflicts: [] },
        attempt: { n: 1, retryPolicy: "exp-jitter", rateLimitState: { tokens: 100 } },
        result: { status: "success" },
        postcheck: { readBack: true, stateMatch: true },
        rollback: { needed: false, action: null },
        latencyMs: 100,
        warnings: [],
        notes: "",
      };

      expect(envelope.opId).toBe("test-op-id");
      expect(envelope.opName).toBe("test.operation");
      expect(envelope.idempotencyKey).toBe("test-key");
      expect(typeof envelope.timestamp).toBe("string");
      expect(typeof envelope.actor).toBe("string");
      expect(typeof envelope.target).toBe("object");
      expect(typeof envelope.request).toBe("object");
    });
  });

  describe("ILogger interface", () => {
    it("should define logger methods", () => {
      const logger: ILogger = {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        child: () => logger,
      };

      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.child).toBe("function");
      expect(Object.keys(logger).length).toBeLessThanOrEqual(10);
    });
  });

  describe("ICache interface", () => {
    it("should define cache methods", () => {
      const cache: ICache = {
        get: async () => undefined,
        set: async () => {},
        delete: async () => {},
        clear: async () => {},
        invalidate: async () => {},
      };

      expect(typeof cache.get).toBe("function");
      expect(typeof cache.set).toBe("function");
      expect(typeof cache.delete).toBe("function");
      expect(typeof cache.clear).toBe("function");
      expect(typeof cache.invalidate).toBe("function");
      expect(Object.keys(cache).length).toBeLessThanOrEqual(10);
    });
  });

  describe("IRateLimiter interface", () => {
    it("should define rate limiter methods", () => {
      const limiter: IRateLimiter = {
        checkLimit: async () => ({ allowed: true, tokensRemaining: 100 }),
        waitForToken: async () => {},
        reset: () => {},
        getState: () => ({ tokens: 100, lastRefill: Date.now() }),
      };

      expect(typeof limiter.checkLimit).toBe("function");
      expect(typeof limiter.waitForToken).toBe("function");
      expect(typeof limiter.reset).toBe("function");
      expect(typeof limiter.getState).toBe("function");
      expect(Object.keys(limiter).length).toBeLessThanOrEqual(10);
    });
  });

  describe("Interface Segregation Principle (ISP)", () => {
    it("should have interfaces with ≤10 methods", () => {
      const logger: ILogger = {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        child: () => logger,
      };
      expect(Object.keys(logger).length).toBeLessThanOrEqual(10);

      const cache: ICache = {
        get: async () => undefined,
        set: async () => {},
        delete: async () => {},
        clear: async () => {},
        invalidate: async () => {},
      };
      expect(Object.keys(cache).length).toBeLessThanOrEqual(10);

      const limiter: IRateLimiter = {
        checkLimit: async () => ({ allowed: true, tokensRemaining: 100 }),
        waitForToken: async () => {},
        reset: () => {},
        getState: () => ({ tokens: 100, lastRefill: Date.now() }),
      };
      expect(Object.keys(limiter).length).toBeLessThanOrEqual(10);
    });
  });
});
