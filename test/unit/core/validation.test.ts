import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  validateSchema,
  safeParseSchema,
  createValidationError,
  commonSchemas,
} from "../../../src/core/validation.js";
import { ValidationError } from "../../../src/core/errors.js";

describe("Validation utilities", () => {
  describe("validateSchema", () => {
    it("should validate data against Zod schema", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: "John", age: 30 };
      const result = validateSchema(schema, data);
      expect(result).toEqual(data);
    });

    it("should throw ValidationError on schema mismatch", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: "John", age: "30" }; // age should be number

      expect(() => validateSchema(schema, data)).toThrow(ValidationError);
    });

    it("should include validation details in error", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: "John", age: "30" };

      try {
        validateSchema(schema, data);
        expect.fail("Should have thrown ValidationError");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.validationDetails).toBeDefined();
        }
      }
    });
  });

  describe("safeParseSchema", () => {
    it("should return success result for valid data", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: "John", age: 30 };
      const result = safeParseSchema(schema, data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it("should return error result for invalid data", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: "John", age: "30" };
      const result = safeParseSchema(schema, data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.validationDetails).toBeDefined();
      }
    });
  });

  describe("createValidationError", () => {
    it("should create ValidationError with schema mismatch reason", () => {
      const zodError = z.object({ name: z.string() }).safeParse({ age: 30 });
      if (!zodError.success) {
        const error = createValidationError(zodError.error);
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.reason).toBe("schema_mismatch");
        expect(error.validationDetails).toBeDefined();
      }
    });
  });

  describe("commonSchemas", () => {
    describe("idempotencyKey", () => {
      it("should validate idempotency key format", () => {
        const schema = commonSchemas.idempotencyKey;
        expect(schema.parse("abc123")).toBe("abc123");
        expect(() => schema.parse("")).toThrow();
        expect(() => schema.parse(123)).toThrow();
      });
    });

    describe("propertyId", () => {
      it("should validate GA4 property ID format", () => {
        const schema = commonSchemas.propertyId;
        expect(schema.parse("123456789")).toBe("123456789");
        expect(() => schema.parse("")).toThrow();
        expect(() => schema.parse("abc")).toThrow();
      });
    });

    describe("accountId", () => {
      it("should validate account ID format", () => {
        const schema = commonSchemas.accountId;
        expect(schema.parse("123456789")).toBe("123456789");
        expect(() => schema.parse("")).toThrow();
      });
    });

    describe("containerId", () => {
      it("should validate GTM container ID format", () => {
        const schema = commonSchemas.containerId;
        expect(schema.parse("GTM-XXXXX")).toBe("GTM-XXXXX");
        expect(() => schema.parse("")).toThrow();
        expect(() => schema.parse("invalid")).toThrow();
      });
    });

    describe("dateRange", () => {
      it("should validate date range format", () => {
        const schema = commonSchemas.dateRange;
        const validRange = {
          startDate: "2024-01-01",
          endDate: "2024-01-31",
        };
        expect(schema.parse(validRange)).toEqual(validRange);

        // Same date should be valid (single day range)
        const sameDateRange = {
          startDate: "2024-01-01",
          endDate: "2024-01-01",
        };
        expect(schema.parse(sameDateRange)).toEqual(sameDateRange);

        // endDate < startDate should fail
        expect(() =>
          schema.parse({ startDate: "2024-01-31", endDate: "2024-01-01" })
        ).toThrow(); // endDate must be >= startDate
      });
    });

    describe("dimensions", () => {
      it("should validate dimensions array", () => {
        const schema = commonSchemas.dimensions;
        expect(schema.parse(["country", "city"])).toEqual(["country", "city"]);
        expect(() => schema.parse([])).toThrow(); // Must have at least one
        expect(() => schema.parse(["country", ""])).toThrow(); // No empty strings
      });
    });

    describe("metrics", () => {
      it("should validate metrics array", () => {
        const schema = commonSchemas.metrics;
        expect(schema.parse(["sessions", "users"])).toEqual([
          "sessions",
          "users",
        ]);
        expect(() => schema.parse([])).toThrow(); // Must have at least one
        expect(() => schema.parse(["sessions", ""])).toThrow(); // No empty strings
      });
    });
  });
});
