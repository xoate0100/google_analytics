import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeBudgetList,
  executeBudgetGet,
  executeBudgetUpsert,
  executeBiddingStrategyList,
  executeBiddingStrategyGet,
  executeBiddingStrategyUpsert,
} from "../../../src/ads/tools.js";
import type { AdsClient } from "../../../src/ads/client.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";
import type { ILogger } from "../../../src/core/types.js";

describe("Google Ads Budget & Bidding Strategy Tools", () => {
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

  describe("ads.budget.list", () => {
    it("should list budgets", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              campaignBudget: {
                id: "12345678901",
                name: "Daily Budget",
                amountMicros: "100000000",
                deliveryMethod: "STANDARD",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeBudgetList(
        {
          customerId: "1234567890",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.budgets).toBeDefined();
      expect(result.budgets.length).toBeGreaterThan(0);
      expect(mockGoogleAdsClient.search).toHaveBeenCalled();
    });
  });

  describe("ads.budget.get", () => {
    it("should get budget details", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              campaignBudget: {
                id: "12345678901",
                name: "Daily Budget",
                amountMicros: "100000000",
                deliveryMethod: "STANDARD",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeBudgetGet(
        {
          customerId: "1234567890",
          budgetId: "12345678901",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.budgetId).toBe("12345678901");
      expect(result.name).toBe("Daily Budget");
    });
  });

  describe("ads.budget.upsert", () => {
    it("should create new budget", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [], // No existing budget
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              campaignBudget: {
                resourceName: "customers/1234567890/campaignBudgets/12345678901",
                id: "12345678901",
                name: "New Daily Budget",
                amountMicros: "200000000",
                deliveryMethod: "STANDARD",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeBudgetUpsert(
        {
          customerId: "1234567890",
          name: "New Daily Budget",
          amount: 200.0,
          deliveryMethod: "STANDARD",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.budgetId).toBe("12345678901");
      expect(result.name).toBe("New Daily Budget");
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });

    it("should update existing budget", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              campaignBudget: {
                id: "12345678901",
                name: "Old Budget",
                resourceName: "customers/1234567890/campaignBudgets/12345678901",
              },
            },
          ],
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              campaignBudget: {
                resourceName: "customers/1234567890/campaignBudgets/12345678901",
                id: "12345678901",
                name: "Updated Budget",
                amountMicros: "300000000",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeBudgetUpsert(
        {
          customerId: "1234567890",
          budgetId: "12345678901",
          name: "Updated Budget",
          amount: 300.0,
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.name).toBe("Updated Budget");
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });
  });

  describe("ads.biddingStrategy.list", () => {
    it("should list bidding strategies", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              biddingStrategy: {
                id: "12345678901",
                name: "Maximize Conversions",
                type: "MAXIMIZE_CONVERSIONS",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeBiddingStrategyList(
        {
          customerId: "1234567890",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.strategies).toBeDefined();
      expect(result.strategies.length).toBeGreaterThan(0);
      expect(mockGoogleAdsClient.search).toHaveBeenCalled();
    });
  });

  describe("ads.biddingStrategy.get", () => {
    it("should get bidding strategy details", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              biddingStrategy: {
                id: "12345678901",
                name: "Maximize Conversions",
                type: "MAXIMIZE_CONVERSIONS",
                status: "ENABLED",
                targetCpa: {
                  targetCpaMicros: "10000000",
                },
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeBiddingStrategyGet(
        {
          customerId: "1234567890",
          strategyId: "12345678901",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.strategyId).toBe("12345678901");
      expect(result.name).toBe("Maximize Conversions");
    });
  });

  describe("ads.biddingStrategy.upsert", () => {
    it("should create new bidding strategy", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [], // No existing strategy
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              biddingStrategy: {
                resourceName: "customers/1234567890/biddingStrategies/12345678901",
                id: "12345678901",
                name: "New Maximize Conversions",
                type: "MAXIMIZE_CONVERSIONS",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeBiddingStrategyUpsert(
        {
          customerId: "1234567890",
          name: "New Maximize Conversions",
          type: "MAXIMIZE_CONVERSIONS",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.strategyId).toBe("12345678901");
      expect(result.name).toBe("New Maximize Conversions");
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });

    it("should update existing bidding strategy", async () => {
      const mockGoogleAdsClient = {
        search: vi.fn().mockResolvedValue({
          results: [
            {
              biddingStrategy: {
                id: "12345678901",
                name: "Old Strategy",
                resourceName: "customers/1234567890/biddingStrategies/12345678901",
              },
            },
          ],
        }),
        mutate: vi.fn().mockResolvedValue({
          results: [
            {
              biddingStrategy: {
                resourceName: "customers/1234567890/biddingStrategies/12345678901",
                id: "12345678901",
                name: "Updated Strategy",
                status: "ENABLED",
              },
            },
          ],
        }),
      };

      (mockAdsClient.getGoogleAdsClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockGoogleAdsClient
      );

      const result = await executeBiddingStrategyUpsert(
        {
          customerId: "1234567890",
          strategyId: "12345678901",
          name: "Updated Strategy",
        },
        mockAdsClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.name).toBe("Updated Strategy");
      expect(mockGoogleAdsClient.mutate).toHaveBeenCalled();
    });
  });
});

