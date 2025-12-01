/**
 * Token storage with encryption
 * Stores encrypted OAuth tokens in credentials.enc.json
 */

import { promises as fs } from "node:fs";
import { dirname } from "node:path";
import type { ILogger } from "./types.js";
import { encryptSecret, decryptSecret, EncryptionError } from "./encryption.js";
import { createAuthError } from "./errors.js";

/**
 * Stored credentials structure
 */
export interface StoredCredentials {
  refreshToken?: string | undefined;
  accessToken?: string | undefined;
  expiresAt?: number | undefined;
  scopes?: string[] | undefined;
}

/**
 * Encrypted credentials file structure
 */
interface EncryptedCredentialsFile {
  [product: string]: {
    refreshToken?: string | undefined; // Encrypted
    accessToken?: string | undefined; // Encrypted
    expiresAt?: number | undefined; // Not encrypted (metadata)
    scopes?: string[] | undefined; // Not encrypted (metadata)
  };
}

/**
 * Token storage options
 */
export interface TokenStorageOptions {
  credentialsPath: string;
  encryptionKey: string;
  logger: ILogger;
}

/**
 * Token storage with encryption
 */
export class TokenStorage {
  private readonly credentialsPath: string;
  private readonly encryptionKey: string;
  private readonly logger: ILogger;

  constructor(options: TokenStorageOptions) {
    if (!options.encryptionKey) {
      throw createAuthError(
        "invalid_grant",
        "Encryption key is required for token storage"
      );
    }

    this.credentialsPath = options.credentialsPath;
    this.encryptionKey = options.encryptionKey;
    this.logger = options.logger;
  }

  /**
   * Store encrypted tokens for a product
   * @param product - Product name (ga4, gtm, ads)
   * @param credentials - Credentials to store
   */
  async storeTokens(
    product: string,
    credentials: StoredCredentials
  ): Promise<void> {
    this.logger.info("Storing tokens", { product });

    try {
      const allCredentials = await this.loadCredentials();
      const encrypted = await this.encryptCredentials(credentials);
      allCredentials[product] = encrypted;

      await fs.mkdir(dirname(this.credentialsPath), { recursive: true });
      await fs.writeFile(
        this.credentialsPath,
        JSON.stringify(allCredentials, null, 2),
        "utf-8"
      );
    } catch (error) {
      if (error instanceof EncryptionError) {
        throw createAuthError(
          "invalid_grant",
          `Token encryption failed: ${error.message}`,
          { originalError: error }
        );
      }
      throw createAuthError(
        "invalid_grant",
        `Token storage failed: ${(error as Error).message}`,
        { originalError: error }
      );
    }
  }

  /**
   * Encrypt credentials
   * @param credentials - Credentials to encrypt
   * @returns Encrypted credentials
   */
  private async encryptCredentials(
    credentials: StoredCredentials
  ): Promise<EncryptedCredentialsFile[string]> {
    const encrypted: EncryptedCredentialsFile[string] = {
      expiresAt: credentials.expiresAt,
      scopes: credentials.scopes,
    };

    if (credentials.refreshToken) {
      encrypted.refreshToken = await encryptSecret(
        credentials.refreshToken,
        this.encryptionKey
      );
    }

    if (credentials.accessToken) {
      encrypted.accessToken = await encryptSecret(
        credentials.accessToken,
        this.encryptionKey
      );
    }

    return encrypted;
  }

  /**
   * Get decrypted tokens for a product
   * @param product - Product name
   * @returns Decrypted credentials or undefined
   */
  async getTokens(
    product: string
  ): Promise<StoredCredentials | undefined> {
    this.logger.info("Retrieving tokens", { product });

    try {
      const allCredentials = await this.loadCredentials();
      const encrypted = allCredentials[product];

      if (!encrypted) {
        return undefined;
      }

      // Decrypt sensitive fields
      const decrypted: StoredCredentials = {
        expiresAt: encrypted.expiresAt,
        scopes: encrypted.scopes,
      };

      if (encrypted.refreshToken) {
        decrypted.refreshToken = await decryptSecret(
          encrypted.refreshToken,
          this.encryptionKey
        );
      }

      if (encrypted.accessToken) {
        decrypted.accessToken = await decryptSecret(
          encrypted.accessToken,
          this.encryptionKey
        );
      }

      return decrypted;
    } catch (error) {
      if (error instanceof EncryptionError) {
        throw createAuthError(
          "invalid_grant",
          `Token decryption failed: ${error.message}`,
          { originalError: error }
        );
      }
      throw createAuthError(
        "invalid_grant",
        `Token retrieval failed: ${(error as Error).message}`,
        { originalError: error }
      );
    }
  }

  /**
   * Delete tokens for a product
   * @param product - Product name
   */
  async deleteTokens(product: string): Promise<void> {
    this.logger.info("Deleting tokens", { product });

    try {
      const allCredentials = await this.loadCredentials();
      delete allCredentials[product];

      // If no products left, delete the file
      if (Object.keys(allCredentials).length === 0) {
        await fs.unlink(this.credentialsPath).catch(() => {
          // Ignore if file doesn't exist
        });
        return;
      }

      // Write updated credentials
      await fs.writeFile(
        this.credentialsPath,
        JSON.stringify(allCredentials, null, 2),
        "utf-8"
      );
    } catch (error) {
      // Ignore errors if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw createAuthError(
          "invalid_grant",
          `Token deletion failed: ${(error as Error).message}`,
          { originalError: error }
        );
      }
    }
  }

  /**
   * List all products with stored tokens
   * @returns Array of product names
   */
  async listProducts(): Promise<string[]> {
    try {
      const allCredentials = await this.loadCredentials();
      return Object.keys(allCredentials);
    } catch {
      return [];
    }
  }

  /**
   * Load credentials from file
   * @returns Encrypted credentials file
   */
  private async loadCredentials(): Promise<EncryptedCredentialsFile> {
    try {
      const content = await fs.readFile(this.credentialsPath, "utf-8");
      return JSON.parse(content) as EncryptedCredentialsFile;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return {};
      }
      throw error;
    }
  }
}

