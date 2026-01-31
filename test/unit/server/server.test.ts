/**
 * Server Entry Point Tests
 * Tests for server initialization and startup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initializeServer } from "../../../src/server.js";
import { MCPServerBootstrap } from "../../../src/server/bootstrap.js";

describe("Server Entry Point", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      GOOGLE_CLIENT_ID: "test-client-id",
      GOOGLE_CLIENT_SECRET: "test-client-secret",
      MCP_ENCRYPTION_KEY: "test-encryption-key",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should initialize server with all components", () => {
    const { bootstrap, logger } = initializeServer();

    expect(bootstrap).toBeDefined();
    expect(logger).toBeDefined();
    expect(bootstrap).toBeInstanceOf(MCPServerBootstrap);
  });

  it("should register tools during initialization", () => {
    const { bootstrap } = initializeServer();
    const tools = bootstrap.getRegisteredTools();

    expect(tools.size).toBeGreaterThan(0);
    expect(tools.has("core.healthcheck")).toBe(true);
    expect(tools.has("core.version")).toBe(true);
  });

  it("should throw error if GOOGLE_CLIENT_ID is missing", () => {
    delete process.env.GOOGLE_CLIENT_ID;

    expect(() => initializeServer()).toThrow(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required"
    );
  });

  it("should throw error if GOOGLE_CLIENT_SECRET is missing", () => {
    delete process.env.GOOGLE_CLIENT_SECRET;

    expect(() => initializeServer()).toThrow(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required"
    );
  });

  it("should use MCP_ENCRYPTION_KEY if provided", () => {
    process.env.MCP_ENCRYPTION_KEY = "custom-encryption-key";

    const { bootstrap } = initializeServer();
    expect(bootstrap).toBeDefined();
  });

  it("should handle missing GOOGLE_ADS_DEV_TOKEN gracefully", () => {
    delete process.env.GOOGLE_ADS_DEV_TOKEN;

    const { bootstrap } = initializeServer();
    const tools = bootstrap.getRegisteredTools();

    expect(tools.size).toBeGreaterThan(0);
  });

  it("should register Ads tools when GOOGLE_ADS_DEV_TOKEN is provided", () => {
    process.env.GOOGLE_ADS_DEV_TOKEN = "test-dev-token";

    const { bootstrap } = initializeServer();
    const tools = bootstrap.getRegisteredTools();

    const hasAdsTool = Array.from(tools.keys()).some((name) =>
      name.startsWith("ads.")
    );
    expect(hasAdsTool).toBe(true);
  });
});
