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

