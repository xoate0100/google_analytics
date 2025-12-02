import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeAudienceList,
  executeAudienceGet,
  executeAudienceUpsert,
  executeAudienceAttach,
} from "../../../src/ads/tools.js";
import type { AdsClient } from "../../../src/ads/client.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";
import type { ILogger } from "../../../src/core/types.js";

describe("Google Ads Audience Tools", () => {
  let mockAdsClient: AdsClient;
  let mockRegistry: ICapabilitiesRegistry;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockAdsClient = {
      getGoogleAdsClient: vi.fn().mockReturnValue({
        search: vi.fn(),
        mutate: vi.fn(),
        uploadUserData: vi.fn(),
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

  describe("ads.audience.list", () => {
    it("should list audiences", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              audience: {
                id: "12345678901",
                name: "Website Visitors",
                type: "USER_LIST",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeAudienceList(
        {
          customerId: "1234567890",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.audiences).toBeDefined();
      expect(result.audiences.length).toBeGreaterThan(0);
      expect(mockGoogleAdsClient.search).toHaveBeenCalled();
    });

    it("should list audiences filtered by type", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              audience: {
                id: "12345678901",
                name: "Customer Match List",
                type: "CUSTOMER_MATCH_USER_LIST",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeAudienceList(
        {
          customerId: "1234567890",
          type: "CUSTOMER_MATCH_USER_LIST",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.audiences).toBeDefined();
    });
  });

  describe("ads.audience.get", () => {
    it("should get audience details", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              userList: {
                id: "12345678901",
                name: "Website Visitors",
                type: "USER_LIST",
                status: "ENABLED",
                membershipStatus: "OPEN",
                membershipLifeSpan: 30,
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeAudienceGet(
        {
          customerId: "1234567890",
          audienceId: "12345678901",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.audienceId).toBe("12345678901");
      expect(result.name).toBe("Website Visitors");
    });
  });

  describe("ads.audience.upsert", () => {
    it("should create new remarketing audience", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [], // No existing audience
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              userList: {
                resourceName: "customers/1234567890/userLists/12345678901",
                id: "12345678901",
                name: "New Website Visitors",
                type: "USER_LIST",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeAudienceUpsert(
        {
          customerId: "1234567890",
          name: "New Website Visitors",
          type: "USER_LIST",
          status: "ENABLED",
          membershipLifeSpan: 30,
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.audienceId).toBe("12345678901");
      expect(result.name).toBe("New Website Visitors");
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });

    it("should create customer match audience", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [], // No existing audience
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              userList: {
                resourceName: "customers/1234567890/userLists/12345678901",
                id: "12345678901",
                name: "Customer Match List",
                type: "CUSTOMER_MATCH_USER_LIST",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeAudienceUpsert(
        {
          customerId: "1234567890",
          name: "Customer Match List",
          type: "CUSTOMER_MATCH_USER_LIST",
          status: "ENABLED",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.audienceId).toBe("12345678901");
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });

    it("should update existing audience", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              userList: {
                id: "12345678901",
                name: "Old Audience Name",
                resourceName: "customers/1234567890/userLists/12345678901",
              },
            },
          ],
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              userList: {
                resourceName: "customers/1234567890/userLists/12345678901",
                id: "12345678901",
                name: "Updated Audience",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeAudienceUpsert(
        {
          customerId: "1234567890",
          audienceId: "12345678901",
          name: "Updated Audience",
          status: "ENABLED",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.name).toBe("Updated Audience");
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });
  });

  describe("ads.audience.attach", () => {
    it("should attach audience to campaign", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              campaignAudienceView: {
                campaign: "customers/1234567890/campaigns/98765432109",
                audience: "customers/1234567890/userLists/12345678901",
              },
            },
          ],
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              campaignAudience: {
                resourceName: "customers/1234567890/campaignAudiences/12345678901",
                campaign: "customers/1234567890/campaigns/98765432109",
                audience: "customers/1234567890/userLists/12345678901",
                bidModifier: 1.2,
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeAudienceAttach(
        {
          customerId: "1234567890",
          campaignId: "98765432109",
          audienceId: "12345678901",
          bidModifier: 1.2,
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.attached).toBe(true);
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });
  });
});

