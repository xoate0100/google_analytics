#!/usr/bin/env tsx
/**
 * Smoke test script
 * Tests basic functionality: auth.status, capabilities.get, one read per product
 * 
 * Usage:
 *   pnpm smoke
 *   or
 *   tsx scripts/smoke.ts
 */

import { MCPServerBootstrap } from "../src/server/bootstrap.js";
import { registerCoreUtilityTools } from "../src/server/tools.js";
import { registerGA4Tools } from "../src/ga4/tools.js";
import { PinoLogger } from "../src/core/logger.js";
import { LRUCache } from "../src/core/cache.js";
import { TokenBucketLimiter } from "../src/core/limiter.js";
import { CapabilitiesRegistry } from "../src/core/capabilities.js";
import { OAuthClient } from "../src/core/oauth.js";
import { TokenStorage } from "../src/core/token-storage.js";
import { GA4Client } from "../src/ga4/client.js";
import type { ILogger } from "../src/core/types.js";

/**
 * Color codes for terminal output
 */
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

/**
 * Print colored message
 */
function print(message: string, color: keyof typeof colors = "reset"): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print test result
 */
function printResult(testName: string, passed: boolean, error?: string): void {
  const status = passed ? "✓" : "✗";
  const color = passed ? "green" : "red";
  print(`${status} ${testName}`, color);
  if (error) {
    print(`  Error: ${error}`, "red");
  }
}

/**
 * Initialize test dependencies
 */
function initializeDependencies(): {
  bootstrap: MCPServerBootstrap;
  logger: ILogger;
} {
  const logger: ILogger = new PinoLogger({ level: "info" });
  const cache = new LRUCache({ maxSize: 1000, defaultTTL: 300000 });
  const rateLimiter = new TokenBucketLimiter({
    defaultQPS: 50,
    defaultBurst: 5,
    productLimits: {
      ga4: { qps: 100, burst: 10 },
    },
  });
  const capabilitiesRegistry = new CapabilitiesRegistry();

  const oauthClient = new OAuthClient({
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    logger,
  });

  const tokenStorage = new TokenStorage({
    credentialsPath: process.env.MCP_CREDENTIALS_PATH || "~/.mcp/google/credentials.enc.json",
    encryptionKey: process.env.MCP_ENCRYPTION_KEY || "test-encryption-key",
    logger,
  });

  const ga4Client = new GA4Client({
    logger,
    rateLimiter,
    oauthClient,
  });

  const bootstrap = new MCPServerBootstrap({
    name: "mcp-google-marketing",
    version: "0.1.0",
    logger,
  });
  bootstrap.initialize();

  registerCoreUtilityTools({
    bootstrap,
    capabilitiesRegistry,
    oauthClient,
    tokenStorage,
    logger,
  });

  registerGA4Tools({
    bootstrap,
    ga4Client,
    cache,
    capabilitiesRegistry,
    logger,
  });

  return { bootstrap, logger };
}

/**
 * Test a tool by name
 */
async function testTool(
  bootstrap: MCPServerBootstrap,
  toolName: string,
  testName: string
): Promise<boolean> {
  print(`Test: ${testName}`, "blue");
  try {
    const registeredTools = bootstrap.getRegisteredTools();
    const tool = registeredTools.get(toolName);
    if (!tool) {
      throw new Error(`${toolName} tool not found`);
    }
    const result = await tool.handler({});
    if (result && typeof result === "object") {
      printResult(testName, true);
      return true;
    }
    throw new Error(`${toolName} returned invalid result`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    printResult(testName, false, errorMessage);
    return false;
  }
}

/**
 * Test tool existence
 */
function testToolExists(
  bootstrap: MCPServerBootstrap,
  toolName: string,
  testName: string
): boolean {
  print(`Test: ${testName}`, "blue");
  try {
    const registeredTools = bootstrap.getRegisteredTools();
    const tool = registeredTools.get(toolName);
    if (!tool) {
      throw new Error(`${toolName} tool not found`);
    }
    printResult(testName, true);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    printResult(testName, false, errorMessage);
    return false;
  }
}

/**
 * Run smoke tests
 */
async function runSmokeTests(): Promise<void> {
  print("Starting smoke tests...", "blue");
  print("");

  let passed = 0;
  let failed = 0;

  const { bootstrap } = initializeDependencies();

  // Test 1: auth.status
  const authStatusPassed = await testTool(bootstrap, "auth.status", "auth.status");
  if (authStatusPassed) {
    passed++;
  } else {
    failed++;
  }
  print("");

  // Test 2: capabilities.get
  const capabilitiesPassed = await testTool(bootstrap, "capabilities.get", "capabilities.get");
  if (capabilitiesPassed) {
    passed++;
  } else {
    failed++;
  }
  print("");

  // Test 3: GA4 read operation (ga4.report.run)
  const ga4ReportPassed = testToolExists(bootstrap, "ga4.report.run", "ga4.report.run (tool exists)");
  if (ga4ReportPassed) {
    passed++;
  } else {
    failed++;
  }
  print("");

  // Summary
  print("", "reset");
  print("Smoke test summary:", "blue");
  print(`  Passed: ${passed}`, "green");
  if (failed > 0) {
    print(`  Failed: ${failed}`, "red");
    process.exit(1);
  } else {
    print("  All tests passed!", "green");
    process.exit(0);
  }
}

// Run smoke tests
runSmokeTests().catch((error) => {
  print(`Fatal error: ${error instanceof Error ? error.message : String(error)}`, "red");
  process.exit(1);
});

