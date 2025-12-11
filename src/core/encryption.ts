/**
 * Secrets encryption module using libsodium
 * Provides encryption-at-rest for sensitive data (e.g., refresh tokens)
 */

import sodium from "libsodium-wrappers";

/**
 * Encryption error for encryption/decryption failures
 */
export class EncryptionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "EncryptionError";
  }
}

/**
 * Generate a random encryption key (base64 encoded)
 * @returns Base64-encoded encryption key
 */
export async function generateEncryptionKey(): Promise<string> {
  await sodium.ready;
  // libsodium's crypto_secretbox_KEYBYTES is 32 bytes
  const keyBytes = sodium.randombytes_buf(32);
  return sodium.to_base64(keyBytes, sodium.base64_variants.ORIGINAL);
}

/**
 * Encrypt a secret string using libsodium secretbox
 * @param plaintext - The secret to encrypt
 * @param key - Base64-encoded encryption key
 * @returns Base64-encoded encrypted data (nonce + ciphertext)
 */
export async function encryptSecret(
  plaintext: string,
  key: string
): Promise<string> {
  await sodium.ready;

  try {
    const keyBytes = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
    if (keyBytes.length !== sodium.crypto_secretbox_KEYBYTES) {
      throw new EncryptionError(
        `Invalid key length: expected ${sodium.crypto_secretbox_KEYBYTES} bytes`
      );
    }

    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const plaintextBytes = sodium.from_string(plaintext);
    const ciphertext = sodium.crypto_secretbox_easy(
      plaintextBytes,
      nonce,
      keyBytes
    );

    // Combine nonce and ciphertext: base64(nonce | ciphertext)
    const combined = new Uint8Array(nonce.length + ciphertext.length);
    combined.set(nonce);
    combined.set(ciphertext, nonce.length);

    return sodium.to_base64(combined, sodium.base64_variants.ORIGINAL);
  } catch (error) {
    if (error instanceof EncryptionError) {
      throw error;
    }
    throw new EncryptionError(
      `Encryption failed: ${(error as Error).message}`,
      error as Error
    );
  }
}

/**
 * Decrypt an encrypted secret
 * @param ciphertext - Base64-encoded encrypted data (nonce + ciphertext)
 * @param key - Base64-encoded encryption key
 * @returns Decrypted plaintext string
 */
export async function decryptSecret(
  ciphertext: string,
  key: string
): Promise<string> {
  await sodium.ready;

  try {
    const keyBytes = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
    if (keyBytes.length !== sodium.crypto_secretbox_KEYBYTES) {
      throw new EncryptionError(
        `Invalid key length: expected ${sodium.crypto_secretbox_KEYBYTES} bytes`
      );
    }

    const combined = sodium.from_base64(
      ciphertext,
      sodium.base64_variants.ORIGINAL
    );
    const nonceLength = sodium.crypto_secretbox_NONCEBYTES;

    if (combined.length < nonceLength) {
      throw new EncryptionError("Invalid ciphertext: too short");
    }

    const nonce = combined.slice(0, nonceLength);
    const encryptedData = combined.slice(nonceLength);

    const plaintextBytes = sodium.crypto_secretbox_open_easy(
      encryptedData,
      nonce,
      keyBytes
    );

    return sodium.to_string(plaintextBytes);
  } catch (error) {
    if (error instanceof EncryptionError) {
      throw error;
    }
    // libsodium throws generic errors, wrap them
    throw new EncryptionError(
      `Decryption failed: ${(error as Error).message}`,
      error as Error
    );
  }
}
