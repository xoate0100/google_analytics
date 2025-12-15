/**
 * Integration test helpers for mocking Google APIs
 * Provides utilities for setting up mocked Google API responses
 */

import nock from "nock";
import type { ILogger, ICache, IRateLimiter, ICapabilitiesRegistry } from "../../../src/core/types.js";
import type { GA4Client } from "../../../src/ga4/client.js";
import type { GTMClient } from "../../../src/gtm/client.js";
import type { AdsClient } from "../../../src/ads/client.js";
import type { OAuthClient } from "../../../src/core/oauth.js";
import { LRUCache } from "../../../src/core/cache.js";
import { TokenBucketLimiter } from "../../../src/core/limiter.js";
import { CapabilitiesRegistry } from "../../../src/core/capabilities.js";
import { PinoLogger } from "../../../src/core/logger.js";

/**
 * Base URL for Google Analytics Data API
 */
export const GA4_DATA_API_BASE = "https://analyticsdata.googleapis.com";

/**
 * Base URL for Google Analytics Admin API
 */
export const GA4_ADMIN_API_BASE = "https://analyticsadmin.googleapis.com";

/**
 * Base URL for Google OAuth API
 */
export const OAUTH_API_BASE = "https://oauth2.googleapis.com";

/**
 * Base URL for Google Tag Manager API
 */
export const GTM_API_BASE = "https://tagmanager.googleapis.com";

/**
 * Create a mock logger for integration tests
 */
export function createMockLogger(): ILogger {
  return {
    debug: (): void => {},
    info: (): void => {},
    warn: (): void => {},
    error: (): void => {},
    child: (): ILogger => new PinoLogger({ level: "silent" }),
  };
}

/**
 * Create a real cache instance for integration tests
 */
export function createTestCache(): ICache {
  return new LRUCache({ maxSize: 1000, defaultTTL: 300000 });
}

/**
 * Create a real rate limiter instance for integration tests
 */
export function createTestRateLimiter(): IRateLimiter {
  return new TokenBucketLimiter({
    defaultQPS: 50,
    defaultBurst: 5,
    productLimits: {
      ga4: { qps: 100, burst: 10 },
      gtm: { qps: 50, burst: 5 },
      ads: { qps: 50, burst: 5 },
    },
  });
}

/**
 * Create a real capabilities registry for integration tests
 */
export function createTestCapabilitiesRegistry(): ICapabilitiesRegistry {
  return new CapabilitiesRegistry();
}

/**
 * Mock GA4 Data API response
 */
export function mockGA4DataAPI(
  method: "GET" | "POST",
  path: string,
  status: number,
  responseBody: unknown
): nock.Scope {
  return nock(GA4_DATA_API_BASE)[method.toLowerCase() as "get" | "post"](path).reply(status, responseBody as nock.Body);
}

/**
 * Mock GA4 Admin API response
 */
export function mockGA4AdminAPI(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  status: number,
  responseBody: unknown
): nock.Scope {
  const methodName = method.toLowerCase() as "get" | "post" | "patch" | "delete";
  return nock(GA4_ADMIN_API_BASE)[methodName](path).reply(status, responseBody as nock.Body);
}

/**
 * Mock OAuth token endpoint
 */
export function mockOAuthTokenEndpoint(
  status: number,
  responseBody: unknown
): nock.Scope {
  return nock(OAUTH_API_BASE).post("/token").reply(status, responseBody as nock.Body);
}

/**
 * Mock OAuth device code endpoint
 */
export function mockOAuthDeviceCodeEndpoint(
  status: number,
  responseBody: unknown
): nock.Scope {
  return nock(OAUTH_API_BASE).post("/device/code").reply(status, responseBody as nock.Body);
}

/**
 * Create integration test context with all dependencies
 */
export interface IntegrationTestContext {
  logger: ILogger;
  cache: ICache;
  rateLimiter: IRateLimiter;
  capabilitiesRegistry: ICapabilitiesRegistry;
  oauthClient: OAuthClient;
  ga4Client: GA4Client;
  gtmClient?: GTMClient;
  adsClient?: AdsClient;
}

/**
 * Create a complete integration test context
 */
export async function createIntegrationTestContext(): Promise<IntegrationTestContext> {
  const logger = createMockLogger();
  const cache = createTestCache();
  const rateLimiter = createTestRateLimiter();
  const capabilitiesRegistry = createTestCapabilitiesRegistry();

  // Create OAuth client (will be mocked via nock)
  const { OAuthClient } = await import("../../../src/core/oauth.js");
  const oauthClient = new OAuthClient({
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    logger,
  });

  // Create GA4 client
  const { GA4Client } = await import("../../../src/ga4/client.js");
  const ga4Client = new GA4Client({
    logger,
    rateLimiter,
    oauthClient,
  });

  // Create GTM client
  const { GTMClient } = await import("../../../src/gtm/client.js");
  const gtmClient = new GTMClient({
    logger,
    rateLimiter,
    oauthClient,
  });

  // Create Ads client
  const { AdsClient } = await import("../../../src/ads/client.js");
  const adsClient = new AdsClient({
    logger,
    rateLimiter,
    oauthClient,
    developerToken: "test-developer-token",
  });

  return {
    logger,
    cache,
    rateLimiter,
    capabilitiesRegistry,
    oauthClient,
    ga4Client,
    gtmClient,
    adsClient,
  };
}

/**
 * Mock GTM Tag Manager API response
 */
export function mockGTMAPI(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  status: number,
  responseBody: unknown
): nock.Scope {
  const methodName = method.toLowerCase() as "get" | "post" | "patch" | "delete";
  return nock(GTM_API_BASE)[methodName](path).reply(status, responseBody as nock.Body);
}
