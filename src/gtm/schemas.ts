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

/**
 * Data Layer Monitor Request Schema
 */
export const datalayerMonitorRequestSchema = z.object({
  parent: workspacePathSchema,
  eventName: z.string().optional(), // Optional event name to monitor
});

/**
 * Data Layer Monitor Response Schema
 */
export const datalayerMonitorResponseSchema = z.object({
  monitoring: z.boolean(),
  eventName: z.string().optional(),
  alerts: z
    .array(
      z.object({
        type: z.enum(["schema_violation", "missing_field", "type_mismatch"]),
        message: z.string(),
        timestamp: z.string().optional(),
      })
    )
    .optional(),
});

/**
 * Data Layer Events List Request Schema
 */
export const datalayerEventsListRequestSchema = z.object({
  parent: workspacePathSchema,
});

/**
 * Data Layer Events List Response Schema
 */
export const datalayerEventsListResponseSchema = z.object({
  events: z.array(
    z.object({
      name: z.string(),
      triggerName: z.string().optional(),
      triggerId: z.string().optional(),
      conditions: z.array(z.unknown()).optional(),
    })
  ),
});

/**
 * Folder Path Schema (format: accounts/123456/containers/987654/workspaces/111111/folders/1)
 */
export const folderPathSchema = z
  .string()
  .regex(
    /^accounts\/\d+\/containers\/\d+\/workspaces\/\d+\/folders\/\d+$/,
    "Folder path must be in format accounts/123456/containers/987654/workspaces/111111/folders/1"
  );

/**
 * Folder List Request Schema
 */
export const folderListRequestSchema = z.object({
  parent: workspacePathSchema,
});

/**
 * Folder List Response Schema
 */
export const folderListResponseSchema = z.object({
  folders: z.array(
    z.object({
      accountId: z.string().optional(),
      containerId: z.string().optional(),
      workspaceId: z.string().optional(),
      folderId: z.string().optional(),
      name: z.string().optional(),
    })
  ),
});

/**
 * Folder Get Request Schema
 */
export const folderGetRequestSchema = z.object({
  path: folderPathSchema,
});

/**
 * Folder Get Response Schema
 */
export const folderGetResponseSchema = z.object({
  accountId: z.string().optional(),
  containerId: z.string().optional(),
  workspaceId: z.string().optional(),
  folderId: z.string().optional(),
  name: z.string().optional(),
});

/**
 * Folder Upsert Request Schema
 */
export const folderUpsertRequestSchema = z.object({
  parent: workspacePathSchema,
  folderId: z.string().optional(), // If provided, update existing folder
  name: z.string().min(1, "Folder name is required"),
});

/**
 * Folder Upsert Response Schema
 */
export const folderUpsertResponseSchema = folderGetResponseSchema;

/**
 * Folder Delete Request Schema
 */
export const folderDeleteRequestSchema = z.object({
  path: folderPathSchema,
});

/**
 * Folder Delete Response Schema
 */
export const folderDeleteResponseSchema = z.object({
  success: z.boolean(),
  path: z.string(),
});

/**
 * Container Path Schema (for versions, format: accounts/123456/containers/987654)
 */
export const containerPathForVersionSchema = z
  .string()
  .regex(
    /^accounts\/\d+\/containers\/\d+$/,
    "Container path must be in format accounts/123456/containers/987654"
  );

/**
 * Version Path Schema (format: accounts/123456/containers/987654/versions/1)
 */
export const versionPathSchema = z
  .string()
  .regex(
    /^accounts\/\d+\/containers\/\d+\/versions\/\d+$/,
    "Version path must be in format accounts/123456/containers/987654/versions/1"
  );

/**
 * Version List Request Schema
 */
export const versionListRequestSchema = z.object({
  parent: containerPathForVersionSchema,
});

/**
 * Version List Response Schema
 */
export const versionListResponseSchema = z.object({
  versions: z.array(
    z.object({
      accountId: z.string().optional(),
      containerId: z.string().optional(),
      containerVersionId: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
    })
  ),
});

/**
 * Version Get Request Schema
 */
export const versionGetRequestSchema = z.object({
  path: versionPathSchema,
});

/**
 * Version Get Response Schema
 */
export const versionGetResponseSchema = z.object({
  accountId: z.string().optional(),
  containerId: z.string().optional(),
  containerVersionId: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Version Create Request Schema
 */
export const versionCreateRequestSchema = z.object({
  parent: containerPathForVersionSchema,
  workspaceId: z.string().min(1, "Workspace ID is required"),
  name: z.string().min(1, "Version name is required"),
  notes: z.string().optional(),
});

/**
 * Version Create Response Schema
 */
export const versionCreateResponseSchema = versionGetResponseSchema;

/**
 * Version Restore Request Schema
 */
export const versionRestoreRequestSchema = z.object({
  path: versionPathSchema,
});

/**
 * Version Restore Response Schema
 */
export const versionRestoreResponseSchema = versionGetResponseSchema;

/**
 * Workspace Publish Request Schema
 */
export const workspacePublishRequestSchema = z.object({
  path: workspacePathSchema,
  fingerprint: z.string().optional(), // Optional fingerprint for optimistic locking
});

/**
 * Workspace Publish Response Schema
 */
export const workspacePublishResponseSchema = z.object({
  accountId: z.string().optional(),
  containerId: z.string().optional(),
  containerVersionId: z.string().optional(),
});

/**
 * Preview Create Request Schema
 */
export const previewCreateRequestSchema = z.object({
  parent: containerPathForVersionSchema,
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

/**
 * Preview Create Response Schema
 */
export const previewCreateResponseSchema = z.object({
  environmentId: z.string().optional(),
  authorizationCode: z.string().optional(),
  containerVersionId: z.string().optional(),
});

/**
 * Environment Path Schema (format: accounts/123456/containers/987654/environments/env1)
 */
export const environmentPathSchema = z
  .string()
  .regex(
    /^accounts\/\d+\/containers\/\d+\/environments\/[^/]+$/,
    "Environment path must be in format accounts/123456/containers/987654/environments/env1"
  );

/**
 * Preview Get Request Schema
 */
export const previewGetRequestSchema = z.object({
  path: environmentPathSchema,
});

/**
 * Preview Get Response Schema
 */
export const previewGetResponseSchema = z.object({
  environmentId: z.string().optional(),
  name: z.string().optional(),
  authorizationCode: z.string().optional(),
  containerVersionId: z.string().optional(),
});

/**
 * Consent Mode Settings Schema
 */
export const consentModeSettingsSchema = z.object({
  ad_storage: z.enum(["granted", "denied", "pending"]).optional(),
  analytics_storage: z.enum(["granted", "denied", "pending"]).optional(),
  functionality_storage: z.enum(["granted", "denied", "pending"]).optional(),
  personalization_storage: z.enum(["granted", "denied", "pending"]).optional(),
  security_storage: z.enum(["granted", "denied", "pending"]).optional(),
});

/**
 * Consent Configure Request Schema
 */
export const consentConfigureRequestSchema = z.object({
  path: containerPathSchema,
  enabled: z.boolean(),
  settings: consentModeSettingsSchema.optional(),
});

/**
 * Consent Configure Response Schema
 */
export const consentConfigureResponseSchema = z.object({
  enabled: z.boolean(),
  settings: consentModeSettingsSchema.optional(),
});

/**
 * Consent Get Request Schema
 */
export const consentGetRequestSchema = z.object({
  path: containerPathSchema,
});

/**
 * Consent Get Response Schema
 */
export const consentGetResponseSchema = z.object({
  enabled: z.boolean(),
  settings: consentModeSettingsSchema.optional(),
});

