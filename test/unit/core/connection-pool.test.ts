/**
 * Connection pool tests
 * Tests connection reuse, pool size management, connection timeout handling, and pool exhaustion scenarios
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  ConnectionPool,
  ConnectionPoolOptions,
} from "../../../src/core/connection-pool.js";
import type { Connection } from "../../../src/core/connection-pool.js";

describe("Connection Pool", () => {
  let connectionPool: ConnectionPool<MockConnection>;

  beforeEach(() => {
    const options: ConnectionPoolOptions<MockConnection> = {
      maxSize: 10,
      minSize: 2,
      idleTimeoutMs: 5000,
      connectionTimeoutMs: 3000,
      createConnection: () => Promise.resolve(new MockConnection()),
    };
    connectionPool = new ConnectionPool(options);
  });

  describe("Connection reuse", () => {
    it("should reuse connections from pool", async () => {
      const connection1 = await connectionPool.acquire();
      expect(connection1).toBeDefined();
      await connectionPool.release(connection1);

      const connection2 = await connectionPool.acquire();
      expect(connection2).toBe(connection1); // Should reuse same connection
      await connectionPool.release(connection2);
    });

    it("should create new connections when pool is empty", async () => {
      const connection1 = await connectionPool.acquire();
      const connection2 = await connectionPool.acquire();
      expect(connection1).not.toBe(connection2); // Different connections
      await connectionPool.release(connection1);
      await connectionPool.release(connection2);
    });

    it("should maintain minimum pool size", async () => {
      const stats = connectionPool.getStats();
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBeGreaterThanOrEqual(2); // minSize
    });
  });

  describe("Pool size management", () => {
    it("should respect max pool size", async () => {
      const connections: MockConnection[] = [];

      // Acquire maxSize connections
      for (let i = 0; i < 10; i++) {
        const conn = await connectionPool.acquire();
        connections.push(conn);
      }

      const stats = connectionPool.getStats();
      expect(stats.activeConnections).toBe(10);
      expect(stats.totalConnections).toBeLessThanOrEqual(10);

      // Release all connections
      for (const conn of connections) {
        await connectionPool.release(conn);
      }
    });

    it("should handle pool exhaustion gracefully", async () => {
      const connections: MockConnection[] = [];

      // Acquire all available connections
      for (let i = 0; i < 10; i++) {
        const conn = await connectionPool.acquire();
        connections.push(conn);
      }

      // Try to acquire one more (should wait or timeout)
      const acquirePromise = connectionPool.acquire();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), 100);
      });

      await expect(Promise.race([acquirePromise, timeoutPromise])).rejects.toThrow("Timeout");

      // Release connections
      for (const conn of connections) {
        await connectionPool.release(conn);
      }
    });
  });

  describe("Connection timeout handling", () => {
    it("should timeout when connection creation takes too long", async () => {
      const slowPool = new ConnectionPool({
        maxSize: 5,
        minSize: 1,
        idleTimeoutMs: 5000,
        connectionTimeoutMs: 100,
        createConnection: (): Promise<MockConnection> => {
          return new Promise<MockConnection>((resolve) => {
            setTimeout(() => resolve(new MockConnection()), 500);
          });
        },
      });

      await expect(slowPool.acquire()).rejects.toThrow();
    });

    it("should handle connection creation errors", async () => {
      const errorPool = new ConnectionPool({
        maxSize: 5,
        minSize: 1,
        idleTimeoutMs: 5000,
        connectionTimeoutMs: 3000,
        createConnection: (): Promise<MockConnection> => {
          return Promise.reject(new Error("Connection failed"));
        },
      });

      await expect(errorPool.acquire()).rejects.toThrow("Connection failed");
    });
  });

  describe("Pool exhaustion scenarios", () => {
    it("should queue requests when pool is exhausted", async () => {
      const connections: MockConnection[] = [];

      // Acquire all connections
      for (let i = 0; i < 10; i++) {
        const conn = await connectionPool.acquire();
        connections.push(conn);
      }

      // Queue a request
      const queuedRequest = connectionPool.acquire();

      // Release one connection
      const firstConn = connections[0];
      if (!firstConn) {
        throw new Error("Failed to acquire first connection");
      }
      await connectionPool.release(firstConn);

      // Queued request should now succeed
      const acquired = await queuedRequest;
      if (!acquired) {
        throw new Error("Failed to acquire queued connection");
      }
      expect(acquired).toBeDefined();

      // Release remaining connections
      for (let i = 1; i < connections.length; i++) {
        const conn = connections[i];
        if (conn) {
          await connectionPool.release(conn);
        }
      }
      await connectionPool.release(acquired);
    });

    it("should handle connection cleanup on release", async () => {
      const connection = await connectionPool.acquire();
      expect(connection.isValid()).toBe(true);

      await connectionPool.release(connection);

      // Connection should still be valid after release
      expect(connection.isValid()).toBe(true);
    });
  });

  describe("Pool statistics", () => {
    it("should track pool statistics correctly", async () => {
      const stats1 = connectionPool.getStats();
      expect(stats1.activeConnections).toBe(0);
      expect(stats1.idleConnections).toBeGreaterThanOrEqual(2);

      const connection = await connectionPool.acquire();
      const stats2 = connectionPool.getStats();
      expect(stats2.activeConnections).toBe(1);
      expect(stats2.idleConnections).toBe(stats1.idleConnections - 1);

      await connectionPool.release(connection);
      const stats3 = connectionPool.getStats();
      expect(stats3.activeConnections).toBe(0);
      expect(stats3.idleConnections).toBeGreaterThanOrEqual(stats1.idleConnections);
    });
  });
});

/**
 * Mock connection for testing
 */
class MockConnection implements Connection {
  private valid = true;
  private lastUsed = Date.now();

  isValid(): boolean {
    return this.valid;
  }

  getLastUsed(): number {
    return this.lastUsed;
  }

  updateLastUsed(): void {
    this.lastUsed = Date.now();
  }

  close(): Promise<void> {
    this.valid = false;
    return Promise.resolve();
  }
}
