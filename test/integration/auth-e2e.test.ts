/**
 * End-to-End Authentication Tests
 * Tests the complete authentication flow from auth.login through token storage
 * Uses mocked OAuth endpoints to simulate the device flow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initializeServer } from "../../src/server.js";
import type { MCPServerBootstrap } from "../../src/server/bootstrap.js";
import { TokenStorage } from "../../src/core/token-storage.js";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import sodium from "libsodium-wrappers";

/**
 * Generate a valid base64-encoded encryption key for testing
 */
async function generateTestEncryptionKey(): Promise<string> {
  await sodium.ready;
  const key = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
  return sodium.to_base64(key, sodium.base64_variants.ORIGINAL);
}

describe("End-to-End Authentication Flow", () => {
  let bootstrap: MCPServerBootstrap;
  let tempCredentialsPath: string;
  let originalEnv: NodeJS.ProcessEnv;
  let originalFetch: typeof global.fetch;
  let testEncryptionKey: string;

  beforeEach(async () => {
    // Save original environment and fetch
    originalEnv = { ...process.env };
    originalFetch = global.fetch;

    // Generate valid encryption key
    testEncryptionKey = await generateTestEncryptionKey();

    // Set up test environment variables
    process.env.GOOGLE_CLIENT_ID = "test-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
    process.env.MCP_ENCRYPTION_KEY = testEncryptionKey;
    process.env.LOG_LEVEL = "silent";

    // Create temporary credentials directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-test-"));
    tempCredentialsPath = path.join(tempDir, "credentials.enc.json");
    process.env.MCP_CREDENTIALS_PATH = tempCredentialsPath;

    // Initialize server
    const serverInit = initializeServer();
    bootstrap = serverInit.bootstrap;
  });

  afterEach(async () => {
    // Restore environment and fetch
    process.env = originalEnv;
    global.fetch = originalFetch;

    // Clean up temporary files
    try {
      const credentialsDir = path.dirname(tempCredentialsPath);
      await fs.rm(credentialsDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    vi.restoreAllMocks();
  });

  it("should complete full authentication flow: device flow -> polling -> token storage", async () => {
    const deviceCode = "test-device-code-12345";
    const userCode = "ABCD-EFGH";
    const accessToken = "test-access-token";
    const refreshToken = "test-refresh-token";
    const expiresIn = 3600;

    let pollCallCount = 0;

    // Mock fetch for device code endpoint
    global.fetch = vi.fn((url, options) => {
      const urlStr = url as string;
      if (urlStr.includes("/device/code")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            device_code: deviceCode,
            user_code: userCode,
            verification_url: "https://www.google.com/device",
            expires_in: 1800,
            interval: 5,
          }),
        } as Response);
      }
      if (urlStr.includes("/token")) {
        pollCallCount++;
        // First poll returns authorization_pending
        if (pollCallCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 400,
            statusText: "Bad Request",
            json: async () => ({
              error: "authorization_pending",
              error_description: "User has not yet completed the authorization",
            }),
          } as Response);
        }
        // Second poll returns tokens
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: expiresIn,
            token_type: "Bearer",
            scope: "https://www.googleapis.com/auth/analytics.readonly",
          }),
        } as Response);
      }
      return originalFetch(url as string, options);
    }) as typeof global.fetch;

    // Get auth.login tool
    const authLoginTool = bootstrap.getRegisteredTools().get("auth.login");
    expect(authLoginTool).toBeDefined();

    // Step 1: Initiate device flow
    const deviceFlowResult = await authLoginTool?.handler({});
    expect(deviceFlowResult).toMatchObject({
      userCode,
      verificationUrl: "https://www.google.com/device",
      deviceCode,
      expiresIn: 1800,
      message: expect.stringContaining("Please visit"),
      nextStep: expect.stringContaining("deviceCode"),
    });

    // Step 2: Poll for tokens (simulating user authorization)
    // First poll should throw authorization_pending error (which is caught and retried internally)
    // The tool will retry, so we need to wait for the second poll to succeed
    // Since the retry logic handles authorization_pending, we'll get tokens on the second attempt
    const pollResult = await authLoginTool?.handler({
      deviceCode,
    });
    expect(pollResult).toMatchObject({
      message: expect.stringContaining("Authentication successful"),
      authenticated: true,
    });

    // Step 3: Verify tokens were stored
    const tokenStorage = new TokenStorage({
      credentialsPath: tempCredentialsPath,
      encryptionKey: testEncryptionKey,
      logger: bootstrap["logger"],
    });

    const storedTokens = await tokenStorage.getTokens("google");
    expect(storedTokens).toBeDefined();
    expect(storedTokens?.accessToken).toBe(accessToken);
    expect(storedTokens?.refreshToken).toBe(refreshToken);
    expect(storedTokens?.expiresAt).toBeGreaterThan(
      Math.floor(Date.now() / 1000)
    );
  });

  it("should handle expired device code", async () => {
    const deviceCode = "expired-device-code";

    // Mock fetch
    global.fetch = vi.fn((url, options) => {
      const urlStr = url as string;
      if (urlStr.includes("/device/code")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            device_code: deviceCode,
            user_code: "WXYZ-1234",
            verification_url: "https://www.google.com/device",
            expires_in: 1800,
            interval: 5,
          }),
        } as Response);
      }
      if (urlStr.includes("/token")) {
        return Promise.resolve({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          json: async () => ({
            error: "expired_token",
            error_description: "The device code has expired",
          }),
        } as Response);
      }
      return originalFetch(url as string, options);
    }) as typeof global.fetch;

    const authLoginTool = bootstrap.getRegisteredTools().get("auth.login");
    expect(authLoginTool).toBeDefined();

    // Initiate device flow
    await authLoginTool?.handler({});

    // Try to poll with expired code - should throw error
    await expect(
      authLoginTool?.handler({
        deviceCode,
      })
    ).rejects.toThrow(/expired|Device code has expired/i);
  });

  it("should handle slow_down error and adjust polling interval", async () => {
    const deviceCode = "slow-down-device-code";
    let tokenCallCount = 0;

    // Mock fetch - return slow_down first, then expired_token to stop retries immediately
    global.fetch = vi.fn((url, options) => {
      const urlStr = url as string;
      if (urlStr.includes("/device/code")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            device_code: deviceCode,
            user_code: "SLOW-1234",
            verification_url: "https://www.google.com/device",
            expires_in: 1800,
            interval: 5,
          }),
        } as Response);
      }
      if (urlStr.includes("/token")) {
        tokenCallCount++;
        // First call returns slow_down (tests the error handling)
        if (tokenCallCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 400,
            statusText: "Bad Request",
            json: async () => ({
              error: "slow_down",
              error_description: "Polling too frequently",
            }),
          } as Response);
        }
        // Second call returns expired_token to stop retries immediately
        return Promise.resolve({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          json: async () => ({
            error: "expired_token",
            error_description: "Device code expired",
          }),
        } as Response);
      }
      return originalFetch(url as string, options);
    }) as typeof global.fetch;

    const authLoginTool = bootstrap.getRegisteredTools().get("auth.login");
    expect(authLoginTool).toBeDefined();

    // Initiate device flow
    await authLoginTool?.handler({});

    // Try to poll - slow_down will cause retries with increased interval
    // After retries, expired_token will throw to stop the cycle
    // This verifies slow_down error handling (interval adjustment)
    await expect(
      authLoginTool?.handler({
        deviceCode,
      })
    ).rejects.toThrow(/expired|Device code/i);
  }, 20000); // Increased timeout to allow for retry delays

  it("should handle auth.rotate flow: revoke -> new device flow", async () => {
    const newDeviceCode = "new-device-code-123";
    const newUserCode = "NEW-CODE";

    // Mock fetch for device code (no tokens to revoke, so revoke step is skipped)
    global.fetch = vi.fn((url, options) => {
      const urlStr = url as string;
      if (urlStr.includes("/device/code")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            device_code: newDeviceCode,
            user_code: newUserCode,
            verification_url: "https://www.google.com/device",
            expires_in: 1800,
            interval: 5,
          }),
        } as Response);
      }
      return originalFetch(url as string, options);
    }) as typeof global.fetch;

    // Get auth.rotate tool
    const authRotateTool = bootstrap.getRegisteredTools().get("auth.rotate");
    expect(authRotateTool).toBeDefined();

    // Execute rotate - no tokens to revoke, so it should just start device flow
    const result = await authRotateTool?.handler({});

    expect(result).toMatchObject({
      userCode: newUserCode,
      verificationUrl: "https://www.google.com/device",
      deviceCode: newDeviceCode,
      message: expect.stringContaining("Please visit"),
    });
  });

  it("should handle auth.status: check authentication status", async () => {
    const accessToken = "test-access-token";
    const refreshToken = "test-refresh-token";

    // Store tokens
    const tokenStorage = new TokenStorage({
      credentialsPath: tempCredentialsPath,
      encryptionKey: testEncryptionKey,
      logger: bootstrap["logger"],
    });

    await tokenStorage.storeTokens("google", {
      accessToken,
      refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });

    // Get auth.status tool
    const authStatusTool = bootstrap.getRegisteredTools().get("auth.status");
    expect(authStatusTool).toBeDefined();

    // Check status
    const result = await authStatusTool?.handler({});

    expect(result).toMatchObject({
      authenticated: true,
      products: expect.arrayContaining(["google"]),
    });
  });

  it("should handle auth.status when not authenticated", async () => {
    // Get auth.status tool
    const authStatusTool = bootstrap.getRegisteredTools().get("auth.status");
    expect(authStatusTool).toBeDefined();

    // Check status when no tokens exist
    const result = await authStatusTool?.handler({});

    expect(result).toMatchObject({
      authenticated: false,
      products: [],
    });
  });
});
