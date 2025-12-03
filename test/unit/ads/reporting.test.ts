import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeGAQLReport,
  executeGAQLBatch,
  executeGAQLStream,
} from "../../../src/ads/tools.js";
import type { AdsClient } from "../../../src/ads/client.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";
import type { ILogger } from "../../../src/core/types.js";

describe("Google Ads GAQL Reporting Tools", () => {
  let mockAdsClient: AdsClient;
  let mockRegistry: ICapabilitiesRegistry;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockAdsClient = {
      getGoogleAdsClient: vi.fn().mockReturnValue({
        search: vi.fn(),
        searchStream: vi.fn(),
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

  describe("ads.report.gaql", () => {
    it("should execute GAQL query", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              campaign: {
                id: "123456",
                name: "Test Campaign",
                status: "ENABLED",
              },
              metrics: {
                impressions: 1000,
                clicks: 50,
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeGAQLReport(
        {
          customerId: "1234567890",
          query: "SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.status = 'ENABLED'",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(mockGoogleAdsClient.search).toHaveBeenCalled();
    });

    it("should execute GAQL query with limit", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeGAQLReport(
        {
          customerId: "1234567890",
          query: "SELECT campaign.id FROM campaign LIMIT 10",
          limit: 10,
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(mockGoogleAdsClient.search).toHaveBeenCalled();
    });

    it("should validate query when validateOnly is true", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeGAQLReport(
        {
          customerId: "1234567890",
          query: "SELECT campaign.id FROM campaign",
          validateOnly: true,
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(mockGoogleAdsClient.search).toHaveBeenCalled();
    });
  });

  describe("ads.report.batch", () => {
    it("should execute batch GAQL queries", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn()
          .mockResolvedValueOnce({
            results: [{ campaign: { id: "1" } }],
          })
          .mockResolvedValueOnce({
            results: [{ campaign: { id: "2" } }],
          }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeGAQLBatch(
        {
          customerId: "1234567890",
          queries: [
            "SELECT campaign.id FROM campaign LIMIT 1",
            "SELECT campaign.id FROM campaign LIMIT 1",
          ],
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(result.results.length).toBe(2);
      expect(mockGoogleAdsClient.search).toHaveBeenCalledTimes(2);
    });
  });

  describe("ads.report.stream", () => {
    it("should stream large result sets", async () => {
      const dataCallbacks: Array<(data: unknown) => void> = [];
      const endCallbacks: Array<() => void> = [];

      const mockStream: {
        on: (event: string, callback: (data?: unknown) => void) => typeof mockStream;
      } = {
        on: vi.fn((event: string, callback: (data?: unknown) => void) => {
          if (event === "data") {
            dataCallbacks.push(callback as (data: unknown) => void);
            // Simulate streaming data immediately
            setTimeout(() => {
              callback({
                campaign: { id: "1", name: "Campaign 1" },
              });
              callback({
                campaign: { id: "2", name: "Campaign 2" },
              });
              // Trigger end after data
              endCallbacks.forEach((cb) => cb());
            }, 10);
          } else if (event === "end") {
            endCallbacks.push(callback as () => void);
          }
          return mockStream;
        }) as (event: string, callback: (data?: unknown) => void) => typeof mockStream,
      };

      const mockGoogleAdsClient = {
        searchStream: vi.fn().mockReturnValue(mockStream),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeGAQLStream(
        {
          customerId: "1234567890",
          query: "SELECT campaign.id, campaign.name FROM campaign",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
      expect(mockGoogleAdsClient.searchStream).toHaveBeenCalled();
    }, 15000); // Increase timeout for this test
  });
});
