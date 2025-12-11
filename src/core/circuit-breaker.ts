/**
 * Circuit breaker implementation
 * Prevents cascading failures by opening circuit after threshold failures
 */

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = "closed", // Normal operation, allowing requests
  OPEN = "open", // Circuit is open, blocking requests
  HALF_OPEN = "half_open", // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of consecutive failures to trip
  resetTimeout: number; // Time in ms before attempting half-open
  halfOpenMaxAttempts: number; // Max attempts allowed in half-open state
}

/**
 * Circuit breaker state tracking
 */
interface CircuitStateData {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  halfOpenAttempts: number;
}

/**
 * Circuit breaker implementation
 * Trips after consecutive failures, transitions to half-open for testing
 */
export class CircuitBreaker {
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly halfOpenMaxAttempts: number;
  private stateData: CircuitStateData;

  constructor(options: CircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold;
    this.resetTimeout = options.resetTimeout;
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts;
    this.stateData = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      lastFailureTime: 0,
      halfOpenAttempts: 0,
    };
  }

  /**
   * Check if circuit allows attempts
   */
  canAttempt(): boolean {
    this.checkReset();
    return this.stateData.state !== CircuitState.OPEN;
  }

  /**
   * Check if circuit is open
   */
  isOpen(): boolean {
    this.checkReset();
    return this.stateData.state === CircuitState.OPEN;
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    this.checkReset();
    return this.stateData.state;
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    if (this.stateData.state === CircuitState.HALF_OPEN) {
      // Success in half-open: close the circuit
      this.stateData = {
        state: CircuitState.CLOSED,
        failureCount: 0,
        lastFailureTime: 0,
        halfOpenAttempts: 0,
      };
    } else if (this.stateData.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.stateData.failureCount = 0;
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure(): void {
    if (this.stateData.state === CircuitState.HALF_OPEN) {
      // Failure in half-open: reopen circuit
      this.stateData = {
        state: CircuitState.OPEN,
        failureCount: this.failureThreshold,
        lastFailureTime: Date.now(),
        halfOpenAttempts: 0,
      };
    } else if (this.stateData.state === CircuitState.CLOSED) {
      this.stateData.failureCount += 1;
      this.stateData.lastFailureTime = Date.now();

      if (this.stateData.failureCount >= this.failureThreshold) {
        this.stateData.state = CircuitState.OPEN;
      }
    }
  }

  /**
   * Record an attempt (used in half-open state)
   */
  recordAttempt(): void {
    if (this.stateData.state === CircuitState.HALF_OPEN) {
      this.stateData.halfOpenAttempts += 1;
      if (this.stateData.halfOpenAttempts >= this.halfOpenMaxAttempts) {
        // Too many attempts in half-open, reopen
        this.stateData.state = CircuitState.OPEN;
        this.stateData.lastFailureTime = Date.now();
      }
    }
  }

  /**
   * Check if circuit should reset (transition to half-open)
   */
  checkReset(): void {
    if (
      this.stateData.state === CircuitState.OPEN &&
      Date.now() - this.stateData.lastFailureTime >= this.resetTimeout
    ) {
      // Transition to half-open for testing
      this.stateData = {
        state: CircuitState.HALF_OPEN,
        failureCount: 0,
        lastFailureTime: 0,
        halfOpenAttempts: 0,
      };
    }
  }
}

/**
 * Create a default circuit breaker instance
 */
export function createCircuitBreaker(
  options: CircuitBreakerOptions
): CircuitBreaker {
  return new CircuitBreaker(options);
}
