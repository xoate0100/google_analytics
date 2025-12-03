/**
 * Adaptive backoff implementation
 * Supports exponential backoff with jitter and Retry-After header parsing
 */

/**
 * Backoff configuration options
 */
export interface BackoffOptions {
  initialDelay: number; // Initial delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  multiplier: number; // Exponential multiplier (typically 2)
}

/**
 * Adaptive backoff calculator
 * Implements exponential backoff with jitter and Retry-After header support
 */
export class AdaptiveBackoff {
  private readonly initialDelay: number;
  private readonly maxDelay: number;
  private readonly multiplier: number;

  constructor(options: BackoffOptions) {
    this.initialDelay = options.initialDelay;
    this.maxDelay = options.maxDelay;
    this.multiplier = options.multiplier;
  }

  /**
   * Calculate exponential backoff delay with jitter
   * @param attemptNumber - Current attempt number (1-based)
   * @returns Delay in milliseconds
   */
  calculateDelay(attemptNumber: number): number {
    const baseDelay = this.initialDelay * Math.pow(this.multiplier, attemptNumber - 1);
    const cappedDelay = Math.min(baseDelay, this.maxDelay);

    // Add jitter: random value between 0 and 25% of delay
    const jitter = Math.random() * cappedDelay * 0.25;
    const finalDelay = cappedDelay + jitter;
    // Cap final delay to maxDelay
    return Math.floor(Math.min(finalDelay, this.maxDelay));
  }

  /**
   * Parse Retry-After header value
   * Supports both seconds (integer) and HTTP date formats
   * @param retryAfter - Retry-After header value
   * @returns Delay in milliseconds, or undefined if parsing fails
   */
  parseRetryAfter(retryAfter: string): number {
    // Try parsing as seconds (integer)
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds) && seconds > 0) {
      return seconds * 1000;
    }

    // Try parsing as HTTP date
    const date = new Date(retryAfter);
    if (!isNaN(date.getTime())) {
      const now = Date.now();
      const delay = date.getTime() - now;
      return delay > 0 ? delay : 0;
    }

    // Fallback to 0 if parsing fails
    return 0;
  }

  /**
   * Get delay for a given attempt, preferring Retry-After if provided
   * @param attemptNumber - Current attempt number (1-based)
   * @param retryAfter - Optional Retry-After header value
   * @returns Delay in milliseconds
   */
  getDelay(attemptNumber: number, retryAfter?: string): number {
    if (retryAfter) {
      const parsedDelay = this.parseRetryAfter(retryAfter);
      if (parsedDelay > 0) {
        return parsedDelay;
      }
    }
    return this.calculateDelay(attemptNumber);
  }
}

/**
 * Create a default backoff instance
 */
export function createBackoff(options: BackoffOptions): AdaptiveBackoff {
  return new AdaptiveBackoff(options);
}
