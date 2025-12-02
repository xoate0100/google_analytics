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

  constructor(options: OAuthClientOptions) {
    if (!options.clientId || !options.clientSecret) {
      throw createAuthError(
        "invalid_grant",
        "Client ID and Client Secret are required"
      );
    }

    this.logger = options.logger;
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

    // For now, return a stub implementation
    // This will be replaced with actual device flow in future tasks
    const deviceCode = `device_${Date.now()}_${Math.random().toString(36)}`;
    const userCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    return Promise.resolve({
      deviceCode,
      userCode,
      verificationUrl: "https://www.google.com/device",
      expiresIn: 1800, // 30 minutes
      interval: 5, // 5 seconds
      scopes,
    });
  }

  /**
   * Poll for tokens after device flow authorization
   * @param deviceCode - Device code from startDeviceFlow
   * @returns Token information
   */
  async pollForTokens(deviceCode: string): Promise<TokenInfo> {
    this.logger.info("Polling for tokens", { deviceCode });

    // Stub implementation - will be replaced with actual polling
    return Promise.reject(
      createAuthError(
        "invalid_grant",
        "Device flow polling not yet implemented"
      )
    );
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

