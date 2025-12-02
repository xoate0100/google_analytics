import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeConversionList,
  executeConversionGet,
  executeConversionUpsert,
  executeConversionDelete,
  executeConversionOfflineImport,
  executeConversionEnhanced,
} from "../../../src/ads/tools.js";
import type { AdsClient } from "../../../src/ads/client.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";
import type { ILogger } from "../../../src/core/types.js";

describe("Google Ads Conversion Tools", () => {
  let mockAdsClient: AdsClient;
  let mockRegistry: ICapabilitiesRegistry;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockAdsClient = {
      getGoogleAdsClient: vi.fn().mockReturnValue({
        search: vi.fn(),
        mutate: vi.fn(),
      }),
      checkRateLimit: vi.fn().mockResolvedValue(undefined),
    } as unknown as AdsClient;

    mockRegistry = {
      hasCapability: vi.fn().mockReturnValue(true),
      getProductCapabilities: vi.fn().mockReturnValue({}),
      setProductCapabilities: vi.fn(),
    } as unknown as ICapabilitiesRegistry;

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => mockLogger),
    };
  });

  describe("ads.conversion.list", () => {
    it("should list conversion actions", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              conversionAction: {
                id: "12345678901",
                name: "Purchase",
                type: "WEBPAGE",
                category: "PURCHASE",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeConversionList(
        {
          customerId: "1234567890",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.conversions).toBeDefined();
      expect(result.conversions.length).toBeGreaterThan(0);
      expect(mockGoogleAdsClient.search).toHaveBeenCalled();
    });

    it("should list conversion actions with filter", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              conversionAction: {
                id: "12345678901",
                name: "Purchase",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeConversionList(
        {
          customerId: "1234567890",
          filter: "conversion_action.status = 'ENABLED'",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.conversions).toBeDefined();
    });
  });

  describe("ads.conversion.get", () => {
    it("should get conversion action details", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              conversionAction: {
                id: "12345678901",
                name: "Purchase",
                type: "WEBPAGE",
                category: "PURCHASE",
                status: "ENABLED",
                countingType: "ONE_PER_CLICK",
                attributionModel: "DATA_DRIVEN",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeConversionGet(
        {
          customerId: "1234567890",
          conversionId: "12345678901",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.conversionId).toBe("12345678901");
      expect(result.name).toBe("Purchase");
    });
  });

  describe("ads.conversion.upsert", () => {
    it("should create new conversion action", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [], // No existing conversion
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              conversionAction: {
                resourceName: "customers/1234567890/conversionActions/12345678901",
                id: "12345678901",
                name: "New Purchase",
                type: "WEBPAGE",
                category: "PURCHASE",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeConversionUpsert(
        {
          customerId: "1234567890",
          name: "New Purchase",
          type: "WEBPAGE",
          category: "PURCHASE",
          status: "ENABLED",
          countingType: "ONE_PER_CLICK",
          attributionModel: "DATA_DRIVEN",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.conversionId).toBe("12345678901");
      expect(result.name).toBe("New Purchase");
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });

    it("should update existing conversion action", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              conversionAction: {
                id: "12345678901",
                name: "Old Purchase",
                resourceName: "customers/1234567890/conversionActions/12345678901",
              },
            },
          ],
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              conversionAction: {
                resourceName: "customers/1234567890/conversionActions/12345678901",
                id: "12345678901",
                name: "Updated Purchase",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeConversionUpsert(
        {
          customerId: "1234567890",
          conversionId: "12345678901",
          name: "Updated Purchase",
          status: "ENABLED",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.name).toBe("Updated Purchase");
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });
  });

  describe("ads.conversion.delete", () => {
    it("should delete conversion action", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              conversionAction: {
                id: "12345678901",
                resourceName: "customers/1234567890/conversionActions/12345678901",
              },
            },
          ],
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              conversionAction: {
                resourceName: "customers/1234567890/conversionActions/12345678901",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeConversionDelete(
        {
          customerId: "1234567890",
          conversionId: "12345678901",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });
  });

  describe("ads.conversion.offlineImport", () => {
    it("should import offline conversions", async () => {
      const mockGoogleAdsClient = {
        uploadClickConversions: vi.fn().mockResolvedValue({
          results: [
            {
              gclid: "gclid123",
              conversionDateTime: "2024-01-15 10:30:00",
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeConversionOfflineImport(
        {
          customerId: "1234567890",
          conversionId: "12345678901",
          conversions: [
            {
              gclid: "gclid123",
              conversionDateTime: "2024-01-15 10:30:00",
              conversionValue: 100.0,
            },
          ],
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.imported).toBeGreaterThan(0);
      expect(mockGoogleAdsClient.uploadClickConversions).toHaveBeenCalled();
    });
  });

  describe("ads.conversion.enhanced", () => {
    it("should configure enhanced conversions", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              conversionAction: {
                id: "12345678901",
                resourceName: "customers/1234567890/conversionActions/12345678901",
              },
            },
          ],
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              conversionAction: {
                resourceName: "customers/1234567890/conversionActions/12345678901",
                id: "12345678901",
                enhancedConversionsForLeadsEnabled: true,
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeConversionEnhanced(
        {
          customerId: "1234567890",
          conversionId: "12345678901",
          enabled: true,
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.enabled).toBe(true);
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });
  });
});

