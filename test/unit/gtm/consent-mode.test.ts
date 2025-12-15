import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeConsentConfigure,
  executeConsentGet,
} from "../../../src/gtm/tools.js";
import type { GTMClient } from "../../../src/gtm/client.js";
import type { ICapabilitiesRegistry } from "../../../src/core/types.js";
import type { ILogger } from "../../../src/core/types.js";

describe("GTM Consent Mode Tools", () => {
  let mockGTMClient: GTMClient;
  let mockRegistry: ICapabilitiesRegistry;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockGTMClient = {
      getTagManagerClient: vi.fn(),
      checkRateLimit: vi.fn().mockResolvedValue(undefined),
    } as unknown as GTMClient;

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

  describe("gtm.consent.configure", () => {
    it("should configure consent mode settings", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            get: vi.fn().mockResolvedValue({
              data: {
                accountId: "123456",
                containerId: "987654",
                name: "Test Container",
                fingerprint: "abc123",
              },
            }),
            update: vi.fn().mockResolvedValue({
              data: {
                accountId: "123456",
                containerId: "987654",
                consentModeEnabled: true,
                consentModeSettings: {
                  ad_storage: "granted",
                  analytics_storage: "granted",
                  functionality_storage: "granted",
                  personalization_storage: "denied",
                },
              },
            }),
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeConsentConfigure(
        {
          path: "accounts/123456/containers/987654",
          enabled: true,
          settings: {
            ad_storage: "granted",
            analytics_storage: "granted",
            functionality_storage: "granted",
            personalization_storage: "denied",
          },
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.enabled).toBe(true);
      expect(result.settings?.ad_storage).toBe("granted");
      expect(mockTagManagerClient.accounts.containers.update).toHaveBeenCalled();
    });

    it("should update only enabled flag when settings not provided", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            get: vi.fn().mockResolvedValue({
              data: {
                accountId: "123456",
                containerId: "987654",
                name: "Test Container",
                fingerprint: "abc123",
                consentModeEnabled: false,
              },
            }),
            update: vi.fn().mockResolvedValue({
              data: {
                accountId: "123456",
                containerId: "987654",
                consentModeEnabled: true,
              },
            }),
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeConsentConfigure(
        {
          path: "accounts/123456/containers/987654",
          enabled: true,
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.enabled).toBe(true);
    });
  });

  describe("gtm.consent.get", () => {
    it("should get consent mode configuration", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            get: vi.fn().mockResolvedValue({
              data: {
                accountId: "123456",
                containerId: "987654",
                consentModeEnabled: true,
                consentModeSettings: {
                  ad_storage: "granted",
                  analytics_storage: "granted",
                  functionality_storage: "granted",
                  personalization_storage: "denied",
                },
              },
            }),
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeConsentGet(
        {
          path: "accounts/123456/containers/987654",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.enabled).toBe(true);
      expect(result.settings?.ad_storage).toBe("granted");
      expect(result.settings?.analytics_storage).toBe("granted");
    });

    it("should return disabled when consent mode is not enabled", async () => {
      const mockTagManagerClient = {
        accounts: {
          containers: {
            get: vi.fn().mockResolvedValue({
              data: {
                accountId: "123456",
                containerId: "987654",
                consentModeEnabled: false,
              },
            }),
          },
        },
      };

      (mockGTMClient.getTagManagerClient as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTagManagerClient
      );

      const result = await executeConsentGet(
        {
          path: "accounts/123456/containers/987654",
        },
        mockGTMClient,
        mockRegistry,
        mockLogger
      );

      expect(result).toBeDefined();
      expect(result.enabled).toBe(false);
      expect(result.settings).toBeUndefined();
    });
  });
});
