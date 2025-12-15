import { describe, it, expect, vi, beforeEach } from "vitest";
import { discoverGA4Capabilities, DiscoveryOptions } from "../../../src/core/discovery.js";
import { CapabilitiesRegistry } from "../../../src/core/capabilities.js";
import type { ILogger } from "../../../src/core/types.js";
import type { GA4Client } from "../../../src/ga4/client.js";

describe("GA4 Admin API Discovery", () => {
  let mockLogger: ILogger;
  let mockGA4Client: GA4Client;
  let registry: CapabilitiesRegistry;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => mockLogger),
    };

    mockGA4Client = {
      getAnalyticsAdminClient: vi.fn(),
      checkRateLimit: vi.fn().mockResolvedValue(undefined),
    } as unknown as GA4Client;

    registry = new CapabilitiesRegistry();
  });

  describe("discoverGA4Capabilities", () => {
    it("should verify GA4 Admin API endpoints are accessible", async () => {
      const mockAdminClient = {
        accounts: {
          list: vi.fn().mockResolvedValue({
            data: {
              accounts: [
                {
                  name: "accounts/123456",
                  displayName: "Test Account",
                },
              ],
            },
          }),
        },
        properties: {
          list: vi.fn().mockResolvedValue({
            data: {
              properties: [
                {
                  name: "properties/987654",
                  displayName: "Test Property",
                },
              ],
            },
          }),
          dataStreams: {
            list: vi.fn().mockResolvedValue({
              data: {
                dataStreams: [],
              },
            }),
          },
          customDimensions: {
            list: vi.fn().mockResolvedValue({
              data: {
                customDimensions: [],
              },
            }),
          },
          customMetrics: {
            list: vi.fn().mockResolvedValue({
              data: {
                customMetrics: [],
              },
            }),
          },
        },
      };

      (mockGA4Client.getAnalyticsAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockAdminClient
      );

      const options: DiscoveryOptions = {
        registry,
        logger: mockLogger,
        ga4Client: mockGA4Client,
      };

      await discoverGA4Capabilities(options);

      const caps = registry.getProductCapabilities("ga4");
      expect(caps).toBeDefined();
      expect(caps?.admin_api).toBe(true);
      expect(mockGA4Client.getAnalyticsAdminClient).toHaveBeenCalled();
    });

    it("should handle API errors gracefully", async () => {
      const mockAdminClient = {
        accounts: {
          list: vi.fn().mockRejectedValue(new Error("API Error")),
        },
      };

      (mockGA4Client.getAnalyticsAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockAdminClient
      );

      const options: DiscoveryOptions = {
        registry,
        logger: mockLogger,
        ga4Client: mockGA4Client,
      };

      // Should not throw, but log error
      await expect(discoverGA4Capabilities(options)).resolves.toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should verify all Admin API endpoints are not deprecated", async () => {
      const mockDataStreamsList = vi.fn().mockResolvedValue({ data: { dataStreams: [] } });
      const mockCustomDimensionsList = vi.fn().mockResolvedValue({ data: { customDimensions: [] } });
      const mockCustomMetricsList = vi.fn().mockResolvedValue({ data: { customMetrics: [] } });

      const mockAdminClient = {
        accounts: {
          list: vi.fn().mockResolvedValue({ data: { accounts: [] } }),
        },
        properties: {
          list: vi.fn().mockResolvedValue({ data: { properties: [] } }),
          dataStreams: {
            list: mockDataStreamsList,
          },
          customDimensions: {
            list: mockCustomDimensionsList,
          },
          customMetrics: {
            list: mockCustomMetricsList,
          },
        },
      };

      (mockGA4Client.getAnalyticsAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockAdminClient
      );

      const options: DiscoveryOptions = {
        registry,
        logger: mockLogger,
        ga4Client: mockGA4Client,
      };

      await discoverGA4Capabilities(options);

      // Verify all endpoints were called
      expect(mockAdminClient.accounts.list).toHaveBeenCalled();
      expect(mockAdminClient.properties.list).toHaveBeenCalled();
      expect(mockDataStreamsList).toHaveBeenCalled();
      expect(mockCustomDimensionsList).toHaveBeenCalled();
      expect(mockCustomMetricsList).toHaveBeenCalled();
    });

    it("should update capabilities registry with Admin API status", async () => {
      const mockAdminClient = {
        accounts: {
          list: vi.fn().mockResolvedValue({ data: { accounts: [] } }),
        },
        properties: {
          list: vi.fn().mockResolvedValue({ data: { properties: [] } }),
        },
      };

      (mockGA4Client.getAnalyticsAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockAdminClient
      );

      const options: DiscoveryOptions = {
        registry,
        logger: mockLogger,
        ga4Client: mockGA4Client,
      };

      await discoverGA4Capabilities(options);

      const caps = registry.getProductCapabilities("ga4");
      expect(caps).toBeDefined();
      expect(registry.hasCapability("ga4", "admin_api")).toBe(true);
    });
  });
});
