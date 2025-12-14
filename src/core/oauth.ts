/**
 * OAuth 2.0 client with device flow support
 * Uses google-auth-library for OAuth operations
 */

import { OAuth2Client } from "google-auth-library";
import type { ILogger } from "./types.js";
import { createAuthError } from "./errors.js";

/**
 * Device flow result
 */
export interface DeviceFlowResult {
  deviceCode: string;
  userCode: string;
  verificationUrl: string;
  expiresIn: number; // seconds
  interval: number; // polling interval in seconds
  scopes: string[];
}

/**
 * Token information
 */
export interface TokenInfo {
  accessToken: string;
  refreshToken?: string | undefined;
  expiresAt?: number | undefined; // Unix timestamp
  scopes?: string[] | undefined;
}

/**
 * OAuth client options
 */
export interface OAuthClientOptions {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  logger: ILogger;
}

/**
 * OAuth 2.0 client with device flow
 */
export class OAuthClient {
  private readonly oauth2Client: OAuth2Client;
  private readonly logger: ILogger;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(options: OAuthClientOptions) {
    if (!options.clientId || !options.clientSecret) {
      throw createAuthError(
        "invalid_grant",
        "Client ID and Client Secret are required"
      );
    }

    this.logger = options.logger;
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.oauth2Client = new OAuth2Client(
      options.clientId,
      options.clientSecret,
      options.redirectUri
    );
  }

  /**
   * Start OAuth device flow
   * @param scopes - OAuth scopes to request
   * @returns Device flow information
   */
  async startDeviceFlow(scopes: string[]): Promise<DeviceFlowResult> {
    this.logger.info("Starting OAuth device flow", { scopes });

    const deviceCodeUrl = "https://oauth2.googleapis.com/device/code";
    const requestBody = new URLSearchParams({
      client_id: this.clientId,
      scope: scopes.join(" "),
    });

    try {
      const response = await fetch(deviceCodeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: requestBody.toString(),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as {
          error?: string;
          error_description?: string;
        };
        throw createAuthError(
          "invalid_grant",
          errorData.error_description || `Device flow failed: ${response.statusText}`,
          { status: response.status, error: errorData.error }
        );
      }

      const data = (await response.json()) as {
        device_code: string;
        user_code: string;
        verification_url: string;
        expires_in: number;
        interval: number;
      };

      return {
        deviceCode: data.device_code,
        userCode: data.user_code,
        verificationUrl: data.verification_url,
        expiresIn: data.expires_in,
        interval: data.interval,
        scopes,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AuthError") {
        throw error;
      }
      throw createAuthError(
        "invalid_grant",
        `Device flow request failed: ${(error as Error).message}`,
        { originalError: error }
      );
    }
  }

  /**
   * Poll for tokens after device flow authorization
   * @param deviceCode - Device code from startDeviceFlow
   * @param interval - Polling interval in seconds (default: 5)
   * @returns Token information
   */
  async pollForTokens(
    deviceCode: string,
    interval: number = 5
  ): Promise<TokenInfo> {
    this.logger.info("Polling for tokens", { deviceCode, interval });

    const tokenUrl = "https://oauth2.googleapis.com/token";
    const requestBody = new URLSearchParams({
      device_code: deviceCode,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    });

    try {
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: requestBody.toString(),
      });

      const data = (await response.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
        scope?: string;
        error?: string;
        error_description?: string;
      };

      if (!response.ok || data.error) {
        const errorCode = data.error || "invalid_grant";
        const errorMessage =
          data.error_description || `Token polling failed: ${response.statusText}`;

        if (errorCode === "authorization_pending") {
          throw createAuthError(
            "invalid_grant",
            "Authorization pending. User has not yet completed authorization.",
            { error: errorCode, retryAfter: interval }
          );
        }

        if (errorCode === "slow_down") {
          throw createAuthError(
            "invalid_grant",
            "Polling too frequently. Increase polling interval.",
            { error: errorCode, retryAfter: interval + 5 }
          );
        }

        if (errorCode === "expired_token") {
          throw createAuthError(
            "invalid_grant",
            "Device code has expired. Please start a new device flow.",
            { error: errorCode }
          );
        }

        throw createAuthError("invalid_grant", errorMessage, {
          error: errorCode,
          status: response.status,
        });
      }

      if (!data.access_token) {
        throw createAuthError("invalid_grant", "No access token received");
      }

      const expiresAt = data.expires_in
        ? Math.floor(Date.now() / 1000) + data.expires_in
        : undefined;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        scopes: data.scope?.split(" ") || undefined,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AuthError") {
        throw error;
      }
      throw createAuthError(
        "invalid_grant",
        `Token polling request failed: ${(error as Error).message}`,
        { originalError: error }
      );
    }
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Refresh token
   * @returns New token information
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenInfo> {
    this.logger.info("Refreshing access token");

    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw createAuthError("invalid_grant", "No access token received");
      }

      return {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || refreshToken,
        expiresAt: credentials.expiry_date
          ? Math.floor(credentials.expiry_date / 1000)
          : undefined,
        scopes: credentials.scope?.split(" ") || undefined,
      };
    } catch (error) {
      throw createAuthError(
        "invalid_grant",
        `Token refresh failed: ${(error as Error).message}`,
        { originalError: error }
      );
    }
  }

  /**
   * Revoke a token
   * @param token - Access or refresh token to revoke
   */
  async revokeToken(token: string): Promise<void> {
    this.logger.info("Revoking token");

    try {
      await this.oauth2Client.revokeToken(token);
    } catch (error) {
      throw createAuthError(
        "invalid_grant",
        `Token revocation failed: ${(error as Error).message}`,
        { originalError: error }
      );
    }
  }

  /**
   * Get token information
   * @param _accessToken - Access token to inspect
   * @returns Token information
   */
  async getTokenInfo(_accessToken: string): Promise<TokenInfo> {
    this.logger.info("Getting token info");

    // Stub implementation - will be extended with actual token introspection
    // For access tokens, we'd need to call tokeninfo endpoint or decode JWT
    return Promise.reject(
      createAuthError(
        "invalid_grant",
        "Token info retrieval not yet implemented for access tokens"
      )
    );
  }

  /**
   * Get default OAuth scopes for all products
   * @returns Array of scope strings
   */
  getDefaultScopes(): string[] {
    return [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/analytics.edit",
      "https://www.googleapis.com/auth/tagmanager.readonly",
      "https://www.googleapis.com/auth/tagmanager.edit.containers",
      "https://www.googleapis.com/auth/tagmanager.publish",
    ];
  }

  /**
   * Get OAuth2Client instance (for advanced usage)
   * @returns OAuth2Client instance
   */
  getOAuth2Client(): OAuth2Client {
    return this.oauth2Client;
  }
}
