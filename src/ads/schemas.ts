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

/**
 * Campaign List Request Schema
 */
export const campaignListRequestSchema = z.object({
  customerId: customerIdSchema,
  filter: z.string().optional(),
});

/**
 * Campaign List Response Schema
 */
export const campaignListResponseSchema = z.object({
  campaigns: z.array(
    z.object({
      campaignId: z.string().optional(),
      name: z.string().optional(),
      status: z.enum(["ENABLED", "PAUSED", "REMOVED"]).optional(),
      advertisingChannelType: z.string().optional(),
    })
  ),
});

/**
 * Campaign Get Request Schema
 */
export const campaignGetRequestSchema = z.object({
  customerId: customerIdSchema,
  campaignId: z.string().min(1, "Campaign ID is required"),
});

/**
 * Campaign Get Response Schema
 */
export const campaignGetResponseSchema = z.object({
  campaignId: z.string().optional(),
  name: z.string().optional(),
  status: z.enum(["ENABLED", "PAUSED", "REMOVED"]).optional(),
  advertisingChannelType: z.string().optional(),
  budget: z.string().optional(),
  biddingStrategy: z.string().optional(),
});

/**
 * Campaign Upsert Request Schema
 */
export const campaignUpsertRequestSchema = z.object({
  customerId: customerIdSchema,
  campaignId: z.string().optional(), // Required for update, optional for create
  name: z.string().min(1, "Campaign name is required"),
  status: z.enum(["ENABLED", "PAUSED", "REMOVED"]).optional(),
  advertisingChannelType: z.enum(["SEARCH", "DISPLAY", "VIDEO", "SHOPPING", "HOTEL", "MULTI_CHANNEL", "PERFORMANCE_MAX"]).optional(),
  budget: z.string().optional(), // Budget resource name
  biddingStrategy: z.string().optional(), // Bidding strategy resource name
  adSchedule: z.array(z.unknown()).optional(), // Ad schedule configuration
  targeting: z.record(z.unknown()).optional(), // Targeting configuration
});

/**
 * Campaign Upsert Response Schema
 */
export const campaignUpsertResponseSchema = campaignGetResponseSchema;

/**
 * Campaign Pause Request Schema
 */
export const campaignPauseRequestSchema = z.object({
  customerId: customerIdSchema,
  campaignId: z.string().min(1, "Campaign ID is required"),
});

/**
 * Campaign Pause Response Schema
 */
export const campaignPauseResponseSchema = z.object({
  campaignId: z.string().optional(),
  status: z.enum(["PAUSED"]).optional(),
});

