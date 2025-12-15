// Fixture loading utilities

import { readFileSync } from "fs";
import { join } from "path";

/**
 * Load a fixture file
 */
export function loadFixture(filename: string): string {
  const fixturePath = join(__dirname, "../fixtures", filename);
  return readFileSync(fixturePath, "utf-8");
}

/**
 * Load and parse a JSON fixture
 */
export function loadJsonFixture<T>(filename: string): T {
  const content = loadFixture(filename);
  return JSON.parse(content) as T;
}
