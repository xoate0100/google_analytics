/**
 * Google Ads API Zod schemas
 * Validates request and response structures for Google Ads API GAQL queries
 */

import { z } from "zod";

/**
 * Customer ID schema (format: 1234567890 or customers/1234567890)
 */
export const customerIdSchema = z
  .string()
  .regex(/^(\d+|customers\/\d+)$/, "Customer ID must be numeric or in format customers/1234567890");

/**
 * GAQL Query Request Schema
 */
export const gaqlQueryRequestSchema = z.object({
  customerId: customerIdSchema,
  query: z.string().min(1, "GAQL query is required"),
  limit: z.number().int().positive().optional(),
  validateOnly: z.boolean().optional(),
});

/**
 * GAQL Query Response Schema
 */
export const gaqlQueryResponseSchema = z.object({
  results: z.array(z.record(z.unknown())),
  fieldMask: z.string().optional(),
  requestId: z.string().optional(),
});

/**
 * GAQL Batch Request Schema
 */
export const gaqlBatchRequestSchema = z.object({
  customerId: customerIdSchema,
  queries: z.array(z.string().min(1, "GAQL query is required")).min(1, "At least one query is required"),
});

/**
 * GAQL Batch Response Schema
 */
export const gaqlBatchResponseSchema = z.object({
  results: z.array(
    z.object({
      query: z.string(),
      result: gaqlQueryResponseSchema,
      error: z.string().optional(),
    })
  ),
});

/**
 * GAQL Stream Request Schema
 */
export const gaqlStreamRequestSchema = z.object({
  customerId: customerIdSchema,
  query: z.string().min(1, "GAQL query is required"),
});

/**
 * GAQL Stream Response Schema
 */
export const gaqlStreamResponseSchema = z.object({
  results: z.array(z.record(z.unknown())),
  totalResults: z.number().optional(),
});

