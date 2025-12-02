/**
 * GA4 Measurement Protocol client
 * Handles sending and validating events via Measurement Protocol API
 * Note: Measurement Protocol does not use OAuth, it uses API secrets
 */

import type { ILogger, IRateLimiter } from "../core/types.js";
import { createQuotaError, createServerError, createPreconditionError } from "../core/errors.js";

/**
 * Measurement Protocol client options
 */
export interface MeasurementProtocolClientOptions {
  logger: ILogger;
  rateLimiter: IRateLimiter;
  measurementId: string;
  apiSecret: string;
}

/**
 * Measurement Protocol event payload
 */
export interface MeasurementEvent {
  name: string;
  params?: Record<string, unknown>;
}

/**
 * Measurement Protocol request payload
 */
export interface MeasurementRequest {
  client_id?: string;
  user_id?: string;
  events: MeasurementEvent[];
  user_properties?: Record<string, { value?: string; set_once?: boolean }>;
  timestamp_micros?: string;
  non_personalized_ads?: boolean;
}

/**
 * Measurement Protocol validation response
 */
export interface ValidationResponse {
  validationMessages: Array<{
    fieldPath?: string;
    description: string;
    validationCode?: string;
  }>;
}

/**
 * GA4 Measurement Protocol client
 * Sends and validates events via the Measurement Protocol API
 */
export class MeasurementProtocolClient {
  private readonly logger: ILogger;
  private readonly rateLimiter: IRateLimiter;
  private readonly measurementId: string;
  private readonly apiSecret: string;
  private readonly baseUrl = "https://www.google-analytics.com";
  private readonly sendEndpoint = "/mp/collect";
  private readonly validateEndpoint = "/debug/mp/collect";

  constructor(options: MeasurementProtocolClientOptions) {
    if (!options.logger) {
      throw new Error("Logger is required");
    }
    if (!options.rateLimiter) {
      throw new Error("Rate limiter is required");
    }
    if (!options.measurementId) {
      throw new Error("Measurement ID is required");
    }
    if (!options.apiSecret) {
      throw new Error("API secret is required");
    }

    this.logger = options.logger;
    this.rateLimiter = options.rateLimiter;
    this.measurementId = options.measurementId;
    this.apiSecret = options.apiSecret;
  }

  /**
   * Check rate limit before making request
   * @param operation - Operation name (send or validate)
   */
  private async checkRateLimit(operation: string): Promise<void> {
    const result = await this.rateLimiter.checkLimit("ga4", `measurement.${operation}`);

    if (!result.allowed) {
      if (result.retryAfter) {
        this.logger.warn("Rate limited, waiting", {
          operation,
          retryAfter: result.retryAfter,
        });
        await this.rateLimiter.waitForToken("ga4", `measurement.${operation}`);
      } else {
        throw createQuotaError(
          "rate_limited",
          "Rate limit exceeded",
          undefined,
          result.retryAfter,
          { operation }
        );
      }
    }
  }

  /**
   * Build Measurement Protocol URL
   * @param endpoint - Endpoint path
   * @returns Full URL with query parameters
   */
  private buildUrl(endpoint: string): string {
    const url = new URL(endpoint, this.baseUrl);
    url.searchParams.set("measurement_id", this.measurementId);
    url.searchParams.set("api_secret", this.apiSecret);
    return url.toString();
  }

  /**
   * Send event via Measurement Protocol
   * @param payload - Event payload
   * @returns Promise that resolves when event is sent
   */
  async sendEvent(payload: MeasurementRequest): Promise<void> {
    await this.checkRateLimit("send");

    const url = this.buildUrl(this.sendEndpoint);

    this.logger.debug("Sending Measurement Protocol event", {
      measurementId: this.measurementId,
      eventCount: payload.events.length,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status >= 500) {
        throw createServerError(
          response.status,
          `Measurement Protocol send failed: ${response.statusText}`,
          { response: errorText }
        );
      }
      throw createPreconditionError(
        "precheck_failed",
        `Measurement Protocol send failed: ${response.status} ${response.statusText}`,
        { status: response.status, response: errorText }
      );
    }

    this.logger.debug("Measurement Protocol event sent successfully");
  }

  /**
   * Validate event structure without sending
   * @param payload - Event payload to validate
   * @returns Validation response with messages
   */
  async validateEvent(payload: MeasurementRequest): Promise<ValidationResponse> {
    await this.checkRateLimit("validate");

    const url = this.buildUrl(this.validateEndpoint);

    this.logger.debug("Validating Measurement Protocol event", {
      measurementId: this.measurementId,
      eventCount: payload.events.length,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status >= 500) {
        throw createServerError(
          response.status,
          `Measurement Protocol validate failed: ${response.statusText}`,
          { response: errorText }
        );
      }
      throw createPreconditionError(
        "precheck_failed",
        `Measurement Protocol validate failed: ${response.status} ${response.statusText}`,
        { status: response.status, response: errorText }
      );
    }

    const result = (await response.json()) as ValidationResponse;
    this.logger.debug("Measurement Protocol validation completed", {
      messageCount: result.validationMessages.length,
    });

    return result;
  }
}

