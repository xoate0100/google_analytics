/**
 * Fixture loader for integration tests
 * Loads saved API responses for replay in tests
 */

import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Load a fixture file
 */
export async function loadFixture(name: string): Promise<unknown> {
  const fixturePath = join(process.cwd(), "test", "fixtures", `${name}.json`);
  const content = await readFile(fixturePath, "utf-8");
  return JSON.parse(content);
}

/**
 * Load a fixture file synchronously (for use in test setup)
 */
export function loadFixtureSync(_name: string): unknown {
  // Note: In a real implementation, this would use fs.readFileSync
  // For now, we'll use async version
  throw new Error("loadFixtureSync not implemented - use loadFixture instead");
}
