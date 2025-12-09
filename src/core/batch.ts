/**
 * Batch operation processor
 * Optimizes batch operations with configurable batch size, concurrency, and timeout
 */

/**
 * Batch processor options
 */
export interface BatchProcessorOptions {
  batchSize: number;
  maxConcurrency: number;
  timeoutMs: number;
}

/**
 * Individual batch item result
 */
export interface BatchItemResult<T> {
  success: boolean;
  result?: T;
  error?: string;
}

/**
 * Batch processing result
 */
export interface BatchResult<T> {
  results: Array<BatchItemResult<T>>;
  successCount: number;
  failureCount: number;
  totalDurationMs: number;
}

/**
 * Batch processor statistics
 */
export interface BatchStats {
  activeBatches: number;
  totalProcessed: number;
  totalSuccess: number;
  totalFailures: number;
}

/**
 * Semaphore for concurrency control
 */
class Semaphore {
  private available: number;
  private waiters: Array<() => void> = [];

  constructor(count: number) {
    this.available = count;
  }

  async acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  release(): void {
    if (this.waiters.length > 0) {
      const resolve = this.waiters.shift();
      if (resolve) resolve();
    } else {
      this.available++;
    }
  }
}

/**
 * Batch processor for optimizing batch operations
 * Handles batching, concurrency control, and timeout management
 */
export class BatchProcessor<TInput, TOutput> {
  private readonly batchSize: number;
  private readonly maxConcurrency: number;
  private readonly timeoutMs: number;
  private activeBatches = 0;
  private totalProcessed = 0;
  private totalSuccess = 0;
  private totalFailures = 0;

  constructor(options: BatchProcessorOptions) {
    this.batchSize = options.batchSize;
    this.maxConcurrency = options.maxConcurrency;
    this.timeoutMs = options.timeoutMs;
  }

  /**
   * Process a batch of items with optimized concurrency
   */
  async processBatch(
    items: TInput[],
    processor: (item: TInput) => Promise<TOutput>
  ): Promise<BatchResult<TOutput>> {
    const startTime = Date.now();
    this.activeBatches++;

    try {
      const results = await this.processItemsWithConcurrency(items, processor);
      const duration = Date.now() - startTime;

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      this.totalProcessed += items.length;
      this.totalSuccess += successCount;
      this.totalFailures += failureCount;

      return {
        results,
        successCount,
        failureCount,
        totalDurationMs: duration,
      };
    } finally {
      this.activeBatches--;
    }
  }

  /**
   * Process items with concurrency control
   */
  private async processItemsWithConcurrency(
    items: TInput[],
    processor: (item: TInput) => Promise<TOutput>
  ): Promise<Array<BatchItemResult<TOutput>>> {
    const batches = this.createBatches(items);
    const semaphore = new Semaphore(this.maxConcurrency);
    const allResults: Array<BatchItemResult<TOutput>> = [];

    for (const batch of batches) {
      const processItem = async (item: TInput): Promise<BatchItemResult<TOutput>> => {
        await semaphore.acquire();
        try {
          return await this.processItemWithTimeout(item, processor);
        } finally {
          semaphore.release();
        }
      };

      const itemPromises = batch.map((item) => processItem(item));
      const itemResults = await Promise.allSettled(itemPromises);

      const batchResults = itemResults.map((result) => {
        if (result.status === "fulfilled") {
          return result.value;
        }
        return {
          success: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        };
      });

      allResults.push(...batchResults);
    }

    return allResults;
  }

  /**
   * Create batches from items based on batchSize
   */
  private createBatches(items: TInput[]): TInput[][] {
    const batches: TInput[][] = [];
    for (let i = 0; i < items.length; i += this.batchSize) {
      batches.push(items.slice(i, i + this.batchSize));
    }
    return batches;
  }



  /**
   * Process a single item with timeout
   */
  private async processItemWithTimeout(
    item: TInput,
    processor: (item: TInput) => Promise<TOutput>
  ): Promise<BatchItemResult<TOutput>> {
    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<BatchItemResult<TOutput>>((resolve) => {
      timeoutId = setTimeout(() => {
        resolve({
          success: false,
          error: `Operation timed out after ${this.timeoutMs}ms`,
        });
      }, this.timeoutMs);
    });

    const processPromise = processor(item)
      .then(
        (result) => {
          if (timeoutId) clearTimeout(timeoutId);
          return { success: true, result };
        },
        (error) => {
          if (timeoutId) clearTimeout(timeoutId);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      )
      .catch((error) => {
        if (timeoutId) clearTimeout(timeoutId);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      });

    const result = await Promise.race([processPromise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  }

  /**
   * Get batch processor statistics
   */
  getStats(): BatchStats {
    return {
      activeBatches: this.activeBatches,
      totalProcessed: this.totalProcessed,
      totalSuccess: this.totalSuccess,
      totalFailures: this.totalFailures,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.totalProcessed = 0;
    this.totalSuccess = 0;
    this.totalFailures = 0;
  }
}
