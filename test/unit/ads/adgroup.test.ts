import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeAdGroupList,
  executeAdGroupGet,
  executeAdGroupUpsert,
} from "../../../src/ads/tools.js";
import type { AdsClient } from "../../../src/ads/client.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";
import type { ILogger } from "../../../src/core/types.js";

describe("Google Ads Ad Group Tools", () => {
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

  describe("ads.adgroup.list", () => {
    it("should list ad groups", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              adGroup: {
                id: "12345678901",
                name: "Test Ad Group",
                status: "ENABLED",
                type: "SEARCH_STANDARD",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeAdGroupList(
        {
          customerId: "1234567890",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.adGroups).toBeDefined();
      expect(result.adGroups.length).toBeGreaterThan(0);
      expect(mockGoogleAdsClient.search).toHaveBeenCalled();
    });

    it("should list ad groups filtered by campaign", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              adGroup: {
                id: "12345678901",
                name: "Test Ad Group",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeAdGroupList(
        {
          customerId: "1234567890",
          campaignId: "98765432109",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.adGroups).toBeDefined();
    });
  });

  describe("ads.adgroup.get", () => {
    it("should get ad group details", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              adGroup: {
                id: "12345678901",
                name: "Test Ad Group",
                status: "ENABLED",
                type: "SEARCH_STANDARD",
                campaign: "customers/1234567890/campaigns/98765432109",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeAdGroupGet(
        {
          customerId: "1234567890",
          adGroupId: "12345678901",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.adGroupId).toBe("12345678901");
      expect(result.name).toBe("Test Ad Group");
    });
  });

  describe("ads.adgroup.upsert", () => {
    it("should create new ad group", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [], // No existing ad group
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              adGroup: {
                resourceName: "customers/1234567890/adGroups/12345678901",
                id: "12345678901",
                name: "New Ad Group",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeAdGroupUpsert(
        {
          customerId: "1234567890",
          campaignId: "98765432109",
          name: "New Ad Group",
          status: "ENABLED",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.adGroupId).toBe("12345678901");
      expect(result.name).toBe("New Ad Group");
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });

    it("should update existing ad group", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              adGroup: {
                id: "12345678901",
                name: "Old Ad Group Name",
                resourceName: "customers/1234567890/adGroups/12345678901",
              },
            },
          ],
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              adGroup: {
                resourceName: "customers/1234567890/adGroups/12345678901",
                id: "12345678901",
                name: "Updated Ad Group",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeAdGroupUpsert(
        {
          customerId: "1234567890",
          adGroupId: "12345678901",
          campaignId: "98765432109",
          name: "Updated Ad Group",
          status: "ENABLED",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.name).toBe("Updated Ad Group");
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });
  });
});
