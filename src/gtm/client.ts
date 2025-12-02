/**
 * GTM REST client wrapper
 * Integrates googleapis Tag Manager API v2 with rate limiting, logging, and OAuth
 */

import { google } from "googleapis";
import type { tagmanager_v2 } from "googleapis";
import type { ILogger, IRateLimiter } from "../core/types.js";
import type { OAuthClient } from "../core/oauth.js";
import { createQuotaError } from "../core/errors.js";

/**
 * GTM client options
 */
export interface GTMClientOptions {
  logger: ILogger;
  rateLimiter: IRateLimiter;
  oauthClient: OAuthClient;
}

/**
 * GTM REST client wrapper
 * Provides access to Tag Manager API v2
 */
export class GTMClient {
  private readonly logger: ILogger;
  private readonly rateLimiter: IRateLimiter;
  private readonly oauthClient: OAuthClient;
  private tagManagerClient: tagmanager_v2.Tagmanager | undefined;

  constructor(options: GTMClientOptions) {
    if (!options.logger || !options.rateLimiter || !options.oauthClient) {
      throw new Error("Logger, rate limiter, and OAuth client are required");
    }

    this.logger = options.logger;
    this.rateLimiter = options.rateLimiter;
    this.oauthClient = options.oauthClient;
  }

  /**
   * Get Tag Manager API v2 client
   * @returns Tag Manager API client
   */
  getTagManagerClient(): tagmanager_v2.Tagmanager {
    if (!this.tagManagerClient) {
      const auth = this.oauthClient.getOAuth2Client();
      this.tagManagerClient = google.tagmanager({
        version: "v2",
        auth,
      });
      this.logger.debug("Tag Manager API client initialized");
    }
    return this.tagManagerClient;
  }

  /**
   * Check rate limit before making request
   * @param product - Product name (gtm)
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

