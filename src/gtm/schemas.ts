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

/**
 * Tag path schema (format: accounts/123456/containers/987654/workspaces/111111/tags/222222)
 */
export const tagPathSchema = z
  .string()
  .regex(
    /^accounts\/\d+\/containers\/\d+\/workspaces\/\d+\/tags\/\d+$/,
    "Tag path must be in format accounts/123456/containers/987654/workspaces/111111/tags/222222"
  );

/**
 * Tag List Request Schema
 */
export const tagListRequestSchema = z.object({
  parent: workspacePathSchema,
});

/**
 * Tag List Response Schema
 */
export const tagListResponseSchema = z.object({
  tags: z.array(
    z.object({
      accountId: z.string().optional(),
      containerId: z.string().optional(),
      workspaceId: z.string().optional(),
      tagId: z.string().optional(),
      name: z.string().optional(),
      type: z.string().optional(),
      fingerprint: z.string().optional(),
    })
  ),
});

/**
 * Tag Get Request Schema
 */
export const tagGetRequestSchema = z.object({
  path: tagPathSchema,
});

/**
 * Tag Get Response Schema
 */
export const tagGetResponseSchema = z.object({
  accountId: z.string().optional(),
  containerId: z.string().optional(),
  workspaceId: z.string().optional(),
  tagId: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  fingerprint: z.string().optional(),
  parameter: z.array(z.unknown()).optional(),
  firingTriggerId: z.array(z.string()).optional(),
  blockingTriggerId: z.array(z.string()).optional(),
  tagFiringOption: z.string().optional(),
});

/**
 * Tag Upsert Request Schema
 */
export const tagUpsertRequestSchema = z.object({
  parent: workspacePathSchema,
  name: z.string().min(1, "Tag name is required"),
  type: z.string().min(1, "Tag type is required"),
  parameter: z.array(z.unknown()).optional(),
  firingTriggerId: z.array(z.string()).optional(),
  blockingTriggerId: z.array(z.string()).optional(),
  tagFiringOption: z.string().optional(),
  tagId: z.string().optional(), // For updates
});

/**
 * Tag Upsert Response Schema
 */
export const tagUpsertResponseSchema = tagGetResponseSchema;

/**
 * Tag Delete Request Schema
 */
export const tagDeleteRequestSchema = z.object({
  path: tagPathSchema,
});

/**
 * Tag Delete Response Schema
 */
export const tagDeleteResponseSchema = z.object({
  success: z.boolean(),
  path: z.string(),
});

/**
 * Trigger path schema (format: accounts/123456/containers/987654/workspaces/111111/triggers/333333)
 */
export const triggerPathSchema = z
  .string()
  .regex(
    /^accounts\/\d+\/containers\/\d+\/workspaces\/\d+\/triggers\/\d+$/,
    "Trigger path must be in format accounts/123456/containers/987654/workspaces/111111/triggers/333333"
  );

/**
 * Trigger List Request Schema
 */
export const triggerListRequestSchema = z.object({
  parent: workspacePathSchema,
});

/**
 * Trigger List Response Schema
 */
export const triggerListResponseSchema = z.object({
  triggers: z.array(
    z.object({
      accountId: z.string().optional(),
      containerId: z.string().optional(),
      workspaceId: z.string().optional(),
      triggerId: z.string().optional(),
      name: z.string().optional(),
      type: z.string().optional(),
      fingerprint: z.string().optional(),
    })
  ),
});

/**
 * Trigger Get Request Schema
 */
export const triggerGetRequestSchema = z.object({
  path: triggerPathSchema,
});

/**
 * Trigger Get Response Schema
 */
export const triggerGetResponseSchema = z.object({
  accountId: z.string().optional(),
  containerId: z.string().optional(),
  workspaceId: z.string().optional(),
  triggerId: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  fingerprint: z.string().optional(),
  parameter: z.array(z.unknown()).optional(),
  customEventFilter: z.array(z.unknown()).optional(),
  autoEventFilter: z.array(z.unknown()).optional(),
});

/**
 * Trigger Upsert Request Schema
 */
export const triggerUpsertRequestSchema = z.object({
  parent: workspacePathSchema,
  name: z.string().min(1, "Trigger name is required"),
  type: z.string().min(1, "Trigger type is required"),
  parameter: z.array(z.unknown()).optional(),
  customEventFilter: z.array(z.unknown()).optional(),
  autoEventFilter: z.array(z.unknown()).optional(),
  triggerId: z.string().optional(), // For updates
});

/**
 * Trigger Upsert Response Schema
 */
export const triggerUpsertResponseSchema = triggerGetResponseSchema;

/**
 * Trigger Delete Request Schema
 */
export const triggerDeleteRequestSchema = z.object({
  path: triggerPathSchema,
});

/**
 * Trigger Delete Response Schema
 */
export const triggerDeleteResponseSchema = z.object({
  success: z.boolean(),
  path: z.string(),
});

/**
 * Variable path schema (format: accounts/123456/containers/987654/workspaces/111111/variables/444444)
 */
export const variablePathSchema = z
  .string()
  .regex(
    /^accounts\/\d+\/containers\/\d+\/workspaces\/\d+\/variables\/\d+$/,
    "Variable path must be in format accounts/123456/containers/987654/workspaces/111111/variables/444444"
  );

/**
 * Variable List Request Schema
 */
export const variableListRequestSchema = z.object({
  parent: workspacePathSchema,
});

/**
 * Variable List Response Schema
 */
export const variableListResponseSchema = z.object({
  variables: z.array(
    z.object({
      accountId: z.string().optional(),
      containerId: z.string().optional(),
      workspaceId: z.string().optional(),
      variableId: z.string().optional(),
      name: z.string().optional(),
      type: z.string().optional(),
      fingerprint: z.string().optional(),
    })
  ),
});

/**
 * Variable Get Request Schema
 */
export const variableGetRequestSchema = z.object({
  path: variablePathSchema,
});

/**
 * Variable Get Response Schema
 */
export const variableGetResponseSchema = z.object({
  accountId: z.string().optional(),
  containerId: z.string().optional(),
  workspaceId: z.string().optional(),
  variableId: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  fingerprint: z.string().optional(),
  parameter: z.array(z.unknown()).optional(),
  formatValue: z.unknown().optional(),
});

/**
 * Variable Upsert Request Schema
 */
export const variableUpsertRequestSchema = z.object({
  parent: workspacePathSchema,
  name: z.string().min(1, "Variable name is required"),
  type: z.string().min(1, "Variable type is required"),
  parameter: z.array(z.unknown()).optional(),
  formatValue: z.unknown().optional(),
  variableId: z.string().optional(), // For updates
});

/**
 * Variable Upsert Response Schema
 */
export const variableUpsertResponseSchema = variableGetResponseSchema;

/**
 * Variable Delete Request Schema
 */
export const variableDeleteRequestSchema = z.object({
  path: variablePathSchema,
});

/**
 * Variable Delete Response Schema
 */
export const variableDeleteResponseSchema = z.object({
  success: z.boolean(),
  path: z.string(),
});

/**
 * Built-in Variable List Request Schema
 */
export const builtinVariableListRequestSchema = z.object({
  parent: workspacePathSchema,
});

/**
 * Built-in Variable List Response Schema
 */
export const builtinVariableListResponseSchema = z.object({
  builtInVariables: z.array(
    z.object({
      accountId: z.string().optional(),
      containerId: z.string().optional(),
      workspaceId: z.string().optional(),
      type: z.string().optional(),
      name: z.string().optional(),
    })
  ),
});

/**
 * Built-in Variable Enable Request Schema
 */
export const builtinVariableEnableRequestSchema = z.object({
  path: workspacePathSchema,
  type: z.string().min(1, "Built-in variable type is required"),
});

/**
 * Built-in Variable Enable Response Schema
 */
export const builtinVariableEnableResponseSchema = z.object({
  success: z.boolean(),
  type: z.string(),
});

/**
 * Data Layer Validation Request Schema
 */
export const datalayerValidateRequestSchema = z.object({
  parent: workspacePathSchema,
  dataLayer: z.record(z.unknown()), // Data layer object to validate
  schema: z.record(z.unknown()).optional(), // Optional explicit schema
});

/**
 * Data Layer Validation Response Schema
 */
export const datalayerValidateResponseSchema = z.object({
  valid: z.boolean(),
  errors: z
    .array(
      z.object({
        path: z.string(),
        message: z.string(),
        code: z.string().optional(),
      })
    )
    .optional(),
  warnings: z
    .array(
      z.object({
        path: z.string(),
        message: z.string(),
      })
    )
    .optional(),
});

/**
 * Data Layer Schema Generation Request Schema
 */
export const datalayerSchemaGenerateRequestSchema = z.object({
  parent: workspacePathSchema,
  includeBuiltIn: z.boolean().optional().default(false),
});

/**
 * Data Layer Schema Generation Response Schema
 */
export const datalayerSchemaGenerateResponseSchema = z.object({
  schema: z.record(z.unknown()), // Generated Zod schema structure
  variables: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean(),
      description: z.string().optional(),
    })
  ),
});

