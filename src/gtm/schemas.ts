/**
 * GTM API request and response schemas
 * Uses Zod for runtime validation
 */

import { z } from "zod";

/**
 * Account ID schema (format: accounts/123456)
 */
export const accountIdSchema = z
  .string()
  .regex(/^accounts\/\d+$/, "Account ID must be in format accounts/123456");

/**
 * Container path schema (format: accounts/123456/containers/987654)
 */
export const containerPathSchema = z
  .string()
  .regex(
    /^accounts\/\d+\/containers\/\d+$/,
    "Container path must be in format accounts/123456/containers/987654"
  );

/**
 * Container List Request Schema
 */
export const containerListRequestSchema = z.object({
  parent: accountIdSchema,
});

/**
 * Container List Response Schema
 */
export const containerListResponseSchema = z.object({
  containers: z.array(
    z.object({
      accountId: z.string().optional(),
      containerId: z.string().optional(),
      name: z.string().optional(),
      publicId: z.string().optional(),
      domainName: z.array(z.string()).optional(),
      fingerprint: z.string().optional(),
      timeZoneCountryId: z.string().optional(),
      timeZoneId: z.string().optional(),
      usageContext: z.array(z.string()).optional(),
    })
  ),
});

/**
 * Container Get Request Schema
 */
export const containerGetRequestSchema = z.object({
  path: containerPathSchema,
});

/**
 * Container Get Response Schema
 */
export const containerGetResponseSchema = z.object({
  accountId: z.string().optional(),
  containerId: z.string().optional(),
  name: z.string().optional(),
  publicId: z.string().optional(),
  domainName: z.array(z.string()).optional(),
  fingerprint: z.string().optional(),
  timeZoneCountryId: z.string().optional(),
  timeZoneId: z.string().optional(),
  usageContext: z.array(z.string()).optional(),
});

/**
 * Container Upsert Request Schema
 */
export const containerUpsertRequestSchema = z.object({
  parent: accountIdSchema,
  name: z.string().min(1, "Container name is required"),
  domainName: z.array(z.string()).optional(),
  timeZoneCountryId: z.string().optional(),
  timeZoneId: z.string().optional(),
  usageContext: z.array(z.string()).optional(),
  containerId: z.string().optional(), // For updates
});

/**
 * Container Upsert Response Schema
 */
export const containerUpsertResponseSchema = containerGetResponseSchema;

/**
 * Container Delete Request Schema
 */
export const containerDeleteRequestSchema = z.object({
  path: containerPathSchema,
});

/**
 * Container Delete Response Schema
 */
export const containerDeleteResponseSchema = z.object({
  success: z.boolean(),
  path: z.string(),
});

