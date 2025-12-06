/**
 * Google Ads developer token validation utilities
 * Provides functions to validate developer token format and status
 */

import type { AdsClient } from "./client.js";
import { createPreconditionError, createAuthError } from "../core/errors.js";

/**
 * Validate developer token format
 * Google Ads developer tokens follow the format: XXXX-XXXX-XXXX-XXXX (16 characters, 4 groups)
 * @param token - Developer token to validate
 * @throws {PreconditionError} If token format is invalid
 */
export function validateDeveloperTokenFormat(token: string): void {
  if (!token || token.trim().length === 0) {
    throw createPreconditionError(
      "precheck_failed",
      "Developer token cannot be empty",
      { token: "***" }
    );
  }

  // Google Ads developer tokens are typically 19 characters: XXXX-XXXX-XXXX-XXXX
  // Format: 4 alphanumeric groups separated by hyphens
  const tokenPattern = /^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/;

  if (!tokenPattern.test(token)) {
    throw createPreconditionError(
      "precheck_failed",
      "Invalid developer token format. Expected format: XXXX-XXXX-XXXX-XXXX",
      { token: "***" }
    );
  }
}

/**
 * Validate developer token status by making a test API call
 * Uses listAccessibleCustomers as a lightweight validation endpoint
 * @param adsClient - Ads client instance
 * @throws {Error} If token is invalid or API call fails
 */
export async function validateDeveloperTokenStatus(
  adsClient: AdsClient
): Promise<void> {
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    customers?: {
      listAccessibleCustomers?: () => Promise<{
        resourceNames?: string[];
      }>;
    };
  };

  if (!googleAdsClient?.customers?.listAccessibleCustomers) {
    throw new Error("Google Ads client not properly initialized");
  }

  try {
    await googleAdsClient.customers.listAccessibleCustomers();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error
        ? (error.code as number)
        : undefined;

    // 401 indicates invalid authentication (likely invalid developer token)
    if (errorCode === 401) {
      throw createAuthError(
        "invalid_grant",
        "Invalid developer token",
        { errorCode, errorMessage }
      );
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Check if developer token is valid (format and status)
 * @param token - Developer token to validate
 * @param adsClient - Ads client instance
 * @returns True if token is valid, false otherwise
 */
export async function isDeveloperTokenValid(
  token: string,
  adsClient: AdsClient
): Promise<boolean> {
  try {
    // First validate format
    validateDeveloperTokenFormat(token);

    // Then validate status
    await validateDeveloperTokenStatus(adsClient);

    return true;
  } catch {
    // Any error means token is invalid
    return false;
  }
}
