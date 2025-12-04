/**
 * Unit tests for dry-run mode consistency
 * Tests dry-run mode check helper, dry-run mode in write operations, and dry-run mode logging
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isDryRunEnabled,
  checkDryRun,
  setDryRunMode,
  getDryRunMode,
} from "../../../src/core/dry-run.js";
import type { ILogger } from "../../../src/core/types.js";

describe("Dry-Run Mode Consistency", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.MCP_MARKETING_DRY_RUN;
    delete process.env.MCP_MARKETING_DRY_RUN;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.MCP_MARKETING_DRY_RUN = originalEnv;
    } else {
      delete process.env.MCP_MARKETING_DRY_RUN;
    }
  });

  describe("Dry-run mode check helper", () => {
    it("should return false when dry-run mode is not set", () => {
      expect(isDryRunEnabled()).toBe(false);
    });

    it("should return true when dry-run mode is enabled", () => {
      process.env.MCP_MARKETING_DRY_RUN = "1";
      expect(isDryRunEnabled()).toBe(true);
    });

    it("should return false when dry-run mode is disabled", () => {
      process.env.MCP_MARKETING_DRY_RUN = "0";
      expect(isDryRunEnabled()).toBe(false);
    });

    it("should use setDryRunMode to enable", () => {
      setDryRunMode(true);
      expect(isDryRunEnabled()).toBe(true);
    });

    it("should use setDryRunMode to disable", () => {
      setDryRunMode(true);
      setDryRunMode(false);
      expect(isDryRunEnabled()).toBe(false);
    });

    it("should get current dry-run mode", () => {
      expect(getDryRunMode()).toBe(false);
      setDryRunMode(true);
      expect(getDryRunMode()).toBe(true);
    });
  });

  describe("Dry-run mode in write operations", () => {
    it("should check dry-run mode before write operation", () => {
      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        child: vi.fn().mockReturnThis(),
      } as unknown as ILogger;

      setDryRunMode(true);
      const result = checkDryRun("test.operation", mockLogger);
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Dry-run mode enabled for operation",
        expect.any(Object)
      );
    });

    it("should not log when dry-run mode is disabled", () => {
      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        child: vi.fn().mockReturnThis(),
      } as unknown as ILogger;

      setDryRunMode(false);
      const result = checkDryRun("test.operation", mockLogger);
      expect(result).toBe(false);
      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });

  describe("Dry-run mode logging", () => {
    it("should log dry-run mode activation", () => {
      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        child: vi.fn().mockReturnThis(),
      } as unknown as ILogger;

      setDryRunMode(true);
      checkDryRun("test.operation", mockLogger);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Dry-run mode enabled for operation",
        expect.objectContaining({
          operation: "test.operation",
          dryRunEnabled: true,
        })
      );
    });

    it("should include operation name in dry-run log", () => {
      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        child: vi.fn().mockReturnThis(),
      } as unknown as ILogger;

      setDryRunMode(true);
      checkDryRun("ga4.property.upsert", mockLogger);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          operation: "ga4.property.upsert",
        })
      );
    });
  });
});

