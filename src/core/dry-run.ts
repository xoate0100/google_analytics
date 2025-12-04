/**
 * Dry-run mode utility functions
 * Provides consistent dry-run mode checking and logging across all write operations
 */

import type { ILogger } from "./types.js";

/**
 * Check if dry-run mode is enabled
 * @returns true if dry-run mode is enabled, false otherwise
 */
export function isDryRunEnabled(): boolean {
  return process.env.MCP_MARKETING_DRY_RUN === "1";
}

/**
 * Get current dry-run mode
 * @returns true if dry-run mode is enabled, false otherwise
 */
export function getDryRunMode(): boolean {
  return isDryRunEnabled();
}

/**
 * Set dry-run mode
 * @param enabled - true to enable, false to disable
 */
export function setDryRunMode(enabled: boolean): void {
  process.env.MCP_MARKETING_DRY_RUN = enabled ? "1" : "0";
}

/**
 * Check dry-run mode and log if enabled
 * @param operationName - Name of the operation being checked
 * @param logger - Logger instance for logging dry-run mode
 * @returns true if dry-run mode is enabled, false otherwise
 */
export function checkDryRun(
  operationName: string,
  logger: ILogger
): boolean {
  const enabled = isDryRunEnabled();
  if (enabled) {
    logger.info("Dry-run mode enabled for operation", {
      operation: operationName,
      dryRunEnabled: true,
      message: `Operation ${operationName} would be executed in dry-run mode`,
    });
  }
  return enabled;
}

