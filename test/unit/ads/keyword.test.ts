import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeKeywordList,
  executeKeywordUpsert,
  executeKeywordDelete,
} from "../../../src/ads/tools.js";
import type { AdsClient } from "../../../src/ads/client.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";
import type { ILogger } from "../../../src/core/types.js";

describe("Google Ads Keyword Tools", () => {
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

  describe("ads.keyword.list", () => {
    it("should list keywords", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              adGroupCriterion: {
                criterion: {
                  id: "67890123456",
                  keyword: {
                    text: "test keyword",
                    matchType: "EXACT",
                  },
                },
                cpcBid: {
                  micros: "1000000",
                },
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeKeywordList(
        {
          customerId: "1234567890",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.keywords).toBeDefined();
      expect(result.keywords.length).toBeGreaterThan(0);
      expect(mockGoogleAdsClient.search).toHaveBeenCalled();
    });

    it("should list keywords filtered by ad group", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              adGroupCriterion: {
                criterion: {
                  id: "67890123456",
                  keyword: {
                    text: "test keyword",
                    matchType: "PHRASE",
                  },
                },
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeKeywordList(
        {
          customerId: "1234567890",
          adGroupId: "12345678901",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.keywords).toBeDefined();
    });
  });

  describe("ads.keyword.upsert", () => {
    it("should create new keyword", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [], // No existing keyword
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              adGroupCriterion: {
                resourceName: "customers/1234567890/adGroupCriteria/67890123456",
                criterion: {
                  id: "67890123456",
                  keyword: {
                    text: "new keyword",
                    matchType: "EXACT",
                  },
                },
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeKeywordUpsert(
        {
          customerId: "1234567890",
          adGroupId: "12345678901",
          text: "new keyword",
          matchType: "EXACT",
          cpcBid: 1.0,
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.keywordId).toBe("67890123456");
      expect(result.text).toBe("new keyword");
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });

    it("should update existing keyword", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              adGroupCriterion: {
                criterion: {
                  id: "67890123456",
                  resourceName: "customers/1234567890/adGroupCriteria/67890123456",
                },
              },
            },
          ],
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              adGroupCriterion: {
                resourceName: "customers/1234567890/adGroupCriteria/67890123456",
                criterion: {
                  id: "67890123456",
                  keyword: {
                    text: "updated keyword",
                    matchType: "PHRASE",
                  },
                },
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeKeywordUpsert(
        {
          customerId: "1234567890",
          adGroupId: "12345678901",
          keywordId: "67890123456",
          text: "updated keyword",
          matchType: "PHRASE",
          cpcBid: 1.5,
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.text).toBe("updated keyword");
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });
  });

  describe("ads.keyword.delete", () => {
    it("should delete keyword", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              adGroupCriterion: {
                criterion: {
                  id: "67890123456",
                  resourceName: "customers/1234567890/adGroupCriteria/67890123456",
                },
              },
            },
          ],
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              adGroupCriterion: {
                resourceName: "customers/1234567890/adGroupCriteria/67890123456",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeKeywordDelete(
        {
          customerId: "1234567890",
          keywordId: "67890123456",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });
  });
});

