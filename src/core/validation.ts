/**
 * Validation utilities and schema helpers
 * Provides Zod-based validation with typed error handling
 */

import { z, ZodError, ZodSchema } from "zod";
import { ValidationError, createValidationError as createValidationErrorFromReason } from "./errors.js";

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError };

/**
 * Create ValidationError from ZodError
 * @param zodError - Zod validation error
 * @returns ValidationError instance
 */
export function createValidationError(zodError: ZodError): ValidationError {
  const issues = zodError.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));

  return createValidationErrorFromReason(
    "schema_mismatch",
    `Validation failed: ${issues[0]?.message || "Unknown error"}`,
    { issues },
    { zodError: zodError.format() }
  );
}

/**
 * Validate data against a Zod schema
 * Throws ValidationError on failure
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data
 * @throws ValidationError if validation fails
 */
export function validateSchema<T>(
  schema: ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw createValidationError(result.error);
  }
  return result.data;
}

/**
 * Safely parse data against a Zod schema
 * Returns result object instead of throwing
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with success flag
 */
export function safeParseSchema<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: createValidationError(result.error),
    };
  }
  return {
    success: true,
    data: result.data,
  };
}

/**
 * Common Zod schemas for validation
 */
export const commonSchemas = {
  /**
   * Idempotency key schema
   * Non-empty string
   */
  idempotencyKey: z.string().min(1),

  /**
   * GA4 property ID schema
   * Numeric string
   */
  propertyId: z.string().regex(/^\d+$/, "Property ID must be numeric"),

  /**
   * Account ID schema
   * Non-empty string
   */
  accountId: z.string().min(1),

  /**
   * GTM container ID schema
   * Format: GTM-XXXXX
   */
  containerId: z
    .string()
    .regex(/^GTM-[A-Z0-9]+$/, "Container ID must be in format GTM-XXXXX"),

  /**
   * Date range schema
   * ISO date strings with endDate >= startDate
   */
  dateRange: z
    .object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    })
    .refine(
      (data) => data.endDate >= data.startDate,
      "endDate must be >= startDate"
    ),

  /**
   * Dimensions array schema
   * Non-empty array of non-empty strings
   */
  dimensions: z
    .array(z.string().min(1))
    .min(1, "At least one dimension is required"),

  /**
   * Metrics array schema
   * Non-empty array of non-empty strings
   */
  metrics: z
    .array(z.string().min(1))
    .min(1, "At least one metric is required"),
};
