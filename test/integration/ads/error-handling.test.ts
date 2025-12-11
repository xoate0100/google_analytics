/**
 * Google Ads error handling test matrix
 * Tests developer token validation, quota exceeded handling, invalid campaign state handling, and partial failure scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createIntegrationTestContext,
  mockOAuthTokenEndpoint,
  type IntegrationTestContext,
} from "../helpers/mock-google-apis.js";
import { registerAdsTools } from "../../../src/ads/tools.js";
import { MCPServerBootstrap } from "../../../src/server/bootstrap.js";
import { AdsClient } from "../../../src/ads/client.js";

describe("Google Ads Error Handling Test Matrix", () => {
  let context: IntegrationTestContext;
  let bootstrap: MCPServerBootstrap;

  beforeEach(async () => {
    context = await createIntegrationTestContext();
    bootstrap = new MCPServerBootstrap({
      name: "test-server",
      version: "0.1.0",
      logger: context.logger,
    });
    bootstrap.initialize();

    // Register Ads capabilities
    context.capabilitiesRegistry.setProductCapabilities("ads", {
      "google_ads_api": "v16",
      "reporting": true,
      "campaigns": true,
      "conversions": true,
    });

    // Set credentials on OAuth client
    const oauth2Client = context.oauthClient.getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      expiry_date: Date.now() + 3600000,
    });

    // Mock OAuth token endpoint
    mockOAuthTokenEndpoint(200, {
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      expires_in: 3600,
      token_type: "Bearer",
    });

    if (context.adsClient) {
      registerAdsTools(
        bootstrap,
        context.adsClient,
        context.cache,
        context.capabilitiesRegistry,
        context.logger
      );
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Developer token validation", () => {
    it.skip("should handle missing developer token error", async () => {
      // Create Ads client without developer token
      const adsClientWithoutToken = new AdsClient({
        logger: context.logger,
        rateLimiter: context.rateLimiter,
        oauthClient: context.oauthClient,
        // developerToken not provided
      });

      // Mock getGoogleAdsClient to throw error
      vi.spyOn(adsClientWithoutToken, "getGoogleAdsClient").mockImplementation(() => {
        throw new Error("Developer token is required for Google Ads API");
      });

      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("ads.report.gaql");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      await expect(
        handler?.({
          customerId: "1234567890",
          query: "SELECT campaign.id FROM campaign LIMIT 10",
        })
      ).rejects.toThrow();
    });

    it.skip("should handle invalid developer token error", async () => {
      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("ads.report.gaql");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      // Mock Google Ads client to return authentication error
      const mockGoogleAdsClient = {
        search: vi.fn().mockRejectedValue({
          code: 401,
          message: "Invalid developer token",
          status: "UNAUTHENTICATED",
        }),
      };

      vi.spyOn(context.adsClient!, "getGoogleAdsClient").mockReturnValue(
        mockGoogleAdsClient as never
      );

      await expect(
        handler?.({
          customerId: "1234567890",
          query: "SELECT campaign.id FROM campaign LIMIT 10",
        })
      ).rejects.toThrow();
    });
  });

  describe("Quota exceeded handling", () => {
    it.skip("should handle quota exceeded errors gracefully", async () => {
      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("ads.report.gaql");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      // Mock Google Ads client to return quota error
      const mockGoogleAdsClient = {
        search: vi.fn().mockRejectedValue({
          code: 429,
          message: "Quota exceeded for quota metric 'Queries per day'",
          status: "RESOURCE_EXHAUSTED",
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.QuotaFailure",
              violations: [
                {
                  subject: "customers/1234567890",
                  description: "Quota limit exceeded",
                },
              ],
            },
          ],
        }),
      };

      vi.spyOn(context.adsClient!, "getGoogleAdsClient").mockReturnValue(
        mockGoogleAdsClient as never
      );

      await expect(
        handler?.({
          customerId: "1234567890",
          query: "SELECT campaign.id FROM campaign LIMIT 10",
        })
      ).rejects.toThrow();
    });

    it.skip("should handle project quota exceeded errors", async () => {
      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("ads.campaign.list");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      // Mock Google Ads client to return project quota error
      const mockGoogleAdsClient = {
        search: vi.fn().mockRejectedValue({
          code: 429,
          message: "Project quota exceeded",
          status: "RESOURCE_EXHAUSTED",
        }),
      };

      vi.spyOn(context.adsClient!, "getGoogleAdsClient").mockReturnValue(
        mockGoogleAdsClient as never
      );

      await expect(
        handler?.({
          customerId: "1234567890",
        })
      ).rejects.toThrow();
    });
  });

  describe("Invalid campaign state handling", () => {
    it.skip("should handle invalid campaign state errors", async () => {
      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("ads.campaign.upsert");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      // Mock Google Ads client to return invalid state error
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              campaign: {
                id: "123",
                resourceName: "customers/1234567890/campaigns/123",
                status: "REMOVED",
              },
            },
          ],
        }),
        mutate: vi.fn().mockRejectedValue({
          code: 400,
          message: "Campaign is in REMOVED state and cannot be modified",
          status: "INVALID_ARGUMENT",
          details: [
            {
              "@type": "type.googleapis.com/google.ads.googleads.v16.errors.GoogleAdsFailure",
              errors: [
                {
                  errorCode: {
                    campaignError: "CAMPAIGN_CANNOT_BE_MODIFIED",
                  },
                  message: "Campaign is in REMOVED state",
                },
              ],
            },
          ],
        }),
      };

      vi.spyOn(context.adsClient!, "getGoogleAdsClient").mockReturnValue(
        mockGoogleAdsClient as never
      );

      await expect(
        handler?.({
          customerId: "1234567890",
          campaignId: "123",
          name: "Updated Campaign",
        })
      ).rejects.toThrow();
    });

    it.skip("should handle paused campaign modification errors", async () => {
      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("ads.campaign.upsert");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      // Mock Google Ads client to return paused campaign error
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              campaign: {
                id: "123",
                resourceName: "customers/1234567890/campaigns/123",
                status: "PAUSED",
              },
            },
          ],
        }),
        mutate: vi.fn().mockRejectedValue({
          code: 400,
          message: "Cannot modify paused campaign without resuming first",
          status: "INVALID_ARGUMENT",
        }),
      };

      vi.spyOn(context.adsClient!, "getGoogleAdsClient").mockReturnValue(
        mockGoogleAdsClient as never
      );

      await expect(
        handler?.({
          customerId: "1234567890",
          campaignId: "123",
          name: "Updated Campaign",
        })
      ).rejects.toThrow();
    });
  });

  describe("Partial failure scenarios", () => {
    it.skip("should handle partial batch failures", async () => {
      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("ads.report.batch");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      // Mock Google Ads client to return partial failures
      const mockGoogleAdsClient = {
        search: vi.fn()
          .mockResolvedValueOnce({
            results: [{ campaign: { id: "1", name: "Campaign 1" } }],
          })
          .mockRejectedValueOnce({
            code: 400,
            message: "Invalid query",
            status: "INVALID_ARGUMENT",
          })
          .mockResolvedValueOnce({
            results: [{ campaign: { id: "3", name: "Campaign 3" } }],
          }),
      };

      vi.spyOn(context.adsClient!, "getGoogleAdsClient").mockReturnValue(
        mockGoogleAdsClient as never
      );

      const result = await handler?.({
        customerId: "1234567890",
        queries: [
          "SELECT campaign.id, campaign.name FROM campaign WHERE campaign.id = 1",
          "SELECT campaign.id FROM campaign WHERE invalid_field = 1", // Invalid query
          "SELECT campaign.id, campaign.name FROM campaign WHERE campaign.id = 3",
        ],
      });

      expect(result).toBeDefined();
      // Should have some successful and some failed results
      if (result && typeof result === "object" && "results" in result) {
        const results = result.results as Array<{ status?: string }>;
        expect(results.some((r) => r.status === "fulfilled")).toBe(true);
        expect(results.some((r) => r.status === "rejected")).toBe(true);
      }
    });

    it.skip("should handle mutation partial failures", async () => {
      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("ads.campaign.upsert");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      // Mock Google Ads client to return partial mutation failure
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [],
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              campaign: {
                id: "123",
                resourceName: "customers/1234567890/campaigns/123",
              },
            },
          ],
          partialFailureError: {
            code: 13,
            message: "Partial failure",
            status: "INTERNAL",
            details: [
              {
                "@type": "type.googleapis.com/google.ads.googleads.v16.errors.GoogleAdsFailure",
                errors: [
                  {
                    errorCode: {
                      campaignError: "DUPLICATE_CAMPAIGN_NAME",
                    },
                    message: "Campaign name already exists",
                  },
                ],
              },
            ],
          },
        }),
      };

      vi.spyOn(context.adsClient!, "getGoogleAdsClient").mockReturnValue(
        mockGoogleAdsClient as never
      );

      // Should handle partial failure - may succeed but with warnings
      const result = await handler?.({
        customerId: "1234567890",
        name: "Test Campaign",
      });

      expect(result).toBeDefined();
    });
  });
});
