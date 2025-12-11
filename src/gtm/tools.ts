/**
 * GTM tools registration
 * Registers GTM Tag Manager API v2 tools with the MCP server
 */

import { z } from "zod";
import type { MCPServerBootstrap } from "../server/bootstrap.js";
import type { GTMClient } from "./client.js";
import type { ILogger, ICache } from "../core/types.js";
import type { ICapabilitiesRegistry } from "../core/types.js";
import {
  containerListRequestSchema,
  containerListResponseSchema,
  containerGetRequestSchema,
  containerGetResponseSchema,
  containerUpsertRequestSchema,
  containerUpsertResponseSchema,
  containerDeleteRequestSchema,
  containerDeleteResponseSchema,
  workspaceListRequestSchema,
  workspaceListResponseSchema,
  workspaceGetRequestSchema,
  workspaceGetResponseSchema,
  workspaceCreateRequestSchema,
  workspaceCreateResponseSchema,
  workspaceMergeRequestSchema,
  workspaceMergeResponseSchema,
  tagListRequestSchema,
  tagListResponseSchema,
  tagGetRequestSchema,
  tagGetResponseSchema,
  tagUpsertRequestSchema,
  tagUpsertResponseSchema,
  tagDeleteRequestSchema,
  tagDeleteResponseSchema,
  triggerListRequestSchema,
  triggerListResponseSchema,
  triggerGetRequestSchema,
  triggerGetResponseSchema,
  triggerUpsertRequestSchema,
  triggerUpsertResponseSchema,
  triggerDeleteRequestSchema,
  triggerDeleteResponseSchema,
  variableListRequestSchema,
  variableListResponseSchema,
  variableGetRequestSchema,
  variableGetResponseSchema,
  variableUpsertRequestSchema,
  variableUpsertResponseSchema,
  variableDeleteRequestSchema,
  variableDeleteResponseSchema,
  builtinVariableListRequestSchema,
  builtinVariableListResponseSchema,
  builtinVariableEnableRequestSchema,
  builtinVariableEnableResponseSchema,
  datalayerValidateRequestSchema,
  datalayerValidateResponseSchema,
  datalayerSchemaGenerateRequestSchema,
  datalayerSchemaGenerateResponseSchema,
  datalayerMonitorRequestSchema,
  datalayerMonitorResponseSchema,
  datalayerEventsListRequestSchema,
  datalayerEventsListResponseSchema,
  folderListRequestSchema,
  folderListResponseSchema,
  folderGetRequestSchema,
  folderGetResponseSchema,
  folderUpsertRequestSchema,
  folderUpsertResponseSchema,
  folderDeleteRequestSchema,
  folderDeleteResponseSchema,
  versionListRequestSchema,
  versionListResponseSchema,
  versionGetRequestSchema,
  versionGetResponseSchema,
  versionCreateRequestSchema,
  versionCreateResponseSchema,
  versionRestoreRequestSchema,
  versionRestoreResponseSchema,
  workspacePublishRequestSchema,
  workspacePublishResponseSchema,
  previewCreateRequestSchema,
  previewCreateResponseSchema,
  previewGetRequestSchema,
  previewGetResponseSchema,
  consentConfigureRequestSchema,
  consentConfigureResponseSchema,
  consentGetRequestSchema,
  consentGetResponseSchema,
  consentModeSettingsSchema,
  tagSequenceUpdateRequestSchema,
  tagSequenceUpdateResponseSchema,
  tagPriorityUpdateRequestSchema,
  tagPriorityUpdateResponseSchema,
} from "./schemas.js";
import { validateSchema } from "../core/validation.js";
import { createOperationEnvelope } from "../core/envelope.js";
import { createPreconditionError } from "../core/errors.js";

/**
 * Options for registering GTM tools
 */
export interface GTMToolsOptions {
  bootstrap: MCPServerBootstrap;
  gtmClient: GTMClient;
  cache: ICache;
  capabilitiesRegistry: ICapabilitiesRegistry;
  logger: ILogger;
}

/**
 * Register all GTM tools
 * @param options - Tool registration options
 */
/**
 * Register container tools
 */
function registerContainerTools(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  registerContainerListTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerContainerGetTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerContainerUpsertTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerContainerDeleteTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
}

/**
 * Register workspace tools
 */
function registerWorkspaceTools(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  registerWorkspaceListTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerWorkspaceGetTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerWorkspaceCreateTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerWorkspaceMergeTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
}

/**
 * Register tag tools
 */
function registerTagTools(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  registerTagListTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerTagGetTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerTagUpsertTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerTagDeleteTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
}

/**
 * Register trigger tools
 */
function registerTriggerTools(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  registerTriggerListTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerTriggerGetTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerTriggerUpsertTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerTriggerDeleteTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
}

/**
 * Register variable tools
 */
function registerVariableTools(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  registerVariableListTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerVariableGetTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerVariableUpsertTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerVariableDeleteTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerBuiltinVariableListTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerBuiltinVariableEnableTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
}

/**
 * Register data layer tools
 */
function registerDataLayerTools(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  registerDataLayerValidateTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerDataLayerSchemaGenerateTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerDataLayerMonitorTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerDataLayerEventsListTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
}

/**
 * Register folder tools
 */
function registerFolderTools(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  registerFolderListTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerFolderGetTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerFolderUpsertTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerFolderDeleteTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
}

/**
 * Register version tools
 */
function registerVersionTools(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  registerVersionListTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerVersionGetTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerVersionCreateTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerVersionRestoreTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
}

/**
 * Register publish and preview tools
 */
function registerPublishPreviewTools(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  registerWorkspacePublishTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerPreviewCreateTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerPreviewGetTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
}

/**
 * Register consent mode tools
 */
function registerConsentModeTools(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  registerConsentConfigureTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerConsentGetTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
}

/**
 * Register tag sequencing and priority tools
 */
function registerTagSequencingTools(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  registerTagSequenceUpdateTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerTagPriorityUpdateTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
}

/**
 * Register all GTM tools
 */
export function registerGTMTools(options: GTMToolsOptions): void {
  const { bootstrap, gtmClient, cache, capabilitiesRegistry, logger } = options;

  registerContainerTools(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerWorkspaceTools(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerTagTools(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerTriggerTools(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerVariableTools(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerDataLayerTools(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerFolderTools(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerVersionTools(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerPublishPreviewTools(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerConsentModeTools(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerTagSequencingTools(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
}

/**
 * Execute API request to list containers
 */
async function executeContainerListAPIRequest(
  validatedRequest: z.infer<typeof containerListRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof containerListResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "container.list");
  const tagManagerClient = gtmClient.getTagManagerClient();

  const response = await tagManagerClient.accounts.containers.list({
    parent: validatedRequest.parent,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No containers found", {});
  }

  // Transform container array to containers format
  const containersData = responseData.data as { container?: unknown[] };
  return validateSchema(containerListResponseSchema, {
    containers: containersData.container || [],
  });
}

/**
 * Execute container list operation
 */
async function executeContainerList(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof containerListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.container.list",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "gtm", accountId: (args as { parent: string }).parent },
  });

  logger.info("Executing gtm.container.list", { opId: envelope.opId });

  const validatedRequest = validateSchema(containerListRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const validatedResponse = await executeContainerListAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.container.list completed", {
    opId: envelope.opId,
    containerCount: validatedResponse.containers.length,
  });

  return validatedResponse;
}

/**
 * Get container list tool input schema
 */
function getContainerListToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Account ID in format accounts/123456",
      },
    },
    required: ["parent"],
  };
}

/**
 * Create container list tool handler
 */
function createContainerListToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof containerListResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeContainerList(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.container.list failed", error);
      } else {
        logger.error("gtm.container.list failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.container.list tool
 */
function registerContainerListTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.container.list",
    description: "List GTM containers for an account",
    inputSchema: getContainerListToolSchema(),
    handler: createContainerListToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Check cache and return container if found
 */
async function checkContainerCache(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof containerGetResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for container", { cacheKey });
    return validateSchema(containerGetResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request to get container
 */
async function executeContainerGetAPIRequest(
  containerPath: string,
  gtmClient: GTMClient
): Promise<z.infer<typeof containerGetResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "container.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  const response = await tagManagerClient.accounts.containers.get({
    path: containerPath,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Container not found", {
      container: containerPath,
    });
  }

  return validateSchema(containerGetResponseSchema, responseData.data);
}

/**
 * Execute container get operation
 */
async function executeContainerGet(
  args: unknown,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof containerGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.container.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { path: string }).path.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.container.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(containerGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const cacheKey = `gtm:container:${validatedRequest.path}`;
  const cached = await checkContainerCache(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  const validatedResponse = await executeContainerGetAPIRequest(validatedRequest.path, gtmClient);

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("gtm.container.get completed", {
    opId: envelope.opId,
    container: validatedRequest.path,
  });

  return validatedResponse;
}

/**
 * Get container get tool input schema
 */
function getContainerGetToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Container path in format accounts/123456/containers/987654",
      },
    },
    required: ["path"],
  };
}

/**
 * Create container get tool handler
 */
function createContainerGetToolHandler(
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof containerGetResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeContainerGet(args, gtmClient, cache, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.container.get failed", error);
      } else {
        logger.error("gtm.container.get failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.container.get tool
 */
function registerContainerGetTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.container.get",
    description: "Get GTM container details by container path",
    inputSchema: getContainerGetToolSchema(),
    handler: createContainerGetToolHandler(gtmClient, cache, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to create/update container
 */
async function executeContainerUpsertAPIRequest(
  validatedRequest: z.infer<typeof containerUpsertRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof containerUpsertResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "container.upsert");
  const tagManagerClient = gtmClient.getTagManagerClient();

  const containerData: Record<string, unknown> = {
    name: validatedRequest.name,
  };
  if (validatedRequest.domainName) {
    containerData.domainName = validatedRequest.domainName;
  }
  if (validatedRequest.timeZoneCountryId) {
    containerData.timeZoneCountryId = validatedRequest.timeZoneCountryId;
  }
  if (validatedRequest.timeZoneId) {
    containerData.timeZoneId = validatedRequest.timeZoneId;
  }
  if (validatedRequest.usageContext) {
    containerData.usageContext = validatedRequest.usageContext;
  }

  let response;
  if (validatedRequest.containerId) {
    // Update existing container
    const containerPath = `${validatedRequest.parent}/containers/${validatedRequest.containerId}`;
    response = await tagManagerClient.accounts.containers.update({
      path: containerPath,
      requestBody: containerData,
    });
  } else {
    // Create new container
    containerData.parent = validatedRequest.parent;
    response = await tagManagerClient.accounts.containers.create({
      parent: validatedRequest.parent,
      requestBody: containerData,
    });
  }

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Container operation failed", {});
  }

  return validateSchema(containerUpsertResponseSchema, responseData.data);
}

/**
 * Execute container upsert operation with pre/post validation
 */
async function executeContainerUpsert(
  args: unknown,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof containerUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.container.upsert",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { parent: string }).parent,
    },
  });

  logger.info("Executing gtm.container.upsert", { opId: envelope.opId });

  const validatedRequest = validateSchema(containerUpsertRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const validatedResponse = await executeContainerUpsertAPIRequest(validatedRequest, gtmClient);

  // Post-check: verify container was created/updated
  const containerPath = `${validatedResponse.accountId ? `accounts/${validatedResponse.accountId}` : validatedRequest.parent}/containers/${validatedResponse.containerId || validatedRequest.containerId}`;
  const cacheKey = `gtm:container:${containerPath}`;
  await cache.invalidate(cacheKey);
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("gtm.container.upsert completed", {
    opId: envelope.opId,
    container: containerPath,
  });

  return validatedResponse;
}

/**
 * Get container upsert tool input schema
 */
function getContainerUpsertToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Account ID in format accounts/123456",
      },
      name: {
        type: "string",
        description: "Container name",
      },
      domainName: {
        type: "array",
        items: {
          type: "string",
        },
        description: "List of domain names",
      },
      timeZoneCountryId: {
        type: "string",
        description: "Time zone country ID",
      },
      timeZoneId: {
        type: "string",
        description: "Time zone ID",
      },
      usageContext: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Usage context (WEB, ANDROID, IOS)",
      },
      containerId: {
        type: "string",
        description: "Container ID for updates (optional)",
      },
    },
    required: ["parent", "name"],
  };
}

/**
 * Create container upsert tool handler
 */
function createContainerUpsertToolHandler(
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof containerUpsertResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeContainerUpsert(args, gtmClient, cache, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.container.upsert failed", error);
      } else {
        logger.error("gtm.container.upsert failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.container.upsert tool
 */
function registerContainerUpsertTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.container.upsert",
    description: "Create or update GTM container",
    inputSchema: getContainerUpsertToolSchema(),
    handler: createContainerUpsertToolHandler(gtmClient, cache, capabilitiesRegistry, logger),
  });
}

/**
 * Execute container delete operation
 */
/**
 * Helper: Verify container exists
 */
async function verifyContainerExists(
  gtmClient: GTMClient,
  path: string
): Promise<void> {
  await gtmClient.checkRateLimit("gtm", "container.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  try {
    await tagManagerClient.accounts.containers.get({ path });
  } catch {
    throw createPreconditionError("not_found", "Container not found", {
      container: path,
    });
  }
}

/**
 * Helper: Execute container delete mutation
 */
async function executeContainerDeleteMutation(
  gtmClient: GTMClient,
  path: string,
  logger: ILogger
): Promise<void> {
  await gtmClient.checkRateLimit("gtm", "container.delete");
  try {
    const tagManagerClient = gtmClient.getTagManagerClient();
    await tagManagerClient.accounts.containers.delete({ path });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Container delete failed", error);
    } else {
      logger.error("Container delete failed", new Error(String(error)));
    }
    throw error;
  }
}

async function executeContainerDelete(
  args: unknown,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof containerDeleteResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.container.delete",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { path: string }).path.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.container.delete", { opId: envelope.opId });

  const validatedRequest = validateSchema(containerDeleteRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  await verifyContainerExists(gtmClient, validatedRequest.path);
  await executeContainerDeleteMutation(gtmClient, validatedRequest.path, logger);

  const cacheKey = `gtm:container:${validatedRequest.path}`;
  await cache.delete(cacheKey);

  logger.info("gtm.container.delete completed", {
    opId: envelope.opId,
    container: validatedRequest.path,
  });

  return {
    success: true,
    path: validatedRequest.path,
  };
}

/**
 * Get container delete tool input schema
 */
function getContainerDeleteToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Container path in format accounts/123456/containers/987654",
      },
    },
    required: ["path"],
  };
}

/**
 * Create container delete tool handler
 */
function createContainerDeleteToolHandler(
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof containerDeleteResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeContainerDelete(args, gtmClient, cache, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.container.delete failed", error);
      } else {
        logger.error("gtm.container.delete failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.container.delete tool
 */
function registerContainerDeleteTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.container.delete",
    description: "Delete GTM container",
    inputSchema: getContainerDeleteToolSchema(),
    handler: createContainerDeleteToolHandler(gtmClient, cache, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to list workspaces
 */
async function executeWorkspaceListAPIRequest(
  validatedRequest: z.infer<typeof workspaceListRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof workspaceListResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "workspace.list");
  const tagManagerClient = gtmClient.getTagManagerClient();

  const response = await tagManagerClient.accounts.containers.workspaces.list({
    parent: validatedRequest.parent,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No workspaces found", {});
  }

  // Transform workspace array to workspaces format
  const workspacesData = responseData.data as { workspace?: unknown[] };
  return validateSchema(workspaceListResponseSchema, {
    workspaces: workspacesData.workspace || [],
  });
}

/**
 * Execute workspace list operation
 */
async function executeWorkspaceList(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof workspaceListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.workspace.list",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { parent: string }).parent.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.workspace.list", { opId: envelope.opId });

  const validatedRequest = validateSchema(workspaceListRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const validatedResponse = await executeWorkspaceListAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.workspace.list completed", {
    opId: envelope.opId,
    workspaceCount: validatedResponse.workspaces.length,
  });

  return validatedResponse;
}

/**
 * Get workspace list tool input schema
 */
function getWorkspaceListToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Container path in format accounts/123456/containers/987654",
      },
    },
    required: ["parent"],
  };
}

/**
 * Create workspace list tool handler
 */
function createWorkspaceListToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof workspaceListResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeWorkspaceList(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.workspace.list failed", error);
      } else {
        logger.error("gtm.workspace.list failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.workspace.list tool
 */
function registerWorkspaceListTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.workspace.list",
    description: "List GTM workspaces for a container",
    inputSchema: getWorkspaceListToolSchema(),
    handler: createWorkspaceListToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Check cache and return workspace if found
 */
async function checkWorkspaceCache(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof workspaceGetResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for workspace", { cacheKey });
    return validateSchema(workspaceGetResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request to get workspace
 */
async function executeWorkspaceGetAPIRequest(
  workspacePath: string,
  gtmClient: GTMClient
): Promise<z.infer<typeof workspaceGetResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "workspace.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  const response = await tagManagerClient.accounts.containers.workspaces.get({
    path: workspacePath,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Workspace not found", {
      workspace: workspacePath,
    });
  }

  return validateSchema(workspaceGetResponseSchema, responseData.data);
}

/**
 * Execute workspace get operation
 */
async function executeWorkspaceGet(
  args: unknown,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof workspaceGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.workspace.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { path: string }).path.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.workspace.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(workspaceGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const cacheKey = `gtm:workspace:${validatedRequest.path}`;
  const cached = await checkWorkspaceCache(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  const validatedResponse = await executeWorkspaceGetAPIRequest(validatedRequest.path, gtmClient);

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("gtm.workspace.get completed", {
    opId: envelope.opId,
    workspace: validatedRequest.path,
  });

  return validatedResponse;
}

/**
 * Get workspace get tool input schema
 */
function getWorkspaceGetToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
    },
    required: ["path"],
  };
}

/**
 * Create workspace get tool handler
 */
function createWorkspaceGetToolHandler(
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof workspaceGetResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeWorkspaceGet(args, gtmClient, cache, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.workspace.get failed", error);
      } else {
        logger.error("gtm.workspace.get failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.workspace.get tool
 */
function registerWorkspaceGetTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.workspace.get",
    description: "Get GTM workspace details by workspace path",
    inputSchema: getWorkspaceGetToolSchema(),
    handler: createWorkspaceGetToolHandler(gtmClient, cache, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to create workspace
 */
async function executeWorkspaceCreateAPIRequest(
  validatedRequest: z.infer<typeof workspaceCreateRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof workspaceCreateResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "workspace.create");
  const tagManagerClient = gtmClient.getTagManagerClient();

  const workspaceData: Record<string, unknown> = {
    name: validatedRequest.name,
  };
  if (validatedRequest.description) {
    workspaceData.description = validatedRequest.description;
  }

  const response = await tagManagerClient.accounts.containers.workspaces.create({
    parent: validatedRequest.parent,
    requestBody: workspaceData,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Workspace creation failed", {});
  }

  return validateSchema(workspaceCreateResponseSchema, responseData.data);
}

/**
 * Execute workspace create operation
 */
async function executeWorkspaceCreate(
  args: unknown,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof workspaceCreateResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.workspace.create",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { parent: string }).parent.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.workspace.create", { opId: envelope.opId });

  const validatedRequest = validateSchema(workspaceCreateRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const validatedResponse = await executeWorkspaceCreateAPIRequest(validatedRequest, gtmClient);

  // Post-check: verify workspace was created
  const workspacePath = `${validatedResponse.accountId ? `accounts/${validatedResponse.accountId}` : validatedRequest.parent}/workspaces/${validatedResponse.workspaceId}`;
  const cacheKey = `gtm:workspace:${workspacePath}`;
  await cache.invalidate(cacheKey);
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("gtm.workspace.create completed", {
    opId: envelope.opId,
    workspace: workspacePath,
  });

  return validatedResponse;
}

/**
 * Get workspace create tool input schema
 */
function getWorkspaceCreateToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Container path in format accounts/123456/containers/987654",
      },
      name: {
        type: "string",
        description: "Workspace name",
      },
      description: {
        type: "string",
        description: "Workspace description",
      },
    },
    required: ["parent", "name"],
  };
}

/**
 * Create workspace create tool handler
 */
function createWorkspaceCreateToolHandler(
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof workspaceCreateResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeWorkspaceCreate(args, gtmClient, cache, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.workspace.create failed", error);
      } else {
        logger.error("gtm.workspace.create failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.workspace.create tool
 */
function registerWorkspaceCreateTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.workspace.create",
    description: "Create GTM workspace",
    inputSchema: getWorkspaceCreateToolSchema(),
    handler: createWorkspaceCreateToolHandler(gtmClient, cache, capabilitiesRegistry, logger),
  });
}

/**
 * Execute workspace merge operation with rollback
 */
/**
 * Helper: Verify workspaces exist before merge
 */
async function verifyWorkspacesExist(
  tagManagerClient: unknown,
  targetPath: string,
  sourcePath: string
): Promise<void> {
  const workspaces = tagManagerClient as {
    get?: (params: { path: string }) => Promise<unknown>;
  };
  if (!workspaces.get) {
    throw createPreconditionError("not_found", "Workspace API not available", {});
  }
  try {
    await workspaces.get({ path: targetPath });
    await workspaces.get({ path: sourcePath });
  } catch {
    throw createPreconditionError("not_found", "One or both workspaces not found", {
      workspace: targetPath,
      sourceWorkspace: sourcePath,
    });
  }
}

/**
 * Helper: Execute workspace merge operation
 */
async function performWorkspaceMerge(
  tagManagerClient: unknown,
  targetPath: string,
  sourcePath: string
): Promise<z.infer<typeof workspaceGetResponseSchema> | undefined> {
  const workspaces = tagManagerClient as {
    merge?: (params: {
      path: string;
      sourceWorkspacePath: string;
    }) => Promise<{ data?: unknown }>;
  };

  if (!workspaces.merge) {
    throw createPreconditionError("not_found", "Workspace merge API not available", {});
  }

  const response = await workspaces.merge({
    path: targetPath,
    sourceWorkspacePath: sourcePath,
  });
  const responseData = response as { data?: unknown };
  if (responseData.data) {
    return validateSchema(workspaceGetResponseSchema, responseData.data);
  }
  return undefined;
}

/**
 * Helper: Update cache after workspace merge
 */
async function updateWorkspaceCache(
  cache: ICache,
  targetPath: string,
  sourcePath: string,
  mergedWorkspace: z.infer<typeof workspaceGetResponseSchema> | undefined
): Promise<void> {
  if (mergedWorkspace) {
    const cacheKey = `gtm:workspace:${targetPath}`;
    await cache.invalidate(cacheKey);
    await cache.set(cacheKey, mergedWorkspace, 300000);
  }
  const sourceCacheKey = `gtm:workspace:${sourcePath}`;
  await cache.delete(sourceCacheKey);
}

/**
 * Helper: Validate workspace merge request and check capabilities
 */
function validateWorkspaceMergeRequest(
  args: unknown,
  capabilitiesRegistry: ICapabilitiesRegistry
): z.infer<typeof workspaceMergeRequestSchema> {
  const validatedRequest = validateSchema(workspaceMergeRequestSchema, args);
  if (!capabilitiesRegistry.hasCapability("gtm", "tag_manager_api")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }
  return validatedRequest;
}

/**
 * Helper: Orchestrate workspace merge workflow
 */
async function orchestrateWorkspaceMerge(
  gtmClient: GTMClient,
  cache: ICache,
  validatedRequest: z.infer<typeof workspaceMergeRequestSchema>
): Promise<z.infer<typeof workspaceGetResponseSchema> | undefined> {
  await gtmClient.checkRateLimit("gtm", "workspace.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  await verifyWorkspacesExist(
    tagManagerClient,
    validatedRequest.path,
    validatedRequest.sourceWorkspacePath
  );

  await gtmClient.checkRateLimit("gtm", "workspace.merge");
  const mergedWorkspace = await performWorkspaceMerge(
    tagManagerClient,
    validatedRequest.path,
    validatedRequest.sourceWorkspacePath
  );

  await updateWorkspaceCache(
    cache,
    validatedRequest.path,
    validatedRequest.sourceWorkspacePath,
    mergedWorkspace
  );

  return mergedWorkspace;
}

/**
 * Execute workspace merge
 */
async function executeWorkspaceMerge(
  args: unknown,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof workspaceMergeResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.workspace.merge",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { path: string }).path.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.workspace.merge", { opId: envelope.opId });
  const validatedRequest = validateWorkspaceMergeRequest(args, capabilitiesRegistry);

  let mergedWorkspace: z.infer<typeof workspaceGetResponseSchema> | undefined;
  try {
    mergedWorkspace = await orchestrateWorkspaceMerge(gtmClient, cache, validatedRequest);
  } catch (error) {
    logger.error("Workspace merge failed", error instanceof Error ? error : new Error(String(error)));
    throw error;
  }

  logger.info("gtm.workspace.merge completed", {
    opId: envelope.opId,
    workspace: validatedRequest.path,
    sourceWorkspace: validatedRequest.sourceWorkspacePath,
  });

  return {
    success: true,
    path: validatedRequest.path,
    mergedWorkspace,
  };
}

/**
 * Get workspace merge tool input schema
 */
function getWorkspaceMergeToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Target workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
      sourceWorkspacePath: {
        type: "string",
        description: "Source workspace path in format accounts/123456/containers/987654/workspaces/222222",
      },
    },
    required: ["path", "sourceWorkspacePath"],
  };
}

/**
 * Create workspace merge tool handler
 */
function createWorkspaceMergeToolHandler(
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof workspaceMergeResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeWorkspaceMerge(args, gtmClient, cache, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.workspace.merge failed", error);
      } else {
        logger.error("gtm.workspace.merge failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.workspace.merge tool
 */
function registerWorkspaceMergeTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.workspace.merge",
    description: "Merge source workspace into target workspace with conflict resolution",
    inputSchema: getWorkspaceMergeToolSchema(),
    handler: createWorkspaceMergeToolHandler(gtmClient, cache, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to list tags
 */
async function executeTagListAPIRequest(
  validatedRequest: z.infer<typeof tagListRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof tagListResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "tag.list");
  const tagManagerClient = gtmClient.getTagManagerClient();

  const response = await tagManagerClient.accounts.containers.workspaces.tags.list({
    parent: validatedRequest.parent,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No tags found", {});
  }

  // Transform tag array to tags format
  const tagsData = responseData.data as { tag?: unknown[] };
  return validateSchema(tagListResponseSchema, {
    tags: tagsData.tag || [],
  });
}

/**
 * Execute tag list operation
 */
async function executeTagList(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof tagListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.tag.list",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { parent: string }).parent.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.tag.list", { opId: envelope.opId });

  const validatedRequest = validateSchema(tagListRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const validatedResponse = await executeTagListAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.tag.list completed", {
    opId: envelope.opId,
    tagCount: validatedResponse.tags.length,
  });

  return validatedResponse;
}

/**
 * Get tag list tool input schema
 */
function getTagListToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
    },
    required: ["parent"],
  };
}

/**
 * Create tag list tool handler
 */
function createTagListToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof tagListResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeTagList(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.tag.list failed", error);
      } else {
        logger.error("gtm.tag.list failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.tag.list tool
 */
function registerTagListTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.tag.list",
    description: "List GTM tags for a workspace",
    inputSchema: getTagListToolSchema(),
    handler: createTagListToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Check cache and return tag if found
 */
async function checkTagCache(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof tagGetResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for tag", { cacheKey });
    return validateSchema(tagGetResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request to get tag
 */
async function executeTagGetAPIRequest(
  tagPath: string,
  gtmClient: GTMClient
): Promise<z.infer<typeof tagGetResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "tag.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  const response = await tagManagerClient.accounts.containers.workspaces.tags.get({
    path: tagPath,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Tag not found", {
      tag: tagPath,
    });
  }

  return validateSchema(tagGetResponseSchema, responseData.data);
}

/**
 * Execute tag get operation
 */
async function executeTagGet(
  args: unknown,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof tagGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.tag.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { path: string }).path.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.tag.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(tagGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const cacheKey = `gtm:tag:${validatedRequest.path}`;
  const cached = await checkTagCache(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  const validatedResponse = await executeTagGetAPIRequest(validatedRequest.path, gtmClient);

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("gtm.tag.get completed", {
    opId: envelope.opId,
    tag: validatedRequest.path,
  });

  return validatedResponse;
}

/**
 * Get tag get tool input schema
 */
function getTagGetToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Tag path in format accounts/123456/containers/987654/workspaces/111111/tags/222222",
      },
    },
    required: ["path"],
  };
}

/**
 * Create tag get tool handler
 */
function createTagGetToolHandler(
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof tagGetResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeTagGet(args, gtmClient, cache, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.tag.get failed", error);
      } else {
        logger.error("gtm.tag.get failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.tag.get tool
 */
function registerTagGetTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.tag.get",
    description: "Get GTM tag details by tag path",
    inputSchema: getTagGetToolSchema(),
    handler: createTagGetToolHandler(gtmClient, cache, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to create/update tag
 */
async function executeTagUpsertAPIRequest(
  validatedRequest: z.infer<typeof tagUpsertRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof tagUpsertResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "tag.upsert");
  const tagManagerClient = gtmClient.getTagManagerClient();

  const tagData: Record<string, unknown> = {
    name: validatedRequest.name,
    type: validatedRequest.type,
  };
  if (validatedRequest.parameter) {
    tagData.parameter = validatedRequest.parameter;
  }
  if (validatedRequest.firingTriggerId) {
    tagData.firingTriggerId = validatedRequest.firingTriggerId;
  }
  if (validatedRequest.blockingTriggerId) {
    tagData.blockingTriggerId = validatedRequest.blockingTriggerId;
  }
  if (validatedRequest.tagFiringOption) {
    tagData.tagFiringOption = validatedRequest.tagFiringOption;
  }

  let response;
  if (validatedRequest.tagId) {
    // Update existing tag
    const tagPath = `${validatedRequest.parent}/tags/${validatedRequest.tagId}`;
    response = await tagManagerClient.accounts.containers.workspaces.tags.update({
      path: tagPath,
      requestBody: tagData,
    });
  } else {
    // Create new tag
    response = await tagManagerClient.accounts.containers.workspaces.tags.create({
      parent: validatedRequest.parent,
      requestBody: tagData,
    });
  }

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Tag operation failed", {});
  }

  return validateSchema(tagUpsertResponseSchema, responseData.data);
}

/**
 * Execute tag upsert operation with idempotency via tag name + type
 */
async function executeTagUpsert(
  args: unknown,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof tagUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.tag.upsert",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { parent: string }).parent.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.tag.upsert", { opId: envelope.opId });

  const validatedRequest = validateSchema(tagUpsertRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const validatedResponse = await executeTagUpsertAPIRequest(validatedRequest, gtmClient);

  // Post-check: verify tag was created/updated
  const tagPath = `${validatedResponse.accountId ? `accounts/${validatedResponse.accountId}` : validatedRequest.parent}/tags/${validatedResponse.tagId || validatedRequest.tagId}`;
  const cacheKey = `gtm:tag:${tagPath}`;
  await cache.invalidate(cacheKey);
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("gtm.tag.upsert completed", {
    opId: envelope.opId,
    tag: tagPath,
  });

  return validatedResponse;
}

/**
 * Get tag upsert tool input schema
 */
function getTagUpsertToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
      name: {
        type: "string",
        description: "Tag name",
      },
      type: {
        type: "string",
        description: "Tag type (e.g., GOOGLE_ANALYTICS_GA4_CONFIGURATION)",
      },
      parameter: {
        type: "array",
        description: "Tag parameters",
      },
      firingTriggerId: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Firing trigger IDs",
      },
      blockingTriggerId: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Blocking trigger IDs",
      },
      tagFiringOption: {
        type: "string",
        description: "Tag firing option",
      },
      tagId: {
        type: "string",
        description: "Tag ID for updates (optional)",
      },
    },
    required: ["parent", "name", "type"],
  };
}

/**
 * Create tag upsert tool handler
 */
function createTagUpsertToolHandler(
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof tagUpsertResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeTagUpsert(args, gtmClient, cache, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.tag.upsert failed", error);
      } else {
        logger.error("gtm.tag.upsert failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.tag.upsert tool
 */
function registerTagUpsertTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.tag.upsert",
    description: "Create or update GTM tag with firing rules and sequencing",
    inputSchema: getTagUpsertToolSchema(),
    handler: createTagUpsertToolHandler(gtmClient, cache, capabilitiesRegistry, logger),
  });
}

/**
 * Execute tag delete operation
 */
/**
 * Helper: Verify tag exists
 */
async function verifyTagExists(
  gtmClient: GTMClient,
  path: string
): Promise<void> {
  await gtmClient.checkRateLimit("gtm", "tag.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  try {
    await tagManagerClient.accounts.containers.workspaces.tags.get({ path });
  } catch {
    throw createPreconditionError("not_found", "Tag not found", {
      tag: path,
    });
  }
}

/**
 * Helper: Execute tag delete mutation
 */
async function executeTagDeleteMutation(
  gtmClient: GTMClient,
  path: string,
  logger: ILogger
): Promise<void> {
  await gtmClient.checkRateLimit("gtm", "tag.delete");
  try {
    const tagManagerClient = gtmClient.getTagManagerClient();
    await tagManagerClient.accounts.containers.workspaces.tags.delete({ path });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Tag delete failed", error);
    } else {
      logger.error("Tag delete failed", new Error(String(error)));
    }
    throw error;
  }
}

async function executeTagDelete(
  args: unknown,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof tagDeleteResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.tag.delete",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { path: string }).path.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.tag.delete", { opId: envelope.opId });

  const validatedRequest = validateSchema(tagDeleteRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  await verifyTagExists(gtmClient, validatedRequest.path);
  await executeTagDeleteMutation(gtmClient, validatedRequest.path, logger);

  const cacheKey = `gtm:tag:${validatedRequest.path}`;
  await cache.delete(cacheKey);

  logger.info("gtm.tag.delete completed", {
    opId: envelope.opId,
    tag: validatedRequest.path,
  });

  return {
    success: true,
    path: validatedRequest.path,
  };
}

/**
 * Get tag delete tool input schema
 */
function getTagDeleteToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Tag path in format accounts/123456/containers/987654/workspaces/111111/tags/222222",
      },
    },
    required: ["path"],
  };
}

/**
 * Create tag delete tool handler
 */
function createTagDeleteToolHandler(
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof tagDeleteResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeTagDelete(args, gtmClient, cache, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.tag.delete failed", error);
      } else {
        logger.error("gtm.tag.delete failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.tag.delete tool
 */
function registerTagDeleteTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.tag.delete",
    description: "Delete GTM tag",
    inputSchema: getTagDeleteToolSchema(),
    handler: createTagDeleteToolHandler(gtmClient, cache, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to list triggers
 */
async function executeTriggerListAPIRequest(
  validatedRequest: z.infer<typeof triggerListRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof triggerListResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "trigger.list");
  const tagManagerClient = gtmClient.getTagManagerClient();

  const response = await tagManagerClient.accounts.containers.workspaces.triggers.list({
    parent: validatedRequest.parent,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No triggers found", {});
  }

  // Transform trigger array to triggers format
  const triggersData = responseData.data as { trigger?: unknown[] };
  return validateSchema(triggerListResponseSchema, {
    triggers: triggersData.trigger || [],
  });
}

/**
 * Execute trigger list operation
 */
async function executeTriggerList(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof triggerListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.trigger.list",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { parent: string }).parent.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.trigger.list", { opId: envelope.opId });

  const validatedRequest = validateSchema(triggerListRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const validatedResponse = await executeTriggerListAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.trigger.list completed", {
    opId: envelope.opId,
    triggerCount: validatedResponse.triggers.length,
  });

  return validatedResponse;
}

/**
 * Get trigger list tool input schema
 */
function getTriggerListToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
    },
    required: ["parent"],
  };
}

/**
 * Create trigger list tool handler
 */
function createTriggerListToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof triggerListResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeTriggerList(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.trigger.list failed", error);
      } else {
        logger.error("gtm.trigger.list failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.trigger.list tool
 */
function registerTriggerListTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.trigger.list",
    description: "List GTM triggers for a workspace",
    inputSchema: getTriggerListToolSchema(),
    handler: createTriggerListToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Check cache and return trigger if found
 */
async function checkTriggerCache(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof triggerGetResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for trigger", { cacheKey });
    return validateSchema(triggerGetResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request to get trigger
 */
async function executeTriggerGetAPIRequest(
  triggerPath: string,
  gtmClient: GTMClient
): Promise<z.infer<typeof triggerGetResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "trigger.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  const response = await tagManagerClient.accounts.containers.workspaces.triggers.get({
    path: triggerPath,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Trigger not found", {
      trigger: triggerPath,
    });
  }

  return validateSchema(triggerGetResponseSchema, responseData.data);
}

/**
 * Execute trigger get operation
 */
async function executeTriggerGet(
  args: unknown,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof triggerGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.trigger.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { path: string }).path.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.trigger.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(triggerGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const cacheKey = `gtm:trigger:${validatedRequest.path}`;
  const cached = await checkTriggerCache(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  const validatedResponse = await executeTriggerGetAPIRequest(validatedRequest.path, gtmClient);

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("gtm.trigger.get completed", {
    opId: envelope.opId,
    trigger: validatedRequest.path,
  });

  return validatedResponse;
}

/**
 * Get trigger get tool input schema
 */
function getTriggerGetToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Trigger path in format accounts/123456/containers/987654/workspaces/111111/triggers/333333",
      },
    },
    required: ["path"],
  };
}

/**
 * Create trigger get tool handler
 */
function createTriggerGetToolHandler(
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof triggerGetResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeTriggerGet(args, gtmClient, cache, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.trigger.get failed", error);
      } else {
        logger.error("gtm.trigger.get failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.trigger.get tool
 */
function registerTriggerGetTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.trigger.get",
    description: "Get GTM trigger details by trigger path",
    inputSchema: getTriggerGetToolSchema(),
    handler: createTriggerGetToolHandler(gtmClient, cache, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to create/update trigger
 */
async function executeTriggerUpsertAPIRequest(
  validatedRequest: z.infer<typeof triggerUpsertRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof triggerUpsertResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "trigger.upsert");
  const tagManagerClient = gtmClient.getTagManagerClient();

  const triggerData: Record<string, unknown> = {
    name: validatedRequest.name,
    type: validatedRequest.type,
  };
  if (validatedRequest.parameter) {
    triggerData.parameter = validatedRequest.parameter;
  }
  if (validatedRequest.customEventFilter) {
    triggerData.customEventFilter = validatedRequest.customEventFilter;
  }
  if (validatedRequest.autoEventFilter) {
    triggerData.autoEventFilter = validatedRequest.autoEventFilter;
  }

  let response;
  if (validatedRequest.triggerId) {
    // Update existing trigger
    const triggerPath = `${validatedRequest.parent}/triggers/${validatedRequest.triggerId}`;
    response = await tagManagerClient.accounts.containers.workspaces.triggers.update({
      path: triggerPath,
      requestBody: triggerData,
    });
  } else {
    // Create new trigger
    response = await tagManagerClient.accounts.containers.workspaces.triggers.create({
      parent: validatedRequest.parent,
      requestBody: triggerData,
    });
  }

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Trigger operation failed", {});
  }

  return validateSchema(triggerUpsertResponseSchema, responseData.data);
}

/**
 * Execute trigger upsert operation with condition and filter support
 */
async function executeTriggerUpsert(
  args: unknown,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof triggerUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.trigger.upsert",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { parent: string }).parent.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.trigger.upsert", { opId: envelope.opId });

  const validatedRequest = validateSchema(triggerUpsertRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const validatedResponse = await executeTriggerUpsertAPIRequest(validatedRequest, gtmClient);

  // Post-check: verify trigger was created/updated
  const triggerPath = `${validatedResponse.accountId ? `accounts/${validatedResponse.accountId}` : validatedRequest.parent}/triggers/${validatedResponse.triggerId || validatedRequest.triggerId}`;
  const cacheKey = `gtm:trigger:${triggerPath}`;
  await cache.invalidate(cacheKey);
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("gtm.trigger.upsert completed", {
    opId: envelope.opId,
    trigger: triggerPath,
  });

  return validatedResponse;
}

/**
 * Get trigger upsert tool input schema
 */
function getTriggerUpsertToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
      name: {
        type: "string",
        description: "Trigger name",
      },
      type: {
        type: "string",
        description: "Trigger type (e.g., PAGEVIEW, CLICK, CUSTOM_EVENT, TIMER, FORM)",
      },
      parameter: {
        type: "array",
        description: "Trigger parameters",
      },
      customEventFilter: {
        type: "array",
        description: "Custom event filters",
      },
      autoEventFilter: {
        type: "array",
        description: "Auto event filters",
      },
      triggerId: {
        type: "string",
        description: "Trigger ID for updates (optional)",
      },
    },
    required: ["parent", "name", "type"],
  };
}

/**
 * Create trigger upsert tool handler
 */
function createTriggerUpsertToolHandler(
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof triggerUpsertResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeTriggerUpsert(args, gtmClient, cache, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.trigger.upsert failed", error);
      } else {
        logger.error("gtm.trigger.upsert failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.trigger.upsert tool
 */
function registerTriggerUpsertTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.trigger.upsert",
    description: "Create or update GTM trigger with condition and filter support",
    inputSchema: getTriggerUpsertToolSchema(),
    handler: createTriggerUpsertToolHandler(gtmClient, cache, capabilitiesRegistry, logger),
  });
}

/**
 * Helper: Verify trigger exists
 */
async function verifyTriggerExists(
  gtmClient: GTMClient,
  path: string
): Promise<void> {
  await gtmClient.checkRateLimit("gtm", "trigger.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  try {
    await tagManagerClient.accounts.containers.workspaces.triggers.get({ path });
  } catch {
    throw createPreconditionError("not_found", "Trigger not found", {
      trigger: path,
    });
  }
}

/**
 * Helper: Execute trigger delete mutation
 */
async function executeTriggerDeleteMutation(
  gtmClient: GTMClient,
  path: string,
  logger: ILogger
): Promise<void> {
  await gtmClient.checkRateLimit("gtm", "trigger.delete");
  try {
    const tagManagerClient = gtmClient.getTagManagerClient();
    await tagManagerClient.accounts.containers.workspaces.triggers.delete({ path });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Trigger delete failed", error);
    } else {
      logger.error("Trigger delete failed", new Error(String(error)));
    }
    throw error;
  }
}

/**
 * Execute trigger delete operation
 */
async function executeTriggerDelete(
  args: unknown,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof triggerDeleteResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.trigger.delete",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { path: string }).path.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.trigger.delete", { opId: envelope.opId });

  const validatedRequest = validateSchema(triggerDeleteRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  await verifyTriggerExists(gtmClient, validatedRequest.path);
  await executeTriggerDeleteMutation(gtmClient, validatedRequest.path, logger);

  // Invalidate cache
  const cacheKey = `gtm:trigger:${validatedRequest.path}`;
  await cache.delete(cacheKey);

  logger.info("gtm.trigger.delete completed", {
    opId: envelope.opId,
    trigger: validatedRequest.path,
  });

  return {
    success: true,
    path: validatedRequest.path,
  };
}

/**
 * Get trigger delete tool input schema
 */
function getTriggerDeleteToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Trigger path in format accounts/123456/containers/987654/workspaces/111111/triggers/333333",
      },
    },
    required: ["path"],
  };
}

/**
 * Create trigger delete tool handler
 */
function createTriggerDeleteToolHandler(
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof triggerDeleteResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeTriggerDelete(args, gtmClient, cache, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.trigger.delete failed", error);
      } else {
        logger.error("gtm.trigger.delete failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.trigger.delete tool
 */
function registerTriggerDeleteTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.trigger.delete",
    description: "Delete GTM trigger",
    inputSchema: getTriggerDeleteToolSchema(),
    handler: createTriggerDeleteToolHandler(gtmClient, cache, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to list variables
 */
async function executeVariableListAPIRequest(
  validatedRequest: z.infer<typeof variableListRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof variableListResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "variable.list");
  const tagManagerClient = gtmClient.getTagManagerClient();

  const response = await tagManagerClient.accounts.containers.workspaces.variables.list({
    parent: validatedRequest.parent,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No variables found", {});
  }

  // Transform variable array to variables format
  const variablesData = responseData.data as { variable?: unknown[] };
  return validateSchema(variableListResponseSchema, {
    variables: variablesData.variable || [],
  });
}

/**
 * Execute variable list operation
 */
async function executeVariableList(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof variableListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.variable.list",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { parent: string }).parent.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.variable.list", { opId: envelope.opId });

  const validatedRequest = validateSchema(variableListRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const validatedResponse = await executeVariableListAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.variable.list completed", {
    opId: envelope.opId,
    variableCount: validatedResponse.variables.length,
  });

  return validatedResponse;
}

/**
 * Get variable list tool input schema
 */
function getVariableListToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
    },
    required: ["parent"],
  };
}

/**
 * Create variable list tool handler
 */
function createVariableListToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof variableListResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeVariableList(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.variable.list failed", error);
      } else {
        logger.error("gtm.variable.list failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.variable.list tool
 */
function registerVariableListTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.variable.list",
    description: "List GTM variables for a workspace",
    inputSchema: getVariableListToolSchema(),
    handler: createVariableListToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Check cache and return variable if found
 */
async function checkVariableCache(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof variableGetResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for variable", { cacheKey });
    return validateSchema(variableGetResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request to get variable
 */
async function executeVariableGetAPIRequest(
  variablePath: string,
  gtmClient: GTMClient
): Promise<z.infer<typeof variableGetResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "variable.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  const response = await tagManagerClient.accounts.containers.workspaces.variables.get({
    path: variablePath,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Variable not found", {
      variable: variablePath,
    });
  }

  return validateSchema(variableGetResponseSchema, responseData.data);
}

/**
 * Execute variable get operation
 */
async function executeVariableGet(
  args: unknown,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof variableGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.variable.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { path: string }).path.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.variable.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(variableGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const cacheKey = `gtm:variable:${validatedRequest.path}`;
  const cached = await checkVariableCache(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  const validatedResponse = await executeVariableGetAPIRequest(validatedRequest.path, gtmClient);

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("gtm.variable.get completed", {
    opId: envelope.opId,
    variable: validatedRequest.path,
  });

  return validatedResponse;
}

/**
 * Get variable get tool input schema
 */
function getVariableGetToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Variable path in format accounts/123456/containers/987654/workspaces/111111/variables/444444",
      },
    },
    required: ["path"],
  };
}

/**
 * Create variable get tool handler
 */
function createVariableGetToolHandler(
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof variableGetResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeVariableGet(args, gtmClient, cache, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.variable.get failed", error);
      } else {
        logger.error("gtm.variable.get failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.variable.get tool
 */
function registerVariableGetTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.variable.get",
    description: "Get GTM variable details by variable path",
    inputSchema: getVariableGetToolSchema(),
    handler: createVariableGetToolHandler(gtmClient, cache, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to create/update variable
 */
async function executeVariableUpsertAPIRequest(
  validatedRequest: z.infer<typeof variableUpsertRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof variableUpsertResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "variable.upsert");
  const tagManagerClient = gtmClient.getTagManagerClient();

  const variableData: Record<string, unknown> = {
    name: validatedRequest.name,
    type: validatedRequest.type,
  };
  if (validatedRequest.parameter) {
    variableData.parameter = validatedRequest.parameter;
  }
  if (validatedRequest.formatValue) {
    variableData.formatValue = validatedRequest.formatValue;
  }

  let response;
  if (validatedRequest.variableId) {
    // Update existing variable
    const variablePath = `${validatedRequest.parent}/variables/${validatedRequest.variableId}`;
    response = await tagManagerClient.accounts.containers.workspaces.variables.update({
      path: variablePath,
      requestBody: variableData,
    });
  } else {
    // Create new variable
    response = await tagManagerClient.accounts.containers.workspaces.variables.create({
      parent: validatedRequest.parent,
      requestBody: variableData,
    });
  }

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Variable operation failed", {});
  }

  return validateSchema(variableUpsertResponseSchema, responseData.data);
}

/**
 * Execute variable upsert operation
 */
async function executeVariableUpsert(
  args: unknown,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof variableUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.variable.upsert",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { parent: string }).parent.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.variable.upsert", { opId: envelope.opId });

  const validatedRequest = validateSchema(variableUpsertRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const validatedResponse = await executeVariableUpsertAPIRequest(validatedRequest, gtmClient);

  // Post-check: verify variable was created/updated
  const variablePath = `${validatedResponse.accountId ? `accounts/${validatedResponse.accountId}` : validatedRequest.parent}/variables/${validatedResponse.variableId || validatedRequest.variableId}`;
  const cacheKey = `gtm:variable:${variablePath}`;
  await cache.invalidate(cacheKey);
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("gtm.variable.upsert completed", {
    opId: envelope.opId,
    variable: variablePath,
  });

  return validatedResponse;
}

/**
 * Get variable upsert tool input schema
 */
function getVariableUpsertToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
      name: {
        type: "string",
        description: "Variable name",
      },
      type: {
        type: "string",
        description: "Variable type (e.g., v, cjs, u, c, lookupTable)",
      },
      parameter: {
        type: "array",
        description: "Variable parameters",
      },
      formatValue: {
        type: "object",
        description: "Format value configuration",
      },
      variableId: {
        type: "string",
        description: "Variable ID for updates (optional)",
      },
    },
    required: ["parent", "name", "type"],
  };
}

/**
 * Create variable upsert tool handler
 */
function createVariableUpsertToolHandler(
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof variableUpsertResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeVariableUpsert(args, gtmClient, cache, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.variable.upsert failed", error);
      } else {
        logger.error("gtm.variable.upsert failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.variable.upsert tool
 */
function registerVariableUpsertTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.variable.upsert",
    description: "Create or update GTM variable (data layer, custom JS, URL, constant, lookup tables)",
    inputSchema: getVariableUpsertToolSchema(),
    handler: createVariableUpsertToolHandler(gtmClient, cache, capabilitiesRegistry, logger),
  });
}

/**
 * Helper: Verify variable exists
 */
async function verifyVariableExists(
  gtmClient: GTMClient,
  path: string
): Promise<void> {
  await gtmClient.checkRateLimit("gtm", "variable.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  try {
    await tagManagerClient.accounts.containers.workspaces.variables.get({ path });
  } catch {
    throw createPreconditionError("not_found", "Variable not found", {
      variable: path,
    });
  }
}

/**
 * Helper: Execute variable delete mutation
 */
async function executeVariableDeleteMutation(
  gtmClient: GTMClient,
  path: string,
  logger: ILogger
): Promise<void> {
  await gtmClient.checkRateLimit("gtm", "variable.delete");
  try {
    const tagManagerClient = gtmClient.getTagManagerClient();
    await tagManagerClient.accounts.containers.workspaces.variables.delete({ path });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Variable delete failed", error);
    } else {
      logger.error("Variable delete failed", new Error(String(error)));
    }
    throw error;
  }
}

/**
 * Execute variable delete operation
 */
async function executeVariableDelete(
  args: unknown,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof variableDeleteResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.variable.delete",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { path: string }).path.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.variable.delete", { opId: envelope.opId });

  const validatedRequest = validateSchema(variableDeleteRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  await verifyVariableExists(gtmClient, validatedRequest.path);
  await executeVariableDeleteMutation(gtmClient, validatedRequest.path, logger);

  // Invalidate cache
  const cacheKey = `gtm:variable:${validatedRequest.path}`;
  await cache.delete(cacheKey);

  logger.info("gtm.variable.delete completed", {
    opId: envelope.opId,
    variable: validatedRequest.path,
  });

  return {
    success: true,
    path: validatedRequest.path,
  };
}

/**
 * Get variable delete tool input schema
 */
function getVariableDeleteToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Variable path in format accounts/123456/containers/987654/workspaces/111111/variables/444444",
      },
    },
    required: ["path"],
  };
}

/**
 * Create variable delete tool handler
 */
function createVariableDeleteToolHandler(
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof variableDeleteResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeVariableDelete(args, gtmClient, cache, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.variable.delete failed", error);
      } else {
        logger.error("gtm.variable.delete failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.variable.delete tool
 */
function registerVariableDeleteTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.variable.delete",
    description: "Delete GTM variable",
    inputSchema: getVariableDeleteToolSchema(),
    handler: createVariableDeleteToolHandler(gtmClient, cache, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to list built-in variables
 */
async function executeBuiltinVariableListAPIRequest(
  validatedRequest: z.infer<typeof builtinVariableListRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof builtinVariableListResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "builtinVariable.list");
  const tagManagerClient = gtmClient.getTagManagerClient();

  const response = await tagManagerClient.accounts.containers.workspaces.built_in_variables.list({
    parent: validatedRequest.parent,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No built-in variables found", {});
  }

  // Transform builtInVariable array to builtInVariables format
  const builtInVariablesData = responseData.data as { builtInVariable?: unknown[] };
  return validateSchema(builtinVariableListResponseSchema, {
    builtInVariables: builtInVariablesData.builtInVariable || [],
  });
}

/**
 * Execute built-in variable list operation
 */
async function executeBuiltinVariableList(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof builtinVariableListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.builtinVariable.list",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { parent: string }).parent.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.builtinVariable.list", { opId: envelope.opId });

  const validatedRequest = validateSchema(builtinVariableListRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const validatedResponse = await executeBuiltinVariableListAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.builtinVariable.list completed", {
    opId: envelope.opId,
    builtInVariableCount: validatedResponse.builtInVariables.length,
  });

  return validatedResponse;
}

/**
 * Get builtin variable list tool input schema
 */
function getBuiltinVariableListToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
    },
    required: ["parent"],
  };
}

/**
 * Create builtin variable list tool handler
 */
function createBuiltinVariableListToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof builtinVariableListResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeBuiltinVariableList(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.builtinVariable.list failed", error);
      } else {
        logger.error("gtm.builtinVariable.list failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.builtinVariable.list tool
 */
function registerBuiltinVariableListTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.builtinVariable.list",
    description: "List GTM built-in variables for a workspace",
    inputSchema: getBuiltinVariableListToolSchema(),
    handler: createBuiltinVariableListToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute built-in variable enable operation
 */
async function executeBuiltinVariableEnable(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof builtinVariableEnableResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.builtinVariable.enable",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "gtm",
      accountId: (args as { path: string }).path.split("/containers/")[0] || "",
    },
  });

  logger.info("Executing gtm.builtinVariable.enable", { opId: envelope.opId });

  const validatedRequest = validateSchema(builtinVariableEnableRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  const tagManagerClient = gtmClient.getTagManagerClient();
  await tagManagerClient.accounts.containers.workspaces.built_in_variables.create({
    parent: validatedRequest.path,
    type: [validatedRequest.type],
  });

  logger.info("gtm.builtinVariable.enable completed", {
    opId: envelope.opId,
    type: validatedRequest.type,
  });

  return {
    success: true,
    type: validatedRequest.type,
  };
}

/**
 * Get builtin variable enable tool input schema
 */
function getBuiltinVariableEnableToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
      type: {
        type: "string",
        description: "Built-in variable type (e.g., PAGE_URL, PAGE_HOSTNAME, CLICK_ELEMENT)",
      },
    },
    required: ["path", "type"],
  };
}

/**
 * Create builtin variable enable tool handler
 */
function createBuiltinVariableEnableToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof builtinVariableEnableResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeBuiltinVariableEnable(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.builtinVariable.enable failed", error);
      } else {
        logger.error("gtm.builtinVariable.enable failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.builtinVariable.enable tool
 */
function registerBuiltinVariableEnableTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.builtinVariable.enable",
    description: "Enable GTM built-in variable",
    inputSchema: getBuiltinVariableEnableToolSchema(),
    handler: createBuiltinVariableEnableToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute data layer validation
 * Validates data layer structure against schema generated from GTM variables
 */
/**
 * Helper: Get data layer validation schema
 */
async function getDataLayerValidationSchema(
  gtmClient: GTMClient,
  validatedRequest: z.infer<typeof datalayerValidateRequestSchema>
): Promise<z.ZodObject<Record<string, z.ZodTypeAny>>> {
  if (validatedRequest.schema) {
    return z.object({}) as z.ZodObject<Record<string, z.ZodTypeAny>>;
  }
  return await buildDataLayerSchemaFromVariables(gtmClient, validatedRequest.parent);
}

/**
 * Helper: Build Zod schema from data layer variables
 */
async function buildDataLayerSchemaFromVariables(
  gtmClient: GTMClient,
  parent: string
): Promise<z.ZodObject<Record<string, z.ZodTypeAny>>> {
  const tagManagerClient = gtmClient.getTagManagerClient();
  const variablesResponse = await tagManagerClient.accounts.containers.workspaces.variables.list({
    parent,
  });

  const variables = (variablesResponse as { data?: { variable?: unknown[] } }).data?.variable || [];
  const dataLayerVariables = variables.filter((v: unknown) => {
    const varObj = v as { type?: string; parameter?: unknown[] };
    return varObj.type === "v"; // Data layer variable type
  });

  const schemaShape: Record<string, z.ZodTypeAny> = {
    event: z.string(), // Always required
  };

  for (const variable of dataLayerVariables) {
    const varObj = variable as { name?: string; parameter?: unknown[] };
    if (varObj.name) {
      const dataLayerPath = varObj.parameter?.find(
        (p: unknown) => (p as { key?: string }).key === "dataLayerName"
      ) as { value?: string } | undefined;
      if (dataLayerPath?.value) {
        schemaShape[dataLayerPath.value] = z.unknown().optional();
      }
    }
  }

  return z.object(schemaShape);
}

/**
 * Helper: Validate data layer against schema and extract errors
 */
function validateDataLayerAgainstSchema(
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>,
  dataLayer: unknown
): {
  valid: boolean;
  errors?: Array<{ path: string; message: string; code?: string }>;
} {
  const validationResult = schema.safeParse(dataLayer);
  const errors: Array<{ path: string; message: string; code?: string }> = [];

  if (!validationResult.success) {
    for (const error of validationResult.error.errors) {
      errors.push({
        path: error.path.join("."),
        message: error.message,
        code: error.code,
      });
    }
  }

  return {
    valid: validationResult.success,
    ...(errors.length > 0 && { errors }),
  };
}

export async function executeDataLayerValidate(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof datalayerValidateResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.datalayer.validate",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.datalayer.validate", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(datalayerValidateRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "datalayer")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM data layer validation not available",
      {
        product: "gtm",
        capability: "datalayer",
      }
    );
  }

  await gtmClient.checkRateLimit("gtm", "datalayer.validate");

  const schema = await getDataLayerValidationSchema(gtmClient, validatedRequest);
  const { valid, errors } = validateDataLayerAgainstSchema(schema, validatedRequest.dataLayer);

  logger.info("gtm.datalayer.validate completed", {
    opId: envelope.opId,
    valid,
    errorCount: errors?.length || 0,
  });

  return {
    valid,
    errors,
    warnings: undefined,
  };
}

/**
 * Get data layer validate tool input schema
 */
function getDataLayerValidateToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
      dataLayer: {
        type: "object",
        description: "Data layer object to validate",
      },
      schema: {
        type: "object",
        description: "Optional explicit schema (if not provided, generated from GTM variables)",
      },
    },
    required: ["parent", "dataLayer"],
  };
}

/**
 * Create data layer validate tool handler
 */
function createDataLayerValidateToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof datalayerValidateResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeDataLayerValidate(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.datalayer.validate failed", error);
      } else {
        logger.error("gtm.datalayer.validate failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.datalayer.validate tool
 */
function registerDataLayerValidateTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.datalayer.validate",
    description: "Validate data layer structure against schema generated from GTM variables",
    inputSchema: getDataLayerValidateToolSchema(),
    handler: createDataLayerValidateToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute data layer schema generation
 * Generates schema from GTM data layer variable definitions
 */
/**
 * Helper: Get data layer variables from workspace
 */
async function getDataLayerVariables(
  gtmClient: GTMClient,
  parent: string
): Promise<unknown[]> {
  await gtmClient.checkRateLimit("gtm", "datalayer.schema.generate");
  const tagManagerClient = gtmClient.getTagManagerClient();
  const variablesResponse = await tagManagerClient.accounts.containers.workspaces.variables.list({
    parent,
  });
  const variables = (variablesResponse as { data?: { variable?: unknown[] } }).data?.variable || [];
  return variables.filter((v: unknown) => {
    const varObj = v as { type?: string };
    return varObj.type === "v"; // Data layer variable type
  });
}

/**
 * Helper: Build schema from data layer variables
 */
/**
 * Helper: Process data layer variable and add to schema
 */
function processDataLayerVariable(
  variable: unknown,
  schema: Record<string, unknown>,
  variableMetadata: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>
): void {
  const varObj = variable as {
    name?: string;
    type?: string;
    parameter?: unknown[];
    notes?: string;
  };
  if (varObj.name) {
    const dataLayerPath = varObj.parameter?.find(
      (p: unknown) => (p as { key?: string }).key === "dataLayerName"
    ) as { value?: string } | undefined;
    if (dataLayerPath?.value) {
      schema[dataLayerPath.value] = { type: "unknown", required: false };
      variableMetadata.push({
        name: dataLayerPath.value,
        type: "unknown",
        required: false,
        ...(varObj.notes && { description: varObj.notes }),
      });
    }
  }
}

function buildSchemaFromVariables(
  dataLayerVariables: unknown[]
): {
  schema: Record<string, unknown>;
  variables: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
} {
  const schema: Record<string, unknown> = {
    event: { type: "string", required: true },
  };
  const variableMetadata: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }> = [
    {
      name: "event",
      type: "string",
      required: true,
      description: "Event name",
    },
  ];

  for (const variable of dataLayerVariables) {
    processDataLayerVariable(variable, schema, variableMetadata);
  }

  return { schema, variables: variableMetadata };
}

export async function executeDataLayerSchemaGenerate(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof datalayerSchemaGenerateResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.datalayer.schema.generate",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.datalayer.schema.generate", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(datalayerSchemaGenerateRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "datalayer")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM data layer schema generation not available",
      {
        product: "gtm",
        capability: "datalayer",
      }
    );
  }

  const dataLayerVariables = await getDataLayerVariables(gtmClient, validatedRequest.parent);
  const { schema, variables } = buildSchemaFromVariables(dataLayerVariables);

  logger.info("gtm.datalayer.schema.generate completed", {
    opId: envelope.opId,
    variableCount: variables.length,
  });

  return {
    schema,
    variables,
  };
}

/**
 * Get data layer schema generate tool input schema
 */
function getDataLayerSchemaGenerateToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
      includeBuiltIn: {
        type: "boolean",
        description: "Include built-in variables in schema (default: false)",
      },
    },
    required: ["parent"],
  };
}

/**
 * Create data layer schema generate tool handler
 */
function createDataLayerSchemaGenerateToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof datalayerSchemaGenerateResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeDataLayerSchemaGenerate(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.datalayer.schema.generate failed", error);
      } else {
        logger.error("gtm.datalayer.schema.generate failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.datalayer.schema.generate tool
 */
function registerDataLayerSchemaGenerateTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.datalayer.schema.generate",
    description: "Generate data layer schema from GTM variable definitions",
    inputSchema: getDataLayerSchemaGenerateToolSchema(),
    handler: createDataLayerSchemaGenerateToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute data layer monitoring
 * Monitors data layer events in real-time and alerts on violations
 */
export async function executeDataLayerMonitor(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof datalayerMonitorResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.datalayer.monitor",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.datalayer.monitor", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(datalayerMonitorRequestSchema, args);

  // Check capabilities
  if (!capabilitiesRegistry.hasCapability("gtm", "datalayer")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM data layer monitoring not available",
      {
        product: "gtm",
        capability: "datalayer",
      }
    );
  }

  await gtmClient.checkRateLimit("gtm", "datalayer.monitor");

  // For now, monitoring is a placeholder that returns monitoring status
  // In a real implementation, this would set up event listeners or webhooks
  logger.info("gtm.datalayer.monitor completed", {
    opId: envelope.opId,
    eventName: validatedRequest.eventName,
  });

  return {
    monitoring: true,
    eventName: validatedRequest.eventName,
    alerts: [],
  };
}

/**
 * Get data layer monitor tool input schema
 */
function getDataLayerMonitorToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
      eventName: {
        type: "string",
        description: "Optional event name to monitor (if not provided, monitors all events)",
      },
    },
    required: ["parent"],
  };
}

/**
 * Create data layer monitor tool handler
 */
function createDataLayerMonitorToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof datalayerMonitorResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeDataLayerMonitor(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.datalayer.monitor failed", error);
      } else {
        logger.error("gtm.datalayer.monitor failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.datalayer.monitor tool
 */
function registerDataLayerMonitorTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.datalayer.monitor",
    description: "Monitor data layer events in real-time and alert on schema violations",
    inputSchema: getDataLayerMonitorToolSchema(),
    handler: createDataLayerMonitorToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute data layer events list
 * Lists all data layer events from GTM triggers
 */
/**
 * Helper: Get custom event triggers from workspace
 */
async function getCustomEventTriggers(
  gtmClient: GTMClient,
  parent: string
): Promise<unknown[]> {
  await gtmClient.checkRateLimit("gtm", "datalayer.events.list");
  const tagManagerClient = gtmClient.getTagManagerClient();
  const triggersResponse = await tagManagerClient.accounts.containers.workspaces.triggers.list({
    parent,
  });
  const triggers = (triggersResponse as { data?: { trigger?: unknown[] } }).data?.trigger || [];
  return triggers.filter((t: unknown) => {
    const triggerObj = t as { type?: string };
    return triggerObj.type === "customEvent";
  });
}

/**
 * Helper: Extract event names from custom event triggers
 */
/**
 * Helper: Extract event name from filter
 */
function extractEventNameFromFilter(
  filter: unknown
): string | null {
  const filterObj = filter as {
    type?: string;
    parameter?: unknown[];
  };
  if (filterObj.type === "equals" && filterObj.parameter) {
    const eventParam = filterObj.parameter.find(
      (p: unknown) => (p as { key?: string }).key === "arg1"
    ) as { value?: string } | undefined;
    return eventParam?.value || null;
  }
  return null;
}

/**
 * Helper: Build event object from trigger
 */
function buildEventFromTrigger(
  triggerObj: {
    name?: string;
    triggerId?: string;
    customEventFilter?: unknown[];
  },
  eventName: string
): {
  name: string;
  triggerName?: string;
  triggerId?: string;
  conditions?: unknown[];
} {
  const event: {
    name: string;
    triggerName?: string;
    triggerId?: string;
    conditions?: unknown[];
  } = {
    name: eventName,
  };
  if (triggerObj.name) {
    event.triggerName = triggerObj.name;
  }
  if (triggerObj.triggerId) {
    event.triggerId = triggerObj.triggerId;
  }
  if (triggerObj.customEventFilter) {
    event.conditions = triggerObj.customEventFilter;
  }
  return event;
}

function extractEventNamesFromTriggers(
  customEventTriggers: unknown[]
): Array<{
  name: string;
  triggerName?: string;
  triggerId?: string;
  conditions?: unknown[];
}> {
  const events: Array<{
    name: string;
    triggerName?: string;
    triggerId?: string;
    conditions?: unknown[];
  }> = [];

  for (const trigger of customEventTriggers) {
    const triggerObj = trigger as {
      name?: string;
      triggerId?: string;
      customEventFilter?: unknown[];
    };
    if (triggerObj.customEventFilter) {
      for (const filter of triggerObj.customEventFilter) {
        const eventName = extractEventNameFromFilter(filter);
        if (eventName) {
          events.push(buildEventFromTrigger(triggerObj, eventName));
          break;
        }
      }
    }
  }

  return events;
}

export async function executeDataLayerEventsList(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof datalayerEventsListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.datalayer.events.list",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.datalayer.events.list", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(datalayerEventsListRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "datalayer")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM data layer events list not available",
      {
        product: "gtm",
        capability: "datalayer",
      }
    );
  }

  const customEventTriggers = await getCustomEventTriggers(gtmClient, validatedRequest.parent);
  const events = extractEventNamesFromTriggers(customEventTriggers);

  logger.info("gtm.datalayer.events.list completed", {
    opId: envelope.opId,
    eventCount: events.length,
  });

  return {
    events,
  };
}

/**
 * Get data layer events list tool input schema
 */
function getDataLayerEventsListToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
    },
    required: ["parent"],
  };
}

/**
 * Create data layer events list tool handler
 */
function createDataLayerEventsListToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof datalayerEventsListResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeDataLayerEventsList(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.datalayer.events.list failed", error);
      } else {
        logger.error("gtm.datalayer.events.list failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.datalayer.events.list tool
 */
function registerDataLayerEventsListTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.datalayer.events.list",
    description: "List all data layer events from GTM custom event triggers",
    inputSchema: getDataLayerEventsListToolSchema(),
    handler: createDataLayerEventsListToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to list folders
 */
async function executeFolderListAPIRequest(
  validatedRequest: z.infer<typeof folderListRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof folderListResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "folder.list");
  const tagManagerClient = gtmClient.getTagManagerClient();
  const response = await tagManagerClient.accounts.containers.workspaces.folders.list({
    parent: validatedRequest.parent,
  });
  const folders = (response as { data?: { folder?: unknown[] } }).data?.folder || [];
  return {
    folders: folders as z.infer<typeof folderListResponseSchema>["folders"],
  };
}

/**
 * Execute folder list
 */
export async function executeFolderList(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof folderListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.folder.list",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.folder.list", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(folderListRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "admin_api")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM folder list not available",
      {
        product: "gtm",
        capability: "admin_api",
      }
    );
  }

  const result = await executeFolderListAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.folder.list completed", {
    opId: envelope.opId,
    folderCount: result.folders.length,
  });

  return result;
}

/**
 * Get folder list tool input schema
 */
function getFolderListToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
    },
    required: ["parent"],
  };
}

/**
 * Create folder list tool handler
 */
function createFolderListToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof folderListResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeFolderList(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.folder.list failed", error);
      } else {
        logger.error("gtm.folder.list failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.folder.list tool
 */
function registerFolderListTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.folder.list",
    description: "List folders in GTM workspace",
    inputSchema: getFolderListToolSchema(),
    handler: createFolderListToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to get folder
 */
async function executeFolderGetAPIRequest(
  validatedRequest: z.infer<typeof folderGetRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof folderGetResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "folder.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  const response = await tagManagerClient.accounts.containers.workspaces.folders.get({
    path: validatedRequest.path,
  });
  return (response as { data?: unknown }).data as z.infer<typeof folderGetResponseSchema>;
}

/**
 * Execute folder get
 */
export async function executeFolderGet(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof folderGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.folder.get",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.folder.get", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(folderGetRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "admin_api")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM folder get not available",
      {
        product: "gtm",
        capability: "admin_api",
      }
    );
  }

  const result = await executeFolderGetAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.folder.get completed", {
    opId: envelope.opId,
    folderId: result.folderId,
  });

  return result;
}

/**
 * Get folder get tool input schema
 */
function getFolderGetToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Folder path in format accounts/123456/containers/987654/workspaces/111111/folders/1",
      },
    },
    required: ["path"],
  };
}

/**
 * Create folder get tool handler
 */
function createFolderGetToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof folderGetResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeFolderGet(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.folder.get failed", error);
      } else {
        logger.error("gtm.folder.get failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.folder.get tool
 */
function registerFolderGetTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.folder.get",
    description: "Get folder by path",
    inputSchema: getFolderGetToolSchema(),
    handler: createFolderGetToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to upsert folder
 */
async function executeFolderUpsertAPIRequest(
  validatedRequest: z.infer<typeof folderUpsertRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof folderUpsertResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "folder.upsert");
  const tagManagerClient = gtmClient.getTagManagerClient();

  if (validatedRequest.folderId) {
    // Update existing folder
    const folderPath = `${validatedRequest.parent}/folders/${validatedRequest.folderId}`;
    const response = await tagManagerClient.accounts.containers.workspaces.folders.update({
      path: folderPath,
      requestBody: {
        name: validatedRequest.name,
      },
    });
    return (response as { data?: unknown }).data as z.infer<typeof folderUpsertResponseSchema>;
  } else {
    // Create new folder
    const response = await tagManagerClient.accounts.containers.workspaces.folders.create({
      parent: validatedRequest.parent,
      requestBody: {
        name: validatedRequest.name,
      },
    });
    return (response as { data?: unknown }).data as z.infer<typeof folderUpsertResponseSchema>;
  }
}

/**
 * Execute folder upsert
 */
export async function executeFolderUpsert(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof folderUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.folder.upsert",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.folder.upsert", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(folderUpsertRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "admin_api")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM folder upsert not available",
      {
        product: "gtm",
        capability: "admin_api",
      }
    );
  }

  const result = await executeFolderUpsertAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.folder.upsert completed", {
    opId: envelope.opId,
    folderId: result.folderId,
    name: result.name,
  });

  return result;
}

/**
 * Get folder upsert tool input schema
 */
function getFolderUpsertToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
      folderId: {
        type: "string",
        description: "Folder ID (if provided, updates existing folder)",
      },
      name: {
        type: "string",
        description: "Folder name",
      },
    },
    required: ["parent", "name"],
  };
}

/**
 * Create folder upsert tool handler
 */
function createFolderUpsertToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof folderUpsertResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeFolderUpsert(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.folder.upsert failed", error);
      } else {
        logger.error("gtm.folder.upsert failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.folder.upsert tool
 */
function registerFolderUpsertTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.folder.upsert",
    description: "Create or update folder in GTM workspace",
    inputSchema: getFolderUpsertToolSchema(),
    handler: createFolderUpsertToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to delete folder
 */
async function executeFolderDeleteAPIRequest(
  validatedRequest: z.infer<typeof folderDeleteRequestSchema>,
  gtmClient: GTMClient
): Promise<void> {
  await gtmClient.checkRateLimit("gtm", "folder.delete");
  const tagManagerClient = gtmClient.getTagManagerClient();
  await tagManagerClient.accounts.containers.workspaces.folders.delete({
    path: validatedRequest.path,
  });
}

/**
 * Execute folder delete
 */
export async function executeFolderDelete(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof folderDeleteResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.folder.delete",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.folder.delete", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(folderDeleteRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "admin_api")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM folder delete not available",
      {
        product: "gtm",
        capability: "admin_api",
      }
    );
  }

  await executeFolderDeleteAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.folder.delete completed", {
    opId: envelope.opId,
    path: validatedRequest.path,
  });

  return {
    success: true,
    path: validatedRequest.path,
  };
}

/**
 * Get folder delete tool input schema
 */
function getFolderDeleteToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Folder path in format accounts/123456/containers/987654/workspaces/111111/folders/1",
      },
    },
    required: ["path"],
  };
}

/**
 * Create folder delete tool handler
 */
function createFolderDeleteToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof folderDeleteResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeFolderDelete(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.folder.delete failed", error);
      } else {
        logger.error("gtm.folder.delete failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.folder.delete tool
 */
function registerFolderDeleteTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.folder.delete",
    description: "Delete folder from GTM workspace",
    inputSchema: getFolderDeleteToolSchema(),
    handler: createFolderDeleteToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to list versions
 */
async function executeVersionListAPIRequest(
  validatedRequest: z.infer<typeof versionListRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof versionListResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "version.list");
  const tagManagerClient = gtmClient.getTagManagerClient();
  const response = (await (tagManagerClient.accounts.containers.versions as unknown as {
    list?: (params: unknown) => Promise<{ data?: { version?: unknown[] } }>;
  }).list?.({
    parent: validatedRequest.parent,
  })) as { data?: { version?: unknown[] } };
  const versions = response.data?.version || [];
  return {
    versions: versions as z.infer<typeof versionListResponseSchema>["versions"],
  };
}

/**
 * Execute version list
 */
export async function executeVersionList(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof versionListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.version.list",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.version.list", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(versionListRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "admin_api")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM version list not available",
      {
        product: "gtm",
        capability: "admin_api",
      }
    );
  }

  const result = await executeVersionListAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.version.list completed", {
    opId: envelope.opId,
    versionCount: result.versions.length,
  });

  return result;
}

/**
 * Get version list tool input schema
 */
function getVersionListToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Container path in format accounts/123456/containers/987654",
      },
    },
    required: ["parent"],
  };
}

/**
 * Create version list tool handler
 */
function createVersionListToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof versionListResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeVersionList(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.version.list failed", error);
      } else {
        logger.error("gtm.version.list failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.version.list tool
 */
function registerVersionListTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.version.list",
    description: "List container versions",
    inputSchema: getVersionListToolSchema(),
    handler: createVersionListToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to get version
 */
async function executeVersionGetAPIRequest(
  validatedRequest: z.infer<typeof versionGetRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof versionGetResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "version.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  const response = await tagManagerClient.accounts.containers.versions.get({
    path: validatedRequest.path,
  });
  return (response as { data?: unknown }).data as z.infer<typeof versionGetResponseSchema>;
}

/**
 * Execute version get
 */
export async function executeVersionGet(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof versionGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.version.get",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.version.get", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(versionGetRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "admin_api")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM version get not available",
      {
        product: "gtm",
        capability: "admin_api",
      }
    );
  }

  const result = await executeVersionGetAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.version.get completed", {
    opId: envelope.opId,
    versionId: result.containerVersionId,
  });

  return result;
}

/**
 * Get version get tool input schema
 */
function getVersionGetToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Version path in format accounts/123456/containers/987654/versions/1",
      },
    },
    required: ["path"],
  };
}

/**
 * Create version get tool handler
 */
function createVersionGetToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof versionGetResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeVersionGet(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.version.get failed", error);
      } else {
        logger.error("gtm.version.get failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.version.get tool
 */
function registerVersionGetTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.version.get",
    description: "Get version details by path",
    inputSchema: getVersionGetToolSchema(),
    handler: createVersionGetToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to create version
 */
async function executeVersionCreateAPIRequest(
  validatedRequest: z.infer<typeof versionCreateRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof versionCreateResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "version.create");
  const tagManagerClient = gtmClient.getTagManagerClient();
  const response = (await (tagManagerClient.accounts.containers.versions as unknown as {
    create?: (params: unknown) => Promise<{ data?: z.infer<typeof versionCreateResponseSchema> }>;
  }).create?.({
    parent: validatedRequest.parent,
    requestBody: {
      name: validatedRequest.name,
      notes: validatedRequest.notes,
    },
  })) as { data?: z.infer<typeof versionCreateResponseSchema> };
  return response.data as z.infer<typeof versionCreateResponseSchema>;
}

/**
 * Execute version create
 */
export async function executeVersionCreate(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof versionCreateResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.version.create",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.version.create", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(versionCreateRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "admin_api")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM version create not available",
      {
        product: "gtm",
        capability: "admin_api",
      }
    );
  }

  const result = await executeVersionCreateAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.version.create completed", {
    opId: envelope.opId,
    versionId: result.containerVersionId,
    name: result.name,
  });

  return result;
}

/**
 * Get version create tool input schema
 */
function getVersionCreateToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Container path in format accounts/123456/containers/987654",
      },
      workspaceId: {
        type: "string",
        description: "Workspace ID",
      },
      name: {
        type: "string",
        description: "Version name",
      },
      notes: {
        type: "string",
        description: "Optional version notes",
      },
    },
    required: ["parent", "workspaceId", "name"],
  };
}

/**
 * Create version create tool handler
 */
function createVersionCreateToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof versionCreateResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeVersionCreate(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.version.create failed", error);
      } else {
        logger.error("gtm.version.create failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.version.create tool
 */
function registerVersionCreateTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.version.create",
    description: "Create version from workspace",
    inputSchema: getVersionCreateToolSchema(),
    handler: createVersionCreateToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to restore version
 */
async function executeVersionRestoreAPIRequest(
  validatedRequest: z.infer<typeof versionRestoreRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof versionRestoreResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "version.restore");
  const tagManagerClient = gtmClient.getTagManagerClient();
  const response = (await (tagManagerClient.accounts.containers.versions as unknown as {
    restore?: (params: unknown) => Promise<{ data?: z.infer<typeof versionRestoreResponseSchema> }>;
  }).restore?.({
    path: validatedRequest.path,
  })) as { data?: z.infer<typeof versionRestoreResponseSchema> };
  return response.data as z.infer<typeof versionRestoreResponseSchema>;
}

/**
 * Execute version restore
 */
export async function executeVersionRestore(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof versionRestoreResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.version.restore",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.version.restore", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(versionRestoreRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "admin_api")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM version restore not available",
      {
        product: "gtm",
        capability: "admin_api",
      }
    );
  }

  const result = await executeVersionRestoreAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.version.restore completed", {
    opId: envelope.opId,
    versionId: result.containerVersionId,
  });

  return result;
}

/**
 * Get version restore tool input schema
 */
function getVersionRestoreToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Version path in format accounts/123456/containers/987654/versions/1",
      },
    },
    required: ["path"],
  };
}

/**
 * Create version restore tool handler
 */
function createVersionRestoreToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof versionRestoreResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeVersionRestore(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.version.restore failed", error);
      } else {
        logger.error("gtm.version.restore failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.version.restore tool
 */
function registerVersionRestoreTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.version.restore",
    description: "Restore version to workspace",
    inputSchema: getVersionRestoreToolSchema(),
    handler: createVersionRestoreToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to publish workspace
 */
async function executeWorkspacePublishAPIRequest(
  validatedRequest: z.infer<typeof workspacePublishRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof workspacePublishResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "workspace.publish");
  const tagManagerClient = gtmClient.getTagManagerClient();

  // Get workspace fingerprint if not provided
  let fingerprint = validatedRequest.fingerprint;
  if (!fingerprint) {
    const workspaceResponse = (await (tagManagerClient.accounts.containers.workspaces as unknown as {
      get?: (params: unknown) => Promise<{ data?: { fingerprint?: string } }>;
    }).get?.({
      path: validatedRequest.path,
    })) as { data?: { fingerprint?: string } };
    fingerprint = workspaceResponse.data?.fingerprint;
  }

  const response = (await (tagManagerClient.accounts.containers.workspaces as unknown as {
    publish?: (params: unknown) => Promise<{ data?: z.infer<typeof workspacePublishResponseSchema> }>;
  }).publish?.({
    path: validatedRequest.path,
    requestBody: {
      fingerprint: fingerprint || "",
    },
  })) as { data?: z.infer<typeof workspacePublishResponseSchema> };
  return response.data as z.infer<typeof workspacePublishResponseSchema>;
}

/**
 * Execute workspace publish
 */
export async function executeWorkspacePublish(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof workspacePublishResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.workspace.publish",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.workspace.publish", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(workspacePublishRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "admin_api")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM workspace publish not available",
      {
        product: "gtm",
        capability: "admin_api",
      }
    );
  }

  const result = await executeWorkspacePublishAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.workspace.publish completed", {
    opId: envelope.opId,
    containerVersionId: result.containerVersionId,
  });

  return result;
}

/**
 * Get workspace publish tool input schema
 */
function getWorkspacePublishToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
      },
      fingerprint: {
        type: "string",
        description: "Optional fingerprint for optimistic locking (if not provided, fetched from workspace)",
      },
    },
    required: ["path"],
  };
}

/**
 * Create workspace publish tool handler
 */
function createWorkspacePublishToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof workspacePublishResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeWorkspacePublish(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.workspace.publish failed", error);
      } else {
        logger.error("gtm.workspace.publish failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.workspace.publish tool
 */
function registerWorkspacePublishTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.workspace.publish",
    description: "Publish workspace to create a new container version",
    inputSchema: getWorkspacePublishToolSchema(),
    handler: createWorkspacePublishToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to create preview environment
 */
async function executePreviewCreateAPIRequest(
  validatedRequest: z.infer<typeof previewCreateRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof previewCreateResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "preview.create");
  const tagManagerClient = gtmClient.getTagManagerClient();

  // Create a version from the workspace first
  const versionResponse = (await (tagManagerClient.accounts.containers.versions as unknown as {
    create?: (params: unknown) => Promise<{ data?: { containerVersionId?: string } }>;
  }).create?.({
    parent: validatedRequest.parent,
    requestBody: {
      name: `Preview for workspace ${validatedRequest.workspaceId}`,
    },
  })) as { data?: { containerVersionId?: string } };

  const containerVersionId = versionResponse.data?.containerVersionId;

  // Create preview environment
  const response = (await (tagManagerClient.accounts.containers.environments as unknown as {
    create?: (params: unknown) => Promise<{
      data?: {
        environmentId?: string;
        authorizationCode?: string;
      };
    }>;
  }).create?.({
    parent: validatedRequest.parent,
    requestBody: {
      name: "Preview Environment",
      type: "PREVIEW",
      containerVersionId: containerVersionId,
    },
  })) as {
    data?: {
      environmentId?: string;
      authorizationCode?: string;
    };
  };

  return {
    environmentId: response.data?.environmentId,
    authorizationCode: response.data?.authorizationCode,
    containerVersionId: containerVersionId,
  };
}

/**
 * Execute preview create
 */
export async function executePreviewCreate(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof previewCreateResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.preview.create",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.preview.create", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(previewCreateRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "admin_api")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM preview create not available",
      {
        product: "gtm",
        capability: "admin_api",
      }
    );
  }

  const result = await executePreviewCreateAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.preview.create completed", {
    opId: envelope.opId,
    environmentId: result.environmentId,
  });

  return result;
}

/**
 * Get preview create tool input schema
 */
function getPreviewCreateToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "Container path in format accounts/123456/containers/987654",
      },
      workspaceId: {
        type: "string",
        description: "Workspace ID",
      },
    },
    required: ["parent", "workspaceId"],
  };
}

/**
 * Create preview create tool handler
 */
function createPreviewCreateToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof previewCreateResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executePreviewCreate(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.preview.create failed", error);
      } else {
        logger.error("gtm.preview.create failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.preview.create tool
 */
function registerPreviewCreateTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.preview.create",
    description: "Create preview environment for testing workspace changes",
    inputSchema: getPreviewCreateToolSchema(),
    handler: createPreviewCreateToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to get preview environment
 */
async function executePreviewGetAPIRequest(
  validatedRequest: z.infer<typeof previewGetRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof previewGetResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "preview.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  const response = (await (tagManagerClient.accounts.containers.environments as unknown as {
    get?: (params: unknown) => Promise<{ data?: z.infer<typeof previewGetResponseSchema> }>;
  }).get?.({
    path: validatedRequest.path,
  })) as { data?: z.infer<typeof previewGetResponseSchema> };
  return response.data as z.infer<typeof previewGetResponseSchema>;
}

/**
 * Execute preview get
 */
export async function executePreviewGet(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof previewGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.preview.get",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.preview.get", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(previewGetRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "admin_api")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM preview get not available",
      {
        product: "gtm",
        capability: "admin_api",
      }
    );
  }

  const result = await executePreviewGetAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.preview.get completed", {
    opId: envelope.opId,
    environmentId: result.environmentId,
  });

  return result;
}

/**
 * Get preview get tool input schema
 */
function getPreviewGetToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Environment path in format accounts/123456/containers/987654/environments/env1",
      },
    },
    required: ["path"],
  };
}

/**
 * Create preview get tool handler
 */
function createPreviewGetToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof previewGetResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executePreviewGet(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.preview.get failed", error);
      } else {
        logger.error("gtm.preview.get failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.preview.get tool
 */
function registerPreviewGetTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.preview.get",
    description: "Get preview environment details",
    inputSchema: getPreviewGetToolSchema(),
    handler: createPreviewGetToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to configure consent mode
 */
/**
 * Helper: Get container fingerprint
 */
async function getContainerFingerprint(
  tagManagerClient: ReturnType<GTMClient["getTagManagerClient"]>,
  path: string
): Promise<string> {
  const containerResponse = (await (tagManagerClient.accounts.containers as unknown as {
    get?: (params: unknown) => Promise<{ data?: { fingerprint?: string } }>;
  }).get?.({
    path,
  })) as { data?: { fingerprint?: string } };
  return containerResponse.data?.fingerprint || "";
}

/**
 * Helper: Build consent configure request body
 */
function buildConsentConfigureRequestBody(
  fingerprint: string,
  validatedRequest: z.infer<typeof consentConfigureRequestSchema>
): Record<string, unknown> {
  const requestBody: Record<string, unknown> = {
    fingerprint,
    consentModeEnabled: validatedRequest.enabled,
  };
  if (validatedRequest.settings) {
    requestBody.consentModeSettings = validatedRequest.settings;
  }
  return requestBody;
}

async function executeConsentConfigureAPIRequest(
  validatedRequest: z.infer<typeof consentConfigureRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof consentConfigureResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "consent.configure");
  const tagManagerClient = gtmClient.getTagManagerClient();

  const fingerprint = await getContainerFingerprint(tagManagerClient, validatedRequest.path);
  const requestBody = buildConsentConfigureRequestBody(fingerprint, validatedRequest);

  const response = (await (tagManagerClient.accounts.containers as unknown as {
    update?: (params: unknown) => Promise<{
      data?: {
        consentModeEnabled?: boolean;
        consentModeSettings?: z.infer<typeof consentModeSettingsSchema>;
      };
    }>;
  }).update?.({
    path: validatedRequest.path,
    requestBody,
  })) as {
    data?: {
      consentModeEnabled?: boolean;
      consentModeSettings?: z.infer<typeof consentModeSettingsSchema>;
    };
  };

  return {
    enabled: response.data?.consentModeEnabled ?? false,
    settings: response.data?.consentModeSettings,
  };
}

/**
 * Execute consent configure
 */
export async function executeConsentConfigure(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof consentConfigureResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.consent.configure",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.consent.configure", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(consentConfigureRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "admin_api")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM consent configure not available",
      {
        product: "gtm",
        capability: "admin_api",
      }
    );
  }

  const result = await executeConsentConfigureAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.consent.configure completed", {
    opId: envelope.opId,
    enabled: result.enabled,
  });

  return result;
}

/**
 * Get consent configure tool input schema
 */
/**
 * Helper: Get consent mode settings schema
 */
function getConsentModeSettingsSchema(): Record<string, unknown> {
  return {
    ad_storage: {
      type: "string",
      enum: ["granted", "denied", "pending"],
      description: "Ad storage consent state",
    },
    analytics_storage: {
      type: "string",
      enum: ["granted", "denied", "pending"],
      description: "Analytics storage consent state",
    },
    functionality_storage: {
      type: "string",
      enum: ["granted", "denied", "pending"],
      description: "Functionality storage consent state",
    },
    personalization_storage: {
      type: "string",
      enum: ["granted", "denied", "pending"],
      description: "Personalization storage consent state",
    },
    security_storage: {
      type: "string",
      enum: ["granted", "denied", "pending"],
      description: "Security storage consent state",
    },
  };
}

function getConsentConfigureToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Container path in format accounts/123456/containers/987654",
      },
      enabled: {
        type: "boolean",
        description: "Enable or disable consent mode",
      },
      settings: {
        type: "object",
        description: "Consent mode settings (ad_storage, analytics_storage, etc.)",
        properties: getConsentModeSettingsSchema(),
      },
    },
    required: ["path", "enabled"],
  };
}

/**
 * Create consent configure tool handler
 */
function createConsentConfigureToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof consentConfigureResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeConsentConfigure(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.consent.configure failed", error);
      } else {
        logger.error("gtm.consent.configure failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.consent.configure tool
 */
function registerConsentConfigureTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.consent.configure",
    description: "Configure GTM consent mode settings for a container",
    inputSchema: getConsentConfigureToolSchema(),
    handler: createConsentConfigureToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to get consent mode configuration
 */
async function executeConsentGetAPIRequest(
  validatedRequest: z.infer<typeof consentGetRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof consentGetResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "consent.get");
  const tagManagerClient = gtmClient.getTagManagerClient();

  const response = (await (tagManagerClient.accounts.containers as unknown as {
    get?: (params: unknown) => Promise<{
      data?: {
        consentModeEnabled?: boolean;
        consentModeSettings?: z.infer<typeof consentModeSettingsSchema>;
      };
    }>;
  }).get?.({
    path: validatedRequest.path,
  })) as {
    data?: {
      consentModeEnabled?: boolean;
      consentModeSettings?: z.infer<typeof consentModeSettingsSchema>;
    };
  };

  return {
    enabled: response.data?.consentModeEnabled ?? false,
    settings: response.data?.consentModeSettings,
  };
}

/**
 * Execute consent get
 */
export async function executeConsentGet(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof consentGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.consent.get",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.consent.get", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(consentGetRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "admin_api")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM consent get not available",
      {
        product: "gtm",
        capability: "admin_api",
      }
    );
  }

  const result = await executeConsentGetAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.consent.get completed", {
    opId: envelope.opId,
    enabled: result.enabled,
  });

  return result;
}

/**
 * Get consent get tool input schema
 */
function getConsentGetToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Container path in format accounts/123456/containers/987654",
      },
    },
    required: ["path"],
  };
}

/**
 * Create consent get tool handler
 */
function createConsentGetToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof consentGetResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeConsentGet(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.consent.get failed", error);
      } else {
        logger.error("gtm.consent.get failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.consent.get tool
 */
function registerConsentGetTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.consent.get",
    description: "Get GTM consent mode configuration for a container",
    inputSchema: getConsentGetToolSchema(),
    handler: createConsentGetToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}


/**
 * Execute API request to update tag sequencing
 */
/**
 * Helper: Get tag fingerprint
 */
async function getTagFingerprint(
  tagManagerClient: ReturnType<GTMClient["getTagManagerClient"]>,
  path: string
): Promise<string> {
  const tagResponse = (await (tagManagerClient.accounts.containers.workspaces.tags as unknown as {
    get?: (params: unknown) => Promise<{ data?: { fingerprint?: string } }>;
  }).get?.({
    path,
  })) as { data?: { fingerprint?: string } };
  return tagResponse.data?.fingerprint || "";
}

/**
 * Helper: Build tag sequence update request body
 */
function buildTagSequenceUpdateRequestBody(
  currentTag: z.infer<typeof tagGetResponseSchema> | undefined,
  fingerprint: string,
  validatedRequest: z.infer<typeof tagSequenceUpdateRequestSchema>
): Record<string, unknown> {
  const requestBody: Record<string, unknown> = { fingerprint };

  if (currentTag) {
    if (currentTag.name) requestBody.name = currentTag.name;
    if (currentTag.type) requestBody.type = currentTag.type;
    if (currentTag.parameter) requestBody.parameter = currentTag.parameter;
    if (currentTag.firingTriggerId) requestBody.firingTriggerId = currentTag.firingTriggerId;
  }

  if (validatedRequest.blockingTriggerId !== undefined) {
    requestBody.blockingTriggerId = validatedRequest.blockingTriggerId;
  }
  if (validatedRequest.setupTagId !== undefined) {
    requestBody.setupTagId = validatedRequest.setupTagId;
  }
  if (validatedRequest.teardownTagId !== undefined) {
    requestBody.teardownTagId = validatedRequest.teardownTagId;
  }
  if (validatedRequest.tagFiringOption !== undefined) {
    requestBody.tagFiringOption = validatedRequest.tagFiringOption;
  }

  return requestBody;
}

async function executeTagSequenceUpdateAPIRequest(
  validatedRequest: z.infer<typeof tagSequenceUpdateRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof tagSequenceUpdateResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "tag.sequence.update");
  const tagManagerClient = gtmClient.getTagManagerClient();

  const fingerprint = await getTagFingerprint(tagManagerClient, validatedRequest.path);

  const fullTagResponse = (await (tagManagerClient.accounts.containers.workspaces.tags as unknown as {
    get?: (params: unknown) => Promise<{ data?: z.infer<typeof tagGetResponseSchema> }>;
  }).get?.({
    path: validatedRequest.path,
  })) as { data?: z.infer<typeof tagGetResponseSchema> };

  const currentTag = fullTagResponse.data;
  const requestBody = buildTagSequenceUpdateRequestBody(currentTag, fingerprint, validatedRequest);

  const response = (await (tagManagerClient.accounts.containers.workspaces.tags as unknown as {
    update?: (params: unknown) => Promise<{ data?: z.infer<typeof tagSequenceUpdateResponseSchema> }>;
  }).update?.({
    path: validatedRequest.path,
    requestBody,
  })) as { data?: z.infer<typeof tagSequenceUpdateResponseSchema> };

  return response.data as z.infer<typeof tagSequenceUpdateResponseSchema>;
}

/**
 * Execute tag sequence update
 */
export async function executeTagSequenceUpdate(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof tagSequenceUpdateResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.tag.sequence.update",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.tag.sequence.update", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(tagSequenceUpdateRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "admin_api")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM tag sequence update not available",
      {
        product: "gtm",
        capability: "admin_api",
      }
    );
  }

  const result = await executeTagSequenceUpdateAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.tag.sequence.update completed", {
    opId: envelope.opId,
    tagId: result.tagId,
  });

  return result;
}

/**
 * Get tag sequence update tool input schema
 */
function getTagSequenceUpdateToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Tag path in format accounts/123456/containers/987654/workspaces/111111/tags/tag1",
      },
      blockingTriggerId: {
        type: "array",
        items: { type: "string" },
        description: "Trigger IDs that must fire before this tag",
      },
      setupTagId: {
        type: "array",
        items: { type: "string" },
        description: "Tag IDs that must fire before this tag",
      },
      teardownTagId: {
        type: "array",
        items: { type: "string" },
        description: "Tag IDs that must fire after this tag",
      },
      tagFiringOption: {
        type: "string",
        enum: ["UNLIMITED", "ONCE_PER_EVENT", "ONCE_PER_LOAD"],
        description: "Tag firing option",
      },
    },
    required: ["path"],
  };
}

/**
 * Create tag sequence update tool handler
 */
function createTagSequenceUpdateToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof tagSequenceUpdateResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeTagSequenceUpdate(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.tag.sequence.update failed", error);
      } else {
        logger.error("gtm.tag.sequence.update failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.tag.sequence.update tool
 */
function registerTagSequenceUpdateTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.tag.sequence.update",
    description: "Update tag sequencing settings (blocking triggers, setup/teardown tags, firing options)",
    inputSchema: getTagSequenceUpdateToolSchema(),
    handler: createTagSequenceUpdateToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}

/**
 * Execute API request to update tag priority
 */
async function executeTagPriorityUpdateAPIRequest(
  validatedRequest: z.infer<typeof tagPriorityUpdateRequestSchema>,
  gtmClient: GTMClient
): Promise<z.infer<typeof tagPriorityUpdateResponseSchema>> {
  await gtmClient.checkRateLimit("gtm", "tag.priority.update");
  const tagManagerClient = gtmClient.getTagManagerClient();

  // Get current tag to retrieve fingerprint
  const tagResponse = (await (tagManagerClient.accounts.containers.workspaces.tags as unknown as {
    get?: (params: unknown) => Promise<{ data?: { fingerprint?: string } }>;
  }).get?.({
    path: validatedRequest.path,
  })) as { data?: { fingerprint?: string } };

  const fingerprint = tagResponse.data?.fingerprint || "";

  // Get full tag data to preserve existing fields
  const fullTagResponse = (await (tagManagerClient.accounts.containers.workspaces.tags as unknown as {
    get?: (params: unknown) => Promise<{ data?: z.infer<typeof tagGetResponseSchema> }>;
  }).get?.({
    path: validatedRequest.path,
  })) as { data?: z.infer<typeof tagGetResponseSchema> };

  const currentTag = fullTagResponse.data;

  // Build update request body, preserving existing fields
  const requestBody: Record<string, unknown> = {
    fingerprint,
    priority: validatedRequest.priority,
  };

  // Preserve existing fields
  if (currentTag) {
    if (currentTag.name) requestBody.name = currentTag.name;
    if (currentTag.type) requestBody.type = currentTag.type;
    if (currentTag.parameter) requestBody.parameter = currentTag.parameter;
    if (currentTag.firingTriggerId) requestBody.firingTriggerId = currentTag.firingTriggerId;
    if (currentTag.blockingTriggerId) requestBody.blockingTriggerId = currentTag.blockingTriggerId;
    if (currentTag.tagFiringOption) requestBody.tagFiringOption = currentTag.tagFiringOption;
  }

  const response = (await (tagManagerClient.accounts.containers.workspaces.tags as unknown as {
    update?: (params: unknown) => Promise<{ data?: z.infer<typeof tagPriorityUpdateResponseSchema> }>;
  }).update?.({
    path: validatedRequest.path,
    requestBody,
  })) as { data?: z.infer<typeof tagPriorityUpdateResponseSchema> };

  return response.data as z.infer<typeof tagPriorityUpdateResponseSchema>;
}

/**
 * Execute tag priority update
 */
export async function executeTagPriorityUpdate(
  args: unknown,
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof tagPriorityUpdateResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "gtm.tag.priority.update",
    actor: "user",
    target: { product: "gtm" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing gtm.tag.priority.update", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(tagPriorityUpdateRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("gtm", "admin_api")) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM tag priority update not available",
      {
        product: "gtm",
        capability: "admin_api",
      }
    );
  }

  const result = await executeTagPriorityUpdateAPIRequest(validatedRequest, gtmClient);

  logger.info("gtm.tag.priority.update completed", {
    opId: envelope.opId,
    tagId: result.tagId,
    priority: result.priority,
  });

  return result;
}

/**
 * Get tag priority update tool input schema
 */
function getTagPriorityUpdateToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Tag path in format accounts/123456/containers/987654/workspaces/111111/tags/tag1",
      },
      priority: {
        type: "number",
        description: "Tag priority (higher numbers fire first, can be negative)",
      },
    },
    required: ["path", "priority"],
  };
}

/**
 * Create tag priority update tool handler
 */
function createTagPriorityUpdateToolHandler(
  gtmClient: GTMClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): (args: unknown) => Promise<z.infer<typeof tagPriorityUpdateResponseSchema>> {
  return async (args: unknown) => {
    try {
      return await executeTagPriorityUpdate(args, gtmClient, capabilitiesRegistry, logger);
    } catch (error) {
      if (error instanceof Error) {
        logger.error("gtm.tag.priority.update failed", error);
      } else {
        logger.error("gtm.tag.priority.update failed", new Error(String(error)));
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  };
}

/**
 * Register gtm.tag.priority.update tool
 */
function registerTagPriorityUpdateTool(
  bootstrap: MCPServerBootstrap,
  gtmClient: GTMClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "gtm.tag.priority.update",
    description: "Update tag priority (higher numbers fire first)",
    inputSchema: getTagPriorityUpdateToolSchema(),
    handler: createTagPriorityUpdateToolHandler(gtmClient, capabilitiesRegistry, logger),
  });
}
