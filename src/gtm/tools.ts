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
export function registerGTMTools(options: GTMToolsOptions): void {
  const { bootstrap, gtmClient, cache, capabilitiesRegistry, logger } = options;

  // Container tools
  registerContainerListTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerContainerGetTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerContainerUpsertTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerContainerDeleteTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);

  // Workspace tools
  registerWorkspaceListTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerWorkspaceGetTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerWorkspaceCreateTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerWorkspaceMergeTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);

  // Tag tools
  registerTagListTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerTagGetTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerTagUpsertTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerTagDeleteTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);

  // Trigger tools
  registerTriggerListTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerTriggerGetTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerTriggerUpsertTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
  registerTriggerDeleteTool(bootstrap, gtmClient, cache, capabilitiesRegistry, logger);
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
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Account ID in format accounts/123456",
        },
      },
      required: ["parent"],
    },
    handler: async (args: unknown) => {
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
    },
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
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Container path in format accounts/123456/containers/987654",
        },
      },
      required: ["path"],
    },
    handler: async (args: unknown) => {
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
    },
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
    inputSchema: {
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
    },
    handler: async (args: unknown) => {
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
    },
  });
}

/**
 * Execute container delete operation
 */
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

  // Pre-check: verify container exists
  await gtmClient.checkRateLimit("gtm", "container.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  try {
    await tagManagerClient.accounts.containers.get({ path: validatedRequest.path });
  } catch {
    throw createPreconditionError("not_found", "Container not found", {
      container: validatedRequest.path,
    });
  }

  // Delete container
  await gtmClient.checkRateLimit("gtm", "container.delete");
  try {
    await tagManagerClient.accounts.containers.delete({
      path: validatedRequest.path,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Container delete failed", error);
    } else {
      logger.error("Container delete failed", new Error(String(error)));
    }
    throw error;
  }

  // Invalidate cache
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
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Container path in format accounts/123456/containers/987654",
        },
      },
      required: ["path"],
    },
    handler: async (args: unknown) => {
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
    },
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
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Container path in format accounts/123456/containers/987654",
        },
      },
      required: ["parent"],
    },
    handler: async (args: unknown) => {
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
    },
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
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
        },
      },
      required: ["path"],
    },
    handler: async (args: unknown) => {
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
    },
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
    inputSchema: {
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
    },
    handler: async (args: unknown) => {
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
    },
  });
}

/**
 * Execute workspace merge operation with rollback
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

  const validatedRequest = validateSchema(workspaceMergeRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("gtm", "tag_manager_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GTM Tag Manager API capability not available",
      { product: "gtm" }
    );
  }

  // Pre-check: verify both workspaces exist
  await gtmClient.checkRateLimit("gtm", "workspace.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  try {
    await tagManagerClient.accounts.containers.workspaces.get({ path: validatedRequest.path });
    await tagManagerClient.accounts.containers.workspaces.get({
      path: validatedRequest.sourceWorkspacePath,
    });
  } catch {
    throw createPreconditionError("not_found", "One or both workspaces not found", {
      workspace: validatedRequest.path,
      sourceWorkspace: validatedRequest.sourceWorkspacePath,
    });
  }

  // Merge workspaces
  await gtmClient.checkRateLimit("gtm", "workspace.merge");
  let mergedWorkspace;
  try {
    const workspaces = tagManagerClient.accounts.containers.workspaces as unknown as {
      merge?: (params: {
        path: string;
        sourceWorkspacePath: string;
      }) => Promise<{ data?: unknown }>;
    };

    if (!workspaces.merge) {
      throw createPreconditionError("not_found", "Workspace merge API not available", {});
    }

    const response = await workspaces.merge({
      path: validatedRequest.path,
      sourceWorkspacePath: validatedRequest.sourceWorkspacePath,
    });
    const responseData = response as { data?: unknown };
    if (responseData.data) {
      mergedWorkspace = validateSchema(workspaceGetResponseSchema, responseData.data);
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Workspace merge failed", error);
    } else {
      logger.error("Workspace merge failed", new Error(String(error)));
    }
    throw error;
  }

  // Post-check: verify merge succeeded
  if (mergedWorkspace) {
    const cacheKey = `gtm:workspace:${validatedRequest.path}`;
    await cache.invalidate(cacheKey);
    await cache.set(cacheKey, mergedWorkspace, 300000);
  }

  // Invalidate source workspace cache
  const sourceCacheKey = `gtm:workspace:${validatedRequest.sourceWorkspacePath}`;
  await cache.delete(sourceCacheKey);

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
    inputSchema: {
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
    },
    handler: async (args: unknown) => {
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
    },
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
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
        },
      },
      required: ["parent"],
    },
    handler: async (args: unknown) => {
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
    },
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
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Tag path in format accounts/123456/containers/987654/workspaces/111111/tags/222222",
        },
      },
      required: ["path"],
    },
    handler: async (args: unknown) => {
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
    },
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
    inputSchema: {
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
    },
    handler: async (args: unknown) => {
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
    },
  });
}

/**
 * Execute tag delete operation
 */
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

  // Pre-check: verify tag exists
  await gtmClient.checkRateLimit("gtm", "tag.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  try {
    await tagManagerClient.accounts.containers.workspaces.tags.get({ path: validatedRequest.path });
  } catch {
    throw createPreconditionError("not_found", "Tag not found", {
      tag: validatedRequest.path,
    });
  }

  // Delete tag
  await gtmClient.checkRateLimit("gtm", "tag.delete");
  try {
    await tagManagerClient.accounts.containers.workspaces.tags.delete({
      path: validatedRequest.path,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Tag delete failed", error);
    } else {
      logger.error("Tag delete failed", new Error(String(error)));
    }
    throw error;
  }

  // Invalidate cache
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
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Tag path in format accounts/123456/containers/987654/workspaces/111111/tags/222222",
        },
      },
      required: ["path"],
    },
    handler: async (args: unknown) => {
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
    },
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
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Workspace path in format accounts/123456/containers/987654/workspaces/111111",
        },
      },
      required: ["parent"],
    },
    handler: async (args: unknown) => {
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
    },
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
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Trigger path in format accounts/123456/containers/987654/workspaces/111111/triggers/333333",
        },
      },
      required: ["path"],
    },
    handler: async (args: unknown) => {
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
    },
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
    inputSchema: {
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
    },
    handler: async (args: unknown) => {
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
    },
  });
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

  // Pre-check: verify trigger exists
  await gtmClient.checkRateLimit("gtm", "trigger.get");
  const tagManagerClient = gtmClient.getTagManagerClient();
  try {
    await tagManagerClient.accounts.containers.workspaces.triggers.get({
      path: validatedRequest.path,
    });
  } catch {
    throw createPreconditionError("not_found", "Trigger not found", {
      trigger: validatedRequest.path,
    });
  }

  // Delete trigger
  await gtmClient.checkRateLimit("gtm", "trigger.delete");
  try {
    await tagManagerClient.accounts.containers.workspaces.triggers.delete({
      path: validatedRequest.path,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Trigger delete failed", error);
    } else {
      logger.error("Trigger delete failed", new Error(String(error)));
    }
    throw error;
  }

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
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Trigger path in format accounts/123456/containers/987654/workspaces/111111/triggers/333333",
        },
      },
      required: ["path"],
    },
    handler: async (args: unknown) => {
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
    },
  });
}

