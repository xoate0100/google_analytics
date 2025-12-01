/**
 * GA4 REST client wrapper
 * Integrates googleapis with rate limiting, logging, and OAuth
 */

import { google } from "googleapis";
import type { analyticsdata_v1beta } from "googleapis";
import type { analyticsadmin_v1beta } from "googleapis";
import type { ILogger, IRateLimiter } from "../core/types.js";
import type { OAuthClient } from "../core/oauth.js";
import { createQuotaError } from "../core/errors.js";

/**
 * GA4 client options
 */
export interface GA4ClientOptions {
  logger: ILogger;
  rateLimiter: IRateLimiter;
  oauthClient: OAuthClient;
}

/**
 * GA4 REST client wrapper
 * Provides access to Analytics Data API and Admin API
 */
export class GA4Client {
  private readonly logger: ILogger;
  private readonly rateLimiter: IRateLimiter;
  private readonly oauthClient: OAuthClient;
  private analyticsDataClient: analyticsdata_v1beta.Analyticsdata | undefined;
  private analyticsAdminClient: analyticsadmin_v1beta.Analyticsadmin | undefined;

  constructor(options: GA4ClientOptions) {
    if (!options.logger || !options.rateLimiter || !options.oauthClient) {
      throw new Error("Logger, rate limiter, and OAuth client are required");
    }

    this.logger = options.logger;
    this.rateLimiter = options.rateLimiter;
    this.oauthClient = options.oauthClient;
  }

  /**
   * Get Analytics Data API client
   * @returns Analytics Data API client
   */
  getAnalyticsDataClient(): analyticsdata_v1beta.Analyticsdata {
    if (!this.analyticsDataClient) {
      const auth = this.oauthClient.getOAuth2Client();
      this.analyticsDataClient = google.analyticsdata({
        version: "v1beta",
        auth,
      });
      this.logger.debug("Analytics Data API client initialized");
    }
    return this.analyticsDataClient;
  }

  /**
   * Get Analytics Admin API client
   * @returns Analytics Admin API client
   */
  getAnalyticsAdminClient(): analyticsadmin_v1beta.Analyticsadmin {
    if (!this.analyticsAdminClient) {
      const auth = this.oauthClient.getOAuth2Client();
      this.analyticsAdminClient = google.analyticsadmin({
        version: "v1beta",
        auth,
      });
      this.logger.debug("Analytics Admin API client initialized");
    }
    return this.analyticsAdminClient;
  }

  /**
   * Check rate limit before making request
   * @param product - Product name (ga4)
   * @param operation - Operation name
   */
  async checkRateLimit(product: string, operation: string): Promise<void> {
    const result = await this.rateLimiter.checkLimit(product, operation);

    if (!result.allowed) {
      if (result.retryAfter) {
        this.logger.warn("Rate limited, waiting", {
          product,
          operation,
          retryAfter: result.retryAfter,
        });
        await this.rateLimiter.waitForToken(product, operation);
      } else {
        throw createQuotaError(
          "rate_limited",
          "Rate limit exceeded",
          undefined,
          result.retryAfter,
          { product, operation }
        );
      }
    }
  }
}

