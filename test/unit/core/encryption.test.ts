import { describe, it, expect } from "vitest";
import sodium from "libsodium-wrappers";
import {
  encryptSecret,
  decryptSecret,
  generateEncryptionKey,
  EncryptionError,
} from "../../../src/core/encryption.js";

describe("Encryption module", () => {
  describe("generateEncryptionKey", () => {
    it("should generate a valid encryption key", async () => {
      const key = await generateEncryptionKey();
      expect(key).toBeDefined();
      expect(key.length).toBeGreaterThan(0);
      expect(typeof key).toBe("string");
    });

    it("should generate unique keys", async () => {
      const key1 = await generateEncryptionKey();
      const key2 = await generateEncryptionKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe("encryptSecret", () => {
    it("should encrypt a secret string", async () => {
      const key = await generateEncryptionKey();
      const plaintext = "sensitive-refresh-token";

      const encrypted = await encryptSecret(plaintext, key);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(typeof encrypted).toBe("string");
    });

    it("should produce different ciphertext for same plaintext (nonce)", async () => {
      const key = await generateEncryptionKey();
      const plaintext = "same-secret";

      const encrypted1 = await encryptSecret(plaintext, key);
      const encrypted2 = await encryptSecret(plaintext, key);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should throw EncryptionError for invalid key", async () => {
      // Generate a valid key format but wrong length
      await sodium.ready;
      const invalidKey = sodium.to_base64(sodium.randombytes_buf(16)); // Too short
      const plaintext = "secret";

      await expect(encryptSecret(plaintext, invalidKey)).rejects.toThrow(
        EncryptionError
      );
    });
  });

  describe("decryptSecret", () => {
    it("should decrypt an encrypted secret", async () => {
      const key = await generateEncryptionKey();
      const plaintext = "sensitive-refresh-token";

      const encrypted = await encryptSecret(plaintext, key);
      const decrypted = await decryptSecret(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it("should throw EncryptionError for invalid ciphertext", async () => {
      const key = await generateEncryptionKey();
      const invalidCiphertext = "not-valid-encrypted-data";

      await expect(decryptSecret(invalidCiphertext, key)).rejects.toThrow(
        EncryptionError
      );
    });

    it("should throw EncryptionError for wrong key", async () => {
      const key1 = await generateEncryptionKey();
      const key2 = await generateEncryptionKey();
      const plaintext = "secret";

      const encrypted = await encryptSecret(plaintext, key1);

      await expect(decryptSecret(encrypted, key2)).rejects.toThrow(
        EncryptionError
      );
    });

    it("should handle empty strings", async () => {
      const key = await generateEncryptionKey();
      const plaintext = "";

      const encrypted = await encryptSecret(plaintext, key);
      const decrypted = await decryptSecret(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle long strings", async () => {
      const key = await generateEncryptionKey();
      const plaintext = "a".repeat(10000);

      const encrypted = await encryptSecret(plaintext, key);
      const decrypted = await decryptSecret(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe("round-trip encryption", () => {
    it("should encrypt and decrypt various data types", async () => {
      const key = await generateEncryptionKey();
      const testCases = [
        "simple-token",
        "token-with-special-chars-!@#$%^&*()",
        "token-with-unicode-🚀-test",
        JSON.stringify({ refresh_token: "abc123", expires_at: 123456 }),
      ];

      for (const plaintext of testCases) {
        const encrypted = await encryptSecret(plaintext, key);
        const decrypted = await decryptSecret(encrypted, key);
        expect(decrypted).toBe(plaintext);
      }
    });
  });
});
