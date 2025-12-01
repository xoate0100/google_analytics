import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  TokenStorage,
  TokenStorageOptions,
  StoredCredentials,
} from "../../../src/core/token-storage.js";
import type { ILogger } from "../../../src/core/types.js";
import { generateEncryptionKey } from "../../../src/core/encryption.js";

describe("Token Storage", () => {
  let mockLogger: ILogger;
  let testDir: string;
  let storageOptions: TokenStorageOptions;

  beforeEach(async () => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => mockLogger),
    };

    // Create a temporary directory for tests
    testDir = join(tmpdir(), `token-storage-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    const encryptionKey = await generateEncryptionKey();
    storageOptions = {
      credentialsPath: join(testDir, "credentials.enc.json"),
      encryptionKey,
      logger: mockLogger,
    };
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("constructor", () => {
    it("should create token storage with required options", () => {
      const storage = new TokenStorage(storageOptions);
      expect(storage).toBeDefined();
    });

    it("should throw error if encryptionKey is missing", () => {
      expect(() => {
        new TokenStorage({
          ...storageOptions,
          encryptionKey: "",
        });
      }).toThrow();
    });
  });

  describe("storeTokens", () => {
    it("should store encrypted tokens for a product", async () => {
      const storage = new TokenStorage(storageOptions);
      const tokens: StoredCredentials = {
        refreshToken: "test-refresh-token",
        accessToken: "test-access-token",
        expiresAt: Date.now() + 3600000,
        scopes: ["scope1", "scope2"],
      };

      await storage.storeTokens("ga4", tokens);

      // Verify file was created
      const fileExists = await fs
        .access(storageOptions.credentialsPath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });

    it("should store tokens for multiple products", async () => {
      const storage = new TokenStorage(storageOptions);
      const ga4Tokens: StoredCredentials = {
        refreshToken: "ga4-refresh-token",
      };
      const gtmTokens: StoredCredentials = {
        refreshToken: "gtm-refresh-token",
      };

      await storage.storeTokens("ga4", ga4Tokens);
      await storage.storeTokens("gtm", gtmTokens);

      const ga4Retrieved = await storage.getTokens("ga4");
      const gtmRetrieved = await storage.getTokens("gtm");

      expect(ga4Retrieved?.refreshToken).toBe("ga4-refresh-token");
      expect(gtmRetrieved?.refreshToken).toBe("gtm-refresh-token");
    });

    it("should overwrite existing tokens for a product", async () => {
      const storage = new TokenStorage(storageOptions);
      const tokens1: StoredCredentials = {
        refreshToken: "old-refresh-token",
      };
      const tokens2: StoredCredentials = {
        refreshToken: "new-refresh-token",
      };

      await storage.storeTokens("ga4", tokens1);
      await storage.storeTokens("ga4", tokens2);

      const retrieved = await storage.getTokens("ga4");
      expect(retrieved?.refreshToken).toBe("new-refresh-token");
    });
  });

  describe("getTokens", () => {
    it("should retrieve stored tokens for a product", async () => {
      const storage = new TokenStorage(storageOptions);
      const tokens: StoredCredentials = {
        refreshToken: "test-refresh-token",
        accessToken: "test-access-token",
        expiresAt: Date.now() + 3600000,
        scopes: ["scope1"],
      };

      await storage.storeTokens("ga4", tokens);
      const retrieved = await storage.getTokens("ga4");

      expect(retrieved).toBeDefined();
      expect(retrieved?.refreshToken).toBe("test-refresh-token");
      expect(retrieved?.accessToken).toBe("test-access-token");
      expect(retrieved?.scopes).toEqual(["scope1"]);
    });

    it("should return undefined for non-existent product", async () => {
      const storage = new TokenStorage(storageOptions);
      const retrieved = await storage.getTokens("unknown");
      expect(retrieved).toBeUndefined();
    });

    it("should return undefined if file does not exist", async () => {
      const storage = new TokenStorage(storageOptions);
      const retrieved = await storage.getTokens("ga4");
      expect(retrieved).toBeUndefined();
    });
  });

  describe("deleteTokens", () => {
    it("should delete tokens for a product", async () => {
      const storage = new TokenStorage(storageOptions);
      const tokens: StoredCredentials = {
        refreshToken: "test-refresh-token",
      };

      await storage.storeTokens("ga4", tokens);
      await storage.deleteTokens("ga4");

      const retrieved = await storage.getTokens("ga4");
      expect(retrieved).toBeUndefined();
    });

    it("should not throw error if product does not exist", async () => {
      const storage = new TokenStorage(storageOptions);
      await expect(storage.deleteTokens("unknown")).resolves.toBeUndefined();
    });
  });

  describe("listProducts", () => {
    it("should return list of products with stored tokens", async () => {
      const storage = new TokenStorage(storageOptions);

      await storage.storeTokens("ga4", { refreshToken: "token1" });
      await storage.storeTokens("gtm", { refreshToken: "token2" });
      await storage.storeTokens("ads", { refreshToken: "token3" });

      const products = await storage.listProducts();
      expect(products).toContain("ga4");
      expect(products).toContain("gtm");
      expect(products).toContain("ads");
      expect(products.length).toBe(3);
    });

    it("should return empty array if no tokens stored", async () => {
      const storage = new TokenStorage(storageOptions);
      const products = await storage.listProducts();
      expect(products).toEqual([]);
    });
  });

  describe("encryption", () => {
    it("should encrypt tokens before storing", async () => {
      const storage = new TokenStorage(storageOptions);
      const tokens: StoredCredentials = {
        refreshToken: "sensitive-refresh-token",
      };

      await storage.storeTokens("ga4", tokens);

      // Read raw file content
      const fileContent = await fs.readFile(
        storageOptions.credentialsPath,
        "utf-8"
      );
      const parsed = JSON.parse(fileContent);

      // Verify tokens are encrypted (not plaintext)
      expect(parsed.ga4).toBeDefined();
      expect(parsed.ga4.refreshToken).not.toBe("sensitive-refresh-token");
      expect(typeof parsed.ga4.refreshToken).toBe("string");
    });

    it("should decrypt tokens when retrieving", async () => {
      const storage = new TokenStorage(storageOptions);
      const tokens: StoredCredentials = {
        refreshToken: "sensitive-refresh-token",
        accessToken: "sensitive-access-token",
      };

      await storage.storeTokens("ga4", tokens);
      const retrieved = await storage.getTokens("ga4");

      expect(retrieved?.refreshToken).toBe("sensitive-refresh-token");
      expect(retrieved?.accessToken).toBe("sensitive-access-token");
    });
  });
});

