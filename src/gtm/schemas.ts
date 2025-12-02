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

/**
 * Workspace path schema (format: accounts/123456/containers/987654/workspaces/111111)
 */
export const workspacePathSchema = z
  .string()
  .regex(
    /^accounts\/\d+\/containers\/\d+\/workspaces\/\d+$/,
    "Workspace path must be in format accounts/123456/containers/987654/workspaces/111111"
  );

/**
 * Workspace List Request Schema
 */
export const workspaceListRequestSchema = z.object({
  parent: containerPathSchema,
});

/**
 * Workspace List Response Schema
 */
export const workspaceListResponseSchema = z.object({
  workspaces: z.array(
    z.object({
      accountId: z.string().optional(),
      containerId: z.string().optional(),
      workspaceId: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
      fingerprint: z.string().optional(),
    })
  ),
});

/**
 * Workspace Get Request Schema
 */
export const workspaceGetRequestSchema = z.object({
  path: workspacePathSchema,
});

/**
 * Workspace Get Response Schema
 */
export const workspaceGetResponseSchema = z.object({
  accountId: z.string().optional(),
  containerId: z.string().optional(),
  workspaceId: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  fingerprint: z.string().optional(),
});

/**
 * Workspace Create Request Schema
 */
export const workspaceCreateRequestSchema = z.object({
  parent: containerPathSchema,
  name: z.string().min(1, "Workspace name is required"),
  description: z.string().optional(),
});

/**
 * Workspace Create Response Schema
 */
export const workspaceCreateResponseSchema = workspaceGetResponseSchema;

/**
 * Workspace Merge Request Schema
 */
export const workspaceMergeRequestSchema = z.object({
  path: workspacePathSchema,
  sourceWorkspacePath: workspacePathSchema,
});

/**
 * Workspace Merge Response Schema
 */
export const workspaceMergeResponseSchema = z.object({
  success: z.boolean(),
  path: z.string(),
  mergedWorkspace: workspaceGetResponseSchema.optional(),
});

