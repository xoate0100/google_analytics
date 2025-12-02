import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeCampaignList,
  executeCampaignGet,
  executeCampaignUpsert,
  executeCampaignPause,
} from "../../../src/ads/tools.js";
import type { AdsClient } from "../../../src/ads/client.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";
import type { ILogger } from "../../../src/core/types.js";

describe("Google Ads Campaign Tools", () => {
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

  describe("ads.campaign.list", () => {
    it("should list campaigns", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              campaign: {
                id: "12345678901",
                name: "Test Campaign",
                status: "ENABLED",
                advertisingChannelType: "SEARCH",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeCampaignList(
        {
          customerId: "1234567890",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.campaigns).toBeDefined();
      expect(result.campaigns.length).toBeGreaterThan(0);
      expect(mockGoogleAdsClient.search).toHaveBeenCalled();
    });

    it("should list campaigns with filter", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              campaign: {
                id: "12345678901",
                name: "Test Campaign",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeCampaignList(
        {
          customerId: "1234567890",
          filter: "campaign.status = 'ENABLED'",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.campaigns).toBeDefined();
    });
  });

  describe("ads.campaign.get", () => {
    it("should get campaign details", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              campaign: {
                id: "12345678901",
                name: "Test Campaign",
                status: "ENABLED",
                advertisingChannelType: "SEARCH",
                budget: "customers/1234567890/campaignBudgets/987654321",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeCampaignGet(
        {
          customerId: "1234567890",
          campaignId: "12345678901",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.campaignId).toBe("12345678901");
      expect(result.name).toBe("Test Campaign");
    });
  });

  describe("ads.campaign.upsert", () => {
    it("should create new campaign", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [], // No existing campaign
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              campaign: {
                resourceName: "customers/1234567890/campaigns/12345678901",
                id: "12345678901",
                name: "New Campaign",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeCampaignUpsert(
        {
          customerId: "1234567890",
          name: "New Campaign",
          status: "ENABLED",
          advertisingChannelType: "SEARCH",
          budget: "customers/1234567890/campaignBudgets/987654321",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.campaignId).toBe("12345678901");
      expect(result.name).toBe("New Campaign");
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });

    it("should update existing campaign", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              campaign: {
                id: "12345678901",
                name: "Old Campaign Name",
                resourceName: "customers/1234567890/campaigns/12345678901",
              },
            },
          ],
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              campaign: {
                resourceName: "customers/1234567890/campaigns/12345678901",
                id: "12345678901",
                name: "Updated Campaign",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeCampaignUpsert(
        {
          customerId: "1234567890",
          campaignId: "12345678901",
          name: "Updated Campaign",
          status: "ENABLED",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.name).toBe("Updated Campaign");
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });
  });

  describe("ads.campaign.pause", () => {
    it("should pause campaign", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              campaign: {
                id: "12345678901",
                name: "Test Campaign",
                resourceName: "customers/1234567890/campaigns/12345678901",
                status: "ENABLED",
              },
            },
          ],
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              campaign: {
                resourceName: "customers/1234567890/campaigns/12345678901",
                id: "12345678901",
                status: "PAUSED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeCampaignPause(
        {
          customerId: "1234567890",
          campaignId: "12345678901",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.status).toBe("PAUSED");
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });
  });
});

