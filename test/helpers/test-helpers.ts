// Common test utilities and helpers

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import { vi } from "vitest";

/**
 * Create a mock function with type safety
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockFunction<T extends (...args: any[]) => any>(
  implementation?: T
): ReturnType<typeof vi.fn> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return vi.fn(implementation as any);
}

/**
 * Assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || "Value is null or undefined");
  }
}
