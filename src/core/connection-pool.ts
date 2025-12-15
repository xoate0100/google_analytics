/**
 * Connection pool implementation
 * Manages connection reuse, pool size, and connection lifecycle
 */

/**
 * Connection interface
 */
export interface Connection {
  isValid(): boolean;
  getLastUsed(): number;
  updateLastUsed(): void;
  close(): Promise<void>;
}

/**
 * Connection pool options
 */
export interface ConnectionPoolOptions<T> {
  maxSize: number;
  minSize: number;
  idleTimeoutMs: number;
  connectionTimeoutMs: number;
  createConnection: () => Promise<T>;
}

/**
 * Connection pool statistics
 */
export interface ConnectionPoolStats {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  queuedRequests: number;
}

/**
 * Wrapped connection with metadata
 */
interface PooledConnection<T> {
  connection: T;
  lastUsed: number;
  inUse: boolean;
}

/**
 * Connection pool for managing API client connections
 * Provides connection reuse, pool size management, and timeout handling
 */
export class ConnectionPool<T extends Connection> {
  private readonly maxSize: number;
  private readonly minSize: number;
  private readonly idleTimeoutMs: number;
  private readonly connectionTimeoutMs: number;
  private readonly createConnection: () => Promise<T>;
  private readonly pool: Array<PooledConnection<T>> = [];
  private readonly waitQueue: Array<{
    resolve: (conn: T) => void;
    reject: (error: Error) => void;
  }> = [];
  private cleanupInterval: NodeJS.Timeout | undefined;

  constructor(options: ConnectionPoolOptions<T>) {
    this.maxSize = options.maxSize;
    this.minSize = options.minSize;
    this.idleTimeoutMs = options.idleTimeoutMs;
    this.connectionTimeoutMs = options.connectionTimeoutMs;
    this.createConnection = options.createConnection;

    this.initializePool();
    this.startCleanupInterval();
  }

  /**
   * Initialize pool with minimum connections
   */
  private initializePool(): void {
    // Initialize pool asynchronously without blocking
    void (async (): Promise<void> => {
      for (let i = 0; i < this.minSize; i++) {
        try {
          const conn = await this.createConnectionWithTimeout();
          this.pool.push({
            connection: conn,
            lastUsed: Date.now(),
            inUse: false,
          });
        } catch {
          // Ignore initialization errors, pool will create on demand
        }
      }
    })();
  }

  /**
   * Start cleanup interval for idle connections
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, this.idleTimeoutMs / 2);
  }

  /**
   * Cleanup idle connections that exceed timeout
   */
  private cleanupIdleConnections(): void {
    const now = Date.now();
    const idleConnections = this.pool.filter(
      (pc) => !pc.inUse && now - pc.lastUsed > this.idleTimeoutMs
    );

    // Keep at least minSize connections
    const toRemove = Math.max(0, idleConnections.length - this.minSize);

    for (let i = 0; i < toRemove; i++) {
      const pc = idleConnections[i];
      if (pc) {
        const index = this.pool.indexOf(pc);
        if (index >= 0) {
          this.pool.splice(index, 1);
          void pc.connection.close();
        }
      }
    }
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<T> {
    // Try to find an idle connection
    const idleConnection = this.pool.find((pc) => !pc.inUse);
    if (idleConnection) {
      idleConnection.inUse = true;
      idleConnection.lastUsed = Date.now();
      idleConnection.connection.updateLastUsed();
      return idleConnection.connection;
    }

    // Create new connection if under max size
    if (this.pool.length < this.maxSize) {
      const conn = await this.createConnectionWithTimeout();
      const pooled: PooledConnection<T> = {
        connection: conn,
        lastUsed: Date.now(),
        inUse: true,
      };
      this.pool.push(pooled);
      conn.updateLastUsed();
      return conn;
    }

    // Wait for a connection to become available
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitQueue.findIndex((w) => w.reject === reject);
        if (index >= 0) {
          this.waitQueue.splice(index, 1);
        }
        reject(new Error("Connection acquisition timeout"));
      }, this.connectionTimeoutMs);

      this.waitQueue.push({
        resolve: (conn: T) => {
          clearTimeout(timeout);
          resolve(conn);
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });
    });
  }

  /**
   * Release a connection back to the pool
   */
  async release(connection: T): Promise<void> {
    const pooled = this.pool.find((pc) => pc.connection === connection);
    if (!pooled) {
      return;
    }

    if (!connection.isValid()) {
      // Remove invalid connection
      const index = this.pool.indexOf(pooled);
      if (index >= 0) {
        this.pool.splice(index, 1);
      }
      await connection.close();
    } else {
      // Return to pool
      pooled.inUse = false;
      pooled.lastUsed = Date.now();
      connection.updateLastUsed();
    }

    // Process wait queue
    if (this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift();
      if (waiter) {
        const conn = await this.acquire();
        waiter.resolve(conn);
      }
    }
  }

  /**
   * Create connection with timeout
   */
  private async createConnectionWithTimeout(): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Connection creation timed out after ${this.connectionTimeoutMs}ms`));
      }, this.connectionTimeoutMs);
    });

    return Promise.race([this.createConnection(), timeoutPromise]);
  }

  /**
   * Get pool statistics
   */
  getStats(): ConnectionPoolStats {
    return {
      activeConnections: this.pool.filter((pc) => pc.inUse).length,
      idleConnections: this.pool.filter((pc) => !pc.inUse).length,
      totalConnections: this.pool.length,
      queuedRequests: this.waitQueue.length,
    };
  }

  /**
   * Close all connections and cleanup
   */
  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    await Promise.all(this.pool.map((pc) => pc.connection.close()));
    this.pool.length = 0;
    this.waitQueue.length = 0;
  }
}
