/**
 * Unit tests for GA4 ↔ Ads conversion linking workflow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { GA4Client } from "../../../src/ga4/client.js";
import type { AdsClient } from "../../../src/ads/client.js";
import type { ILogger, ICache, ICapabilitiesRegistry } from "../../../src/core/types.js";
import { linkGA4ConversionToAds } from "../../../src/workflows/ga4-ads-linking.js";
import * as ga4Tools from "../../../src/ga4/tools.js";
import * as adsTools from "../../../src/ads/tools.js";

describe("GA4 ↔ Ads Conversion Linking Workflow", () => {
  let mockGA4Client: GA4Client;
  let mockAdsClient: AdsClient;
  let mockCache: ICache;
  let mockCapabilitiesRegistry: ICapabilitiesRegistry;
  let mockLogger: ILogger;

  beforeEach(() => {
    vi.useFakeTimers();

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      child: vi.fn().mockReturnThis(),
    } as unknown as ILogger;

    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
    } as unknown as ICache;

    mockCapabilitiesRegistry = {
      register: vi.fn(),
      get: vi.fn(),
      hasCapability: vi.fn().mockReturnValue(true),
      list: vi.fn(),
    } as unknown as ICapabilitiesRegistry;

    mockGA4Client = {
      checkRateLimit: vi.fn().mockResolvedValue(undefined),
      getAnalyticsAdminClient: vi.fn(),
    } as unknown as GA4Client;

    mockAdsClient = {
      checkRateLimit: vi.fn().mockResolvedValue(undefined),
      getGoogleAdsClient: vi.fn(),
    } as unknown as AdsClient;

    // Mock the execute functions
    vi.spyOn(ga4Tools, "executeConversionUpsert").mockResolvedValue({
      name: "properties/123456789/conversionEvents/purchase",
      eventName: "purchase",
    });

    vi.spyOn(ga4Tools, "executeGoogleAdsIntegrationCreate").mockResolvedValue({
      name: "properties/123456789/googleAdsLinks/2222222222",
      customerId: "1111111111",
    });

    vi.spyOn(adsTools, "executeConversionUpsert").mockResolvedValue({
      conversionId: "3333333333",
      name: "Purchase Conversion",
      type: "GOOGLE_ANALYTICS",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe("linkGA4ConversionToAds", () => {
    it("should create GA4 conversion and link to Ads", async () => {
      const args = {
        propertyId: "123456789",
        eventName: "purchase",
        customerId: "9876543210",
        conversionName: "Purchase Conversion",
        conversionCategory: "PURCHASE",
      };

      const result = await linkGA4ConversionToAds(
        args,
        mockGA4Client,
        mockAdsClient,
        mockCache,
        mockCapabilitiesRegistry,
        mockLogger
      );

      expect(ga4Tools.executeConversionUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          parent: "properties/123456789",
          eventName: "purchase",
        }),
        mockGA4Client,
        mockCache,
        mockCapabilitiesRegistry,
        mockLogger
      );

      expect(adsTools.executeConversionUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: "9876543210",
          name: "Purchase Conversion",
          type: "GOOGLE_ANALYTICS",
          category: "PURCHASE",
        }),
        mockAdsClient,
        mockCapabilitiesRegistry,
        mockLogger
      );

      expect(result.ga4ConversionName).toBe("properties/123456789/conversionEvents/purchase");
      expect(result.adsConversionActionId).toBe("3333333333");
      expect(result.linked).toBe(true);
    });

    it("should create Google Ads link when adsCustomerId is provided", async () => {
      const args = {
        propertyId: "123456789",
        eventName: "purchase",
        customerId: "9876543210",
        conversionName: "Purchase Conversion",
        conversionCategory: "PURCHASE",
        adsCustomerId: "1111111111",
      };

      const result = await linkGA4ConversionToAds(
        args,
        mockGA4Client,
        mockAdsClient,
        mockCache,
        mockCapabilitiesRegistry,
        mockLogger
      );

      expect(ga4Tools.executeGoogleAdsIntegrationCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          parent: "properties/123456789",
          customerId: "1111111111",
        }),
        mockGA4Client,
        mockCache,
        mockCapabilitiesRegistry,
        mockLogger
      );

      expect(result.ga4LinkName).toBe("properties/123456789/googleAdsLinks/2222222222");
    });

    it("should return complete linking configuration", async () => {
      const args = {
        propertyId: "123456789",
        eventName: "purchase",
        customerId: "9876543210",
        conversionName: "Purchase Conversion",
        conversionCategory: "PURCHASE",
      };

      const result = await linkGA4ConversionToAds(
        args,
        mockGA4Client,
        mockAdsClient,
        mockCache,
        mockCapabilitiesRegistry,
        mockLogger
      );

      expect(result).toHaveProperty("ga4ConversionName");
      expect(result).toHaveProperty("ga4LinkName");
      expect(result).toHaveProperty("adsConversionActionId");
      expect(result).toHaveProperty("adsConversionActionResourceName");
      expect(result).toHaveProperty("linked", true);
    });

    it("should handle errors gracefully", async () => {
      const args = {
        propertyId: "123456789",
        eventName: "purchase",
        customerId: "9876543210",
        conversionName: "Purchase Conversion",
        conversionCategory: "PURCHASE",
      };

      const apiError = new Error("API error");
      vi.spyOn(ga4Tools, "executeConversionUpsert").mockRejectedValue(apiError);

      await expect(
        linkGA4ConversionToAds(
          args,
          mockGA4Client,
          mockAdsClient,
          mockCache,
          mockCapabilitiesRegistry,
          mockLogger
        )
      ).rejects.toThrow("API error");

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
