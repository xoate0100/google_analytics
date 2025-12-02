// Minimal test to verify testing setup
import { describe, it, expect } from "vitest";

describe("Example Test", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });

  it("should verify test helpers work", () => {
    const value = 1 + 1;
    expect(value).toBe(2);
  });
});

