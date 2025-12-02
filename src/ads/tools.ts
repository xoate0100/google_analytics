/**
 * Google Ads tools registration
 * Registers Google Ads API tools with the MCP server
 */

import { z } from "zod";
import type { MCPServerBootstrap } from "../server/bootstrap.js";
import type { AdsClient } from "./client.js";
import type { ILogger, ICache } from "../core/types.js";
import type { ICapabilitiesRegistry } from "../core/types.js";
import {
  gaqlQueryRequestSchema,
  gaqlQueryResponseSchema,
  gaqlBatchRequestSchema,
  gaqlBatchResponseSchema,
  gaqlStreamRequestSchema,
  gaqlStreamResponseSchema,
  campaignListRequestSchema,
  campaignListResponseSchema,
  campaignGetRequestSchema,
  campaignGetResponseSchema,
  campaignUpsertRequestSchema,
  campaignUpsertResponseSchema,
  campaignPauseRequestSchema,
  campaignPauseResponseSchema,
} from "./schemas.js";
import { validateSchema } from "../core/validation.js";
import { createOperationEnvelope } from "../core/envelope.js";
import { createPreconditionError } from "../core/errors.js";

/**
 * Execute API request for GAQL query
 */
async function executeGAQLQueryAPIRequest(
  validatedRequest: z.infer<typeof gaqlQueryRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof gaqlQueryResponseSchema>> {
  await adsClient.checkRateLimit("ads", "report.gaql");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: unknown[];
      fieldMask?: string;
      requestId?: string;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  // Build query with optional limit
  let query = validatedRequest.query;
  if (validatedRequest.limit && !query.toUpperCase().includes("LIMIT")) {
    query = `${query} LIMIT ${validatedRequest.limit}`;
  }

  const response = (await googleAdsClient.search?.({
    customerId,
    query,
    validateOnly: validatedRequest.validateOnly || false,
  })) as {
    results?: unknown[];
    fieldMask?: string;
    requestId?: string;
  };

  return {
    results: (response.results || []) as z.infer<typeof gaqlQueryResponseSchema>["results"],
    fieldMask: response.fieldMask,
    requestId: response.requestId,
  };
}

/**
 * Execute GAQL report
 */
export async function executeGAQLReport(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof gaqlQueryResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.report.gaql",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.report.gaql", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(gaqlQueryRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "reporting")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads reporting not available",
      {
        product: "ads",
        capability: "reporting",
      }
    );
  }

  const result = await executeGAQLQueryAPIRequest(validatedRequest, adsClient);

  logger.info("ads.report.gaql completed", {
    opId: envelope.opId,
    resultCount: result.results.length,
  });

  return result;
}

/**
 * Register ads.report.gaql tool
 */
function registerGAQLReportTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.report.gaql",
    description: "Execute Google Ads Query Language (GAQL) query",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        query: {
          type: "string",
          description: "GAQL query string (e.g., SELECT campaign.id, campaign.name FROM campaign)",
        },
        limit: {
          type: "number",
          description: "Optional limit for results (applied if not in query)",
        },
        validateOnly: {
          type: "boolean",
          description: "If true, validate query without executing",
        },
      },
      required: ["customerId", "query"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeGAQLReport(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.report.gaql failed", error);
        } else {
          logger.error("ads.report.gaql failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request for batch GAQL queries
 */
async function executeGAQLBatchAPIRequest(
  validatedRequest: z.infer<typeof gaqlBatchRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof gaqlBatchResponseSchema>> {
  await adsClient.checkRateLimit("ads", "report.batch");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: unknown[];
      fieldMask?: string;
      requestId?: string;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  const results = await Promise.allSettled(
    validatedRequest.queries.map(async (query) => {
      try {
        const response = (await googleAdsClient.search?.({
          customerId,
          query,
        })) as {
          results?: unknown[];
          fieldMask?: string;
          requestId?: string;
        };

        return {
          query,
          result: {
            results: (response.results || []) as z.infer<typeof gaqlQueryResponseSchema>["results"],
            fieldMask: response.fieldMask,
            requestId: response.requestId,
          },
        };
      } catch (error) {
        return {
          query,
          result: {
            results: [],
          },
          error: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  return {
    results: results.map((r) => (r.status === "fulfilled" ? r.value : { query: "", result: { results: [] }, error: String(r.reason) })),
  };
}

/**
 * Execute GAQL batch
 */
export async function executeGAQLBatch(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof gaqlBatchResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.report.batch",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.report.batch", {
    opId: envelope.opId,
    queryCount: (args as { queries?: unknown[] }).queries?.length || 0,
  });

  const validatedRequest = validateSchema(gaqlBatchRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "reporting")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads batch reporting not available",
      {
        product: "ads",
        capability: "reporting",
      }
    );
  }

  const result = await executeGAQLBatchAPIRequest(validatedRequest, adsClient);

  logger.info("ads.report.batch completed", {
    opId: envelope.opId,
    resultCount: result.results.length,
  });

  return result;
}

/**
 * Register ads.report.batch tool
 */
function registerGAQLBatchTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.report.batch",
    description: "Execute multiple GAQL queries in batch",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        queries: {
          type: "array",
          items: { type: "string" },
          description: "Array of GAQL query strings",
        },
      },
      required: ["customerId", "queries"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeGAQLBatch(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.report.batch failed", error);
        } else {
          logger.error("ads.report.batch failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request for streaming GAQL query
 */
async function executeGAQLStreamAPIRequest(
  validatedRequest: z.infer<typeof gaqlStreamRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof gaqlStreamResponseSchema>> {
  await adsClient.checkRateLimit("ads", "report.stream");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    searchStream?: (params: unknown) => {
      on: (event: string, callback: (data: unknown) => void) => unknown;
    };
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  const stream = googleAdsClient.searchStream?.({
    customerId,
    query: validatedRequest.query,
  });

  if (!stream) {
    throw new Error("Failed to create stream");
  }

  const results: z.infer<typeof gaqlStreamResponseSchema>["results"] = [];

  return new Promise((resolve, reject) => {
    (stream as {
      on: (event: string, callback: (data: unknown) => void) => unknown;
    }).on("data", (data: unknown) => {
      if (data && typeof data === "object") {
        results.push(data as z.infer<typeof gaqlStreamResponseSchema>["results"][number]);
      }
    });

    (stream as {
      on: (event: string, callback: (error?: Error) => void) => unknown;
    }).on("end", () => {
      resolve({
        results,
        totalResults: results.length,
      });
    });

    (stream as {
      on: (event: string, callback: (error: Error) => void) => unknown;
    }).on("error", (error: Error) => {
      reject(error);
    });
  });
}

/**
 * Execute GAQL stream
 */
export async function executeGAQLStream(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof gaqlStreamResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.report.stream",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.report.stream", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(gaqlStreamRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "reporting")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads streaming reporting not available",
      {
        product: "ads",
        capability: "reporting",
      }
    );
  }

  const result = await executeGAQLStreamAPIRequest(validatedRequest, adsClient);

  logger.info("ads.report.stream completed", {
    opId: envelope.opId,
    resultCount: result.results.length,
  });

  return result;
}

/**
 * Register ads.report.stream tool
 */
function registerGAQLStreamTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.report.stream",
    description: "Stream large GAQL query result sets",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        query: {
          type: "string",
          description: "GAQL query string",
        },
      },
      required: ["customerId", "query"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeGAQLStream(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.report.stream failed", error);
        } else {
          logger.error("ads.report.stream failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Register all Google Ads tools
 */
export function registerAdsTools(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  // GAQL Reporting tools
  registerGAQLReportTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerGAQLBatchTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerGAQLStreamTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);

  // Campaign tools
  registerCampaignListTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerCampaignGetTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerCampaignUpsertTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerCampaignPauseTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
}

/**
 * Execute API request to list campaigns
 */
async function executeCampaignListAPIRequest(
  validatedRequest: z.infer<typeof campaignListRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof campaignListResponseSchema>> {
  await adsClient.checkRateLimit("ads", "campaign.list");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        campaign?: {
          id?: string;
          name?: string;
          status?: string;
          advertisingChannelType?: string;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  // Build GAQL query
  let query = "SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type FROM campaign";
  if (validatedRequest.filter) {
    query = `${query} WHERE ${validatedRequest.filter}`;
  }

  const response = (await googleAdsClient.search?.({
    customerId,
    query,
  })) as {
    results?: Array<{
      campaign?: {
        id?: string;
        name?: string;
        status?: string;
        advertisingChannelType?: string;
      };
    }>;
  };

  const campaigns = (response.results || []).map((r) => ({
    campaignId: r.campaign?.id,
    name: r.campaign?.name,
    status: r.campaign?.status as "ENABLED" | "PAUSED" | "REMOVED" | undefined,
    advertisingChannelType: r.campaign?.advertisingChannelType,
  }));

  return { campaigns };
}

/**
 * Execute campaign list
 */
export async function executeCampaignList(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof campaignListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.campaign.list",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.campaign.list", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(campaignListRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "campaigns")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads campaign management not available",
      {
        product: "ads",
        capability: "campaigns",
      }
    );
  }

  const result = await executeCampaignListAPIRequest(validatedRequest, adsClient);

  logger.info("ads.campaign.list completed", {
    opId: envelope.opId,
    campaignCount: result.campaigns.length,
  });

  return result;
}

/**
 * Register ads.campaign.list tool
 */
function registerCampaignListTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.campaign.list",
    description: "List Google Ads campaigns",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        filter: {
          type: "string",
          description: "Optional GAQL filter (e.g., campaign.status = 'ENABLED')",
        },
      },
      required: ["customerId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeCampaignList(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.campaign.list failed", error);
        } else {
          logger.error("ads.campaign.list failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to get campaign
 */
async function executeCampaignGetAPIRequest(
  validatedRequest: z.infer<typeof campaignGetRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof campaignGetResponseSchema>> {
  await adsClient.checkRateLimit("ads", "campaign.get");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        campaign?: {
          id?: string;
          name?: string;
          status?: string;
          advertisingChannelType?: string;
          budget?: string;
          biddingStrategy?: string;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  const query = `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.campaign_budget, campaign.bidding_strategy_type FROM campaign WHERE campaign.id = ${validatedRequest.campaignId}`;

  const response = (await googleAdsClient.search?.({
    customerId,
    query,
  })) as {
    results?: Array<{
      campaign?: {
        id?: string;
        name?: string;
        status?: string;
        advertisingChannelType?: string;
        budget?: string;
        biddingStrategy?: string;
      };
    }>;
  };

  const campaign = response.results?.[0]?.campaign;

  if (!campaign) {
    throw new Error(`Campaign ${validatedRequest.campaignId} not found`);
  }

  return {
    campaignId: campaign.id,
    name: campaign.name,
    status: campaign.status as "ENABLED" | "PAUSED" | "REMOVED" | undefined,
    advertisingChannelType: campaign.advertisingChannelType,
    budget: campaign.budget,
    biddingStrategy: campaign.biddingStrategy,
  };
}

/**
 * Execute campaign get
 */
export async function executeCampaignGet(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof campaignGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.campaign.get",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.campaign.get", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(campaignGetRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "campaigns")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads campaign management not available",
      {
        product: "ads",
        capability: "campaigns",
      }
    );
  }

  const result = await executeCampaignGetAPIRequest(validatedRequest, adsClient);

  logger.info("ads.campaign.get completed", {
    opId: envelope.opId,
    campaignId: result.campaignId,
  });

  return result;
}

/**
 * Register ads.campaign.get tool
 */
function registerCampaignGetTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.campaign.get",
    description: "Get Google Ads campaign details",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        campaignId: {
          type: "string",
          description: "Campaign ID",
        },
      },
      required: ["customerId", "campaignId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeCampaignGet(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.campaign.get failed", error);
        } else {
          logger.error("ads.campaign.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to upsert campaign
 */
async function executeCampaignUpsertAPIRequest(
  validatedRequest: z.infer<typeof campaignUpsertRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof campaignUpsertResponseSchema>> {
  await adsClient.checkRateLimit("ads", "campaign.upsert");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        campaign?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    }>;
    mutate?: (params: unknown) => Promise<{
      results?: Array<{
        campaign?: {
          resourceName?: string;
          id?: string;
          name?: string;
          status?: string;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  // Check if campaign exists (for idempotency)
  let existingCampaign: { id?: string; resourceName?: string } | undefined;
  if (validatedRequest.campaignId) {
    const searchResponse = (await googleAdsClient.search?.({
      customerId,
      query: `SELECT campaign.id, campaign.resource_name FROM campaign WHERE campaign.id = ${validatedRequest.campaignId}`,
    })) as {
      results?: Array<{
        campaign?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    };
    existingCampaign = searchResponse.results?.[0]?.campaign;
  } else {
    // Check by name for idempotency
    const searchResponse = (await googleAdsClient.search?.({
      customerId,
      query: `SELECT campaign.id, campaign.resource_name FROM campaign WHERE campaign.name = '${validatedRequest.name.replace(/'/g, "''")}'`,
    })) as {
      results?: Array<{
        campaign?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    };
    existingCampaign = searchResponse.results?.[0]?.campaign;
  }

  // Build mutation operation
  const operation: Record<string, unknown> = {};
  if (existingCampaign) {
    // Update existing campaign
    operation.update = {
      resourceName: existingCampaign.resourceName || `customers/${validatedRequest.customerId.replace(/^customers\//, "")}/campaigns/${existingCampaign.id}`,
      name: validatedRequest.name,
      status: validatedRequest.status || "ENABLED",
    };
    if (validatedRequest.advertisingChannelType) {
      (operation.update as Record<string, unknown>).advertisingChannelType = validatedRequest.advertisingChannelType;
    }
    if (validatedRequest.budget) {
      (operation.update as Record<string, unknown>).campaignBudget = validatedRequest.budget;
    }
  } else {
    // Create new campaign
    operation.create = {
      name: validatedRequest.name,
      status: validatedRequest.status || "ENABLED",
    };
    if (validatedRequest.advertisingChannelType) {
      (operation.create as Record<string, unknown>).advertisingChannelType = validatedRequest.advertisingChannelType;
    }
    if (validatedRequest.budget) {
      (operation.create as Record<string, unknown>).campaignBudget = validatedRequest.budget;
    }
  }

  const response = (await googleAdsClient.mutate?.({
    customerId,
    operations: [operation],
  })) as {
    results?: Array<{
      campaign?: {
        resourceName?: string;
        id?: string;
        name?: string;
        status?: string;
      };
    }>;
  };

  const result = response.results?.[0]?.campaign;
  if (!result) {
    throw new Error("Failed to create/update campaign");
  }

  // Extract campaign ID from resource name
  const campaignId = result.id || result.resourceName?.split("/").pop();

  return {
    campaignId,
    name: result.name,
    status: result.status as "ENABLED" | "PAUSED" | "REMOVED" | undefined,
    advertisingChannelType: validatedRequest.advertisingChannelType,
    budget: validatedRequest.budget,
    biddingStrategy: validatedRequest.biddingStrategy,
  };
}

/**
 * Execute campaign upsert
 */
export async function executeCampaignUpsert(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof campaignUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.campaign.upsert",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.campaign.upsert", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(campaignUpsertRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "campaigns")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads campaign management not available",
      {
        product: "ads",
        capability: "campaigns",
      }
    );
  }

  const result = await executeCampaignUpsertAPIRequest(validatedRequest, adsClient);

  logger.info("ads.campaign.upsert completed", {
    opId: envelope.opId,
    campaignId: result.campaignId,
  });

  return result;
}

/**
 * Register ads.campaign.upsert tool
 */
function registerCampaignUpsertTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.campaign.upsert",
    description: "Create or update Google Ads campaign",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        campaignId: {
          type: "string",
          description: "Campaign ID for updates (optional for create, uses name for idempotency)",
        },
        name: {
          type: "string",
          description: "Campaign name",
        },
        status: {
          type: "string",
          enum: ["ENABLED", "PAUSED", "REMOVED"],
          description: "Campaign status",
        },
        advertisingChannelType: {
          type: "string",
          enum: ["SEARCH", "DISPLAY", "VIDEO", "SHOPPING", "HOTEL", "MULTI_CHANNEL", "PERFORMANCE_MAX"],
          description: "Advertising channel type",
        },
        budget: {
          type: "string",
          description: "Budget resource name (e.g., customers/1234567890/campaignBudgets/987654321)",
        },
        biddingStrategy: {
          type: "string",
          description: "Bidding strategy resource name",
        },
        adSchedule: {
          type: "array",
          description: "Ad schedule configuration",
        },
        targeting: {
          type: "object",
          description: "Targeting configuration",
        },
      },
      required: ["customerId", "name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeCampaignUpsert(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.campaign.upsert failed", error);
        } else {
          logger.error("ads.campaign.upsert failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to pause campaign
 */
async function executeCampaignPauseAPIRequest(
  validatedRequest: z.infer<typeof campaignPauseRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof campaignPauseResponseSchema>> {
  await adsClient.checkRateLimit("ads", "campaign.pause");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        campaign?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    }>;
    mutate?: (params: unknown) => Promise<{
      results?: Array<{
        campaign?: {
          id?: string;
          status?: string;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  // Get campaign resource name
  const searchResponse = (await googleAdsClient.search?.({
    customerId,
    query: `SELECT campaign.id, campaign.resource_name FROM campaign WHERE campaign.id = ${validatedRequest.campaignId}`,
  })) as {
    results?: Array<{
      campaign?: {
        id?: string;
        resourceName?: string;
      };
    }>;
  };

  const campaign = searchResponse.results?.[0]?.campaign;
  if (!campaign) {
    throw new Error(`Campaign ${validatedRequest.campaignId} not found`);
  }

  const resourceName = campaign.resourceName || `customers/${validatedRequest.customerId.replace(/^customers\//, "")}/campaigns/${campaign.id}`;

  // Pause campaign
  const response = (await googleAdsClient.mutate?.({
    customerId,
    operations: [
      {
        update: {
          resourceName,
          status: "PAUSED",
        },
      },
    ],
  })) as {
    results?: Array<{
      campaign?: {
        id?: string;
        status?: string;
      };
    }>;
  };

  const result = response.results?.[0]?.campaign;
  if (!result) {
    throw new Error("Failed to pause campaign");
  }

  return {
    campaignId: result.id || validatedRequest.campaignId,
    status: "PAUSED" as const,
  };
}

/**
 * Execute campaign pause
 */
export async function executeCampaignPause(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof campaignPauseResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.campaign.pause",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.campaign.pause", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(campaignPauseRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "campaigns")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads campaign management not available",
      {
        product: "ads",
        capability: "campaigns",
      }
    );
  }

  const result = await executeCampaignPauseAPIRequest(validatedRequest, adsClient);

  logger.info("ads.campaign.pause completed", {
    opId: envelope.opId,
    campaignId: result.campaignId,
  });

  return result;
}

/**
 * Register ads.campaign.pause tool
 */
function registerCampaignPauseTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.campaign.pause",
    description: "Pause Google Ads campaign",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        campaignId: {
          type: "string",
          description: "Campaign ID",
        },
      },
      required: ["customerId", "campaignId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeCampaignPause(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.campaign.pause failed", error);
        } else {
          logger.error("ads.campaign.pause failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

