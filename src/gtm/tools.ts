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

