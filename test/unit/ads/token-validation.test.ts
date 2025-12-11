/**
 * Google Ads developer token validation tests
 * Tests token format validation, status verification, and error handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateDeveloperTokenFormat,
  validateDeveloperTokenStatus,
  isDeveloperTokenValid,
} from "../../../src/ads/token-validation.js";
import type { AdsClient } from "../../../src/ads/client.js";

describe("Google Ads Developer Token Validation", () => {
  let mockAdsClient: AdsClient;

  beforeEach(() => {
    mockAdsClient = {
      getGoogleAdsClient: vi.fn(),
      checkRateLimit: vi.fn().mockResolvedValue(undefined),
    } as unknown as AdsClient;
  });

  describe("validateDeveloperTokenFormat", () => {
    it("should validate correct developer token format", () => {
      const validToken = "ABCD-EFGH-IJKL-MNOP";
      expect(() => validateDeveloperTokenFormat(validToken)).not.toThrow();
    });

    it("should reject empty token", () => {
      expect(() => validateDeveloperTokenFormat("")).toThrow("Developer token cannot be empty");
    });

    it("should reject token with invalid format", () => {
      const invalidToken = "invalid-token-format";
      expect(() => validateDeveloperTokenFormat(invalidToken)).toThrow("Invalid developer token format");
    });

    it("should reject token that is too short", () => {
      const shortToken = "ABC";
      expect(() => validateDeveloperTokenFormat(shortToken)).toThrow("Invalid developer token format");
    });

    it("should reject token that is too long", () => {
      const longToken = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX";
      expect(() => validateDeveloperTokenFormat(longToken)).toThrow("Invalid developer token format");
    });

    it("should accept token with lowercase letters", () => {
      const lowercaseToken = "abcd-efgh-ijkl-mnop";
      expect(() => validateDeveloperTokenFormat(lowercaseToken)).not.toThrow();
    });

    it("should reject token with special characters", () => {
      const specialCharToken = "ABCD-EFGH-IJKL-MN@P";
      expect(() => validateDeveloperTokenFormat(specialCharToken)).toThrow("Invalid developer token format");
    });
  });

  describe("validateDeveloperTokenStatus", () => {
    it("should validate active developer token", async () => {
      const mockGoogleAdsClient = {
        customers: {
          listAccessibleCustomers: vi.fn().mockResolvedValue({
            resourceNames: ["customers/1234567890"],
          }),
        },
      };

      vi.spyOn(mockAdsClient, "getGoogleAdsClient").mockReturnValue(
        mockGoogleAdsClient as never
      );

      await expect(
        validateDeveloperTokenStatus(mockAdsClient)
      ).resolves.not.toThrow();
    });

    it("should reject invalid developer token", async () => {
      const mockGoogleAdsClient = {
        customers: {
          listAccessibleCustomers: vi.fn().mockRejectedValue({
            code: 401,
            message: "Invalid developer token",
            status: "UNAUTHENTICATED",
          }),
        },
      };

      vi.spyOn(mockAdsClient, "getGoogleAdsClient").mockReturnValue(
        mockGoogleAdsClient as never
      );

      await expect(
        validateDeveloperTokenStatus(mockAdsClient)
      ).rejects.toThrow("Invalid developer token");
    });

    it("should handle network errors gracefully", async () => {
      const mockGoogleAdsClient = {
        customers: {
          listAccessibleCustomers: vi.fn().mockRejectedValue(
            new Error("Network error")
          ),
        },
      };

      vi.spyOn(mockAdsClient, "getGoogleAdsClient").mockReturnValue(
        mockGoogleAdsClient as never
      );

      await expect(
        validateDeveloperTokenStatus(mockAdsClient)
      ).rejects.toThrow();
    });

    it("should handle rate limit errors", async () => {
      const mockGoogleAdsClient = {
        customers: {
          listAccessibleCustomers: vi.fn().mockRejectedValue({
            code: 429,
            message: "Rate limit exceeded",
            status: "RESOURCE_EXHAUSTED",
          }),
        },
      };

      vi.spyOn(mockAdsClient, "getGoogleAdsClient").mockReturnValue(
        mockGoogleAdsClient as never
      );

      // Rate limit errors should not invalidate the token
      await expect(
        validateDeveloperTokenStatus(mockAdsClient)
      ).rejects.toThrow();
    });
  });

  describe("isDeveloperTokenValid", () => {
    it("should return true for valid token format and status", async () => {
      const validToken = "ABCD-EFGH-IJKL-MNOP";
      const mockGoogleAdsClient = {
        customers: {
          listAccessibleCustomers: vi.fn().mockResolvedValue({
            resourceNames: ["customers/1234567890"],
          }),
        },
      };

      vi.spyOn(mockAdsClient, "getGoogleAdsClient").mockReturnValue(
        mockGoogleAdsClient as never
      );

      const result = await isDeveloperTokenValid(validToken, mockAdsClient);
      expect(result).toBe(true);
    });

    it("should return false for invalid token format", async () => {
      const invalidToken = "invalid-format";
      const result = await isDeveloperTokenValid(invalidToken, mockAdsClient);
      expect(result).toBe(false);
    });

    it("should return false for invalid token status", async () => {
      const validToken = "ABCD-EFGH-IJKL-MNOP";
      const mockGoogleAdsClient = {
        customers: {
          listAccessibleCustomers: vi.fn().mockRejectedValue({
            code: 401,
            message: "Invalid developer token",
            status: "UNAUTHENTICATED",
          }),
        },
      };

      vi.spyOn(mockAdsClient, "getGoogleAdsClient").mockReturnValue(
        mockGoogleAdsClient as never
      );

      const result = await isDeveloperTokenValid(validToken, mockAdsClient);
      expect(result).toBe(false);
    });

    it("should handle errors gracefully and return false", async () => {
      const validToken = "ABCD-EFGH-IJKL-MNOP";
      const mockGoogleAdsClient = {
        customers: {
          listAccessibleCustomers: vi.fn().mockRejectedValue(
            new Error("Unexpected error")
          ),
        },
      };

      vi.spyOn(mockAdsClient, "getGoogleAdsClient").mockReturnValue(
        mockGoogleAdsClient as never
      );

      const result = await isDeveloperTokenValid(validToken, mockAdsClient);
      expect(result).toBe(false);
    });
  });
});
