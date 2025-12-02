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
  adGroupListRequestSchema,
  adGroupListResponseSchema,
  adGroupGetRequestSchema,
  adGroupGetResponseSchema,
  adGroupUpsertRequestSchema,
  adGroupUpsertResponseSchema,
  keywordListRequestSchema,
  keywordListResponseSchema,
  keywordUpsertRequestSchema,
  keywordUpsertResponseSchema,
  keywordDeleteRequestSchema,
  keywordDeleteResponseSchema,
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

  // Ad Group tools
  registerAdGroupListTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerAdGroupGetTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerAdGroupUpsertTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);

  // Keyword tools
  registerKeywordListTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerKeywordUpsertTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerKeywordDeleteTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
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

/**
 * Execute API request to list ad groups
 */
async function executeAdGroupListAPIRequest(
  validatedRequest: z.infer<typeof adGroupListRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof adGroupListResponseSchema>> {
  await adsClient.checkRateLimit("ads", "adgroup.list");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        adGroup?: {
          id?: string;
          name?: string;
          status?: string;
          type?: string;
          campaign?: string;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  // Build GAQL query
  let query = "SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.type, ad_group.campaign FROM ad_group";
  if (validatedRequest.campaignId) {
    query = `${query} WHERE ad_group.campaign = 'customers/${validatedRequest.customerId.replace(/^customers\//, "")}/campaigns/${validatedRequest.campaignId}'`;
  }

  const response = (await googleAdsClient.search?.({
    customerId,
    query,
  })) as {
    results?: Array<{
      adGroup?: {
        id?: string;
        name?: string;
        status?: string;
        type?: string;
        campaign?: string;
      };
    }>;
  };

  const adGroups = (response.results || []).map((r) => {
    const campaignId = r.adGroup?.campaign?.split("/").pop();
    return {
      adGroupId: r.adGroup?.id,
      name: r.adGroup?.name,
      status: r.adGroup?.status as "ENABLED" | "PAUSED" | "REMOVED" | undefined,
      type: r.adGroup?.type,
      campaignId,
    };
  });

  return { adGroups };
}

/**
 * Execute ad group list
 */
export async function executeAdGroupList(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof adGroupListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.adgroup.list",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.adgroup.list", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(adGroupListRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "campaigns")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads ad group management not available",
      {
        product: "ads",
        capability: "campaigns",
      }
    );
  }

  const result = await executeAdGroupListAPIRequest(validatedRequest, adsClient);

  logger.info("ads.adgroup.list completed", {
    opId: envelope.opId,
    adGroupCount: result.adGroups.length,
  });

  return result;
}

/**
 * Register ads.adgroup.list tool
 */
function registerAdGroupListTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.adgroup.list",
    description: "List Google Ads ad groups",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        campaignId: {
          type: "string",
          description: "Optional campaign ID to filter ad groups",
        },
      },
      required: ["customerId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeAdGroupList(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.adgroup.list failed", error);
        } else {
          logger.error("ads.adgroup.list failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to get ad group
 */
async function executeAdGroupGetAPIRequest(
  validatedRequest: z.infer<typeof adGroupGetRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof adGroupGetResponseSchema>> {
  await adsClient.checkRateLimit("ads", "adgroup.get");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        adGroup?: {
          id?: string;
          name?: string;
          status?: string;
          type?: string;
          campaign?: string;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  const query = `SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.type, ad_group.campaign FROM ad_group WHERE ad_group.id = ${validatedRequest.adGroupId}`;

  const response = (await googleAdsClient.search?.({
    customerId,
    query,
  })) as {
    results?: Array<{
      adGroup?: {
        id?: string;
        name?: string;
        status?: string;
        type?: string;
        campaign?: string;
      };
    }>;
  };

  const adGroup = response.results?.[0]?.adGroup;

  if (!adGroup) {
    throw new Error(`Ad Group ${validatedRequest.adGroupId} not found`);
  }

  const campaignId = adGroup.campaign?.split("/").pop();

  return {
    adGroupId: adGroup.id,
    name: adGroup.name,
    status: adGroup.status as "ENABLED" | "PAUSED" | "REMOVED" | undefined,
    type: adGroup.type,
    campaignId,
  };
}

/**
 * Execute ad group get
 */
export async function executeAdGroupGet(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof adGroupGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.adgroup.get",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.adgroup.get", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(adGroupGetRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "campaigns")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads ad group management not available",
      {
        product: "ads",
        capability: "campaigns",
      }
    );
  }

  const result = await executeAdGroupGetAPIRequest(validatedRequest, adsClient);

  logger.info("ads.adgroup.get completed", {
    opId: envelope.opId,
    adGroupId: result.adGroupId,
  });

  return result;
}

/**
 * Register ads.adgroup.get tool
 */
function registerAdGroupGetTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.adgroup.get",
    description: "Get Google Ads ad group details",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        adGroupId: {
          type: "string",
          description: "Ad Group ID",
        },
      },
      required: ["customerId", "adGroupId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeAdGroupGet(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.adgroup.get failed", error);
        } else {
          logger.error("ads.adgroup.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to upsert ad group
 */
async function executeAdGroupUpsertAPIRequest(
  validatedRequest: z.infer<typeof adGroupUpsertRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof adGroupUpsertResponseSchema>> {
  await adsClient.checkRateLimit("ads", "adgroup.upsert");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        adGroup?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    }>;
    mutate?: (params: unknown) => Promise<{
      results?: Array<{
        adGroup?: {
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

  // Check if ad group exists (for idempotency)
  let existingAdGroup: { id?: string; resourceName?: string } | undefined;
  if (validatedRequest.adGroupId) {
    const searchResponse = (await googleAdsClient.search?.({
      customerId,
      query: `SELECT ad_group.id, ad_group.resource_name FROM ad_group WHERE ad_group.id = ${validatedRequest.adGroupId}`,
    })) as {
      results?: Array<{
        adGroup?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    };
    existingAdGroup = searchResponse.results?.[0]?.adGroup;
  } else {
    // Check by name for idempotency
    const searchResponse = (await googleAdsClient.search?.({
      customerId,
      query: `SELECT ad_group.id, ad_group.resource_name FROM ad_group WHERE ad_group.name = '${validatedRequest.name.replace(/'/g, "''")}' AND ad_group.campaign = 'customers/${validatedRequest.customerId.replace(/^customers\//, "")}/campaigns/${validatedRequest.campaignId}'`,
    })) as {
      results?: Array<{
        adGroup?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    };
    existingAdGroup = searchResponse.results?.[0]?.adGroup;
  }

  // Build mutation operation
  const operation: Record<string, unknown> = {};
  const campaignResourceName = `customers/${validatedRequest.customerId.replace(/^customers\//, "")}/campaigns/${validatedRequest.campaignId}`;

  if (existingAdGroup) {
    // Update existing ad group
    operation.update = {
      resourceName: existingAdGroup.resourceName || `customers/${validatedRequest.customerId.replace(/^customers\//, "")}/adGroups/${existingAdGroup.id}`,
      name: validatedRequest.name,
      status: validatedRequest.status || "ENABLED",
    };
    if (validatedRequest.type) {
      (operation.update as Record<string, unknown>).type = validatedRequest.type;
    }
  } else {
    // Create new ad group
    operation.create = {
      name: validatedRequest.name,
      status: validatedRequest.status || "ENABLED",
      campaign: campaignResourceName,
    };
    if (validatedRequest.type) {
      (operation.create as Record<string, unknown>).type = validatedRequest.type;
    }
  }

  const response = (await googleAdsClient.mutate?.({
    customerId,
    operations: [operation],
  })) as {
    results?: Array<{
      adGroup?: {
        resourceName?: string;
        id?: string;
        name?: string;
        status?: string;
      };
    }>;
  };

  const result = response.results?.[0]?.adGroup;
  if (!result) {
    throw new Error("Failed to create/update ad group");
  }

  // Extract ad group ID from resource name
  const adGroupId = result.id || result.resourceName?.split("/").pop();

  return {
    adGroupId,
    name: result.name,
    status: result.status as "ENABLED" | "PAUSED" | "REMOVED" | undefined,
    type: validatedRequest.type,
    campaignId: validatedRequest.campaignId,
  };
}

/**
 * Execute ad group upsert
 */
export async function executeAdGroupUpsert(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof adGroupUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.adgroup.upsert",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.adgroup.upsert", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(adGroupUpsertRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "campaigns")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads ad group management not available",
      {
        product: "ads",
        capability: "campaigns",
      }
    );
  }

  const result = await executeAdGroupUpsertAPIRequest(validatedRequest, adsClient);

  logger.info("ads.adgroup.upsert completed", {
    opId: envelope.opId,
    adGroupId: result.adGroupId,
  });

  return result;
}

/**
 * Register ads.adgroup.upsert tool
 */
function registerAdGroupUpsertTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.adgroup.upsert",
    description: "Create or update Google Ads ad group",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        adGroupId: {
          type: "string",
          description: "Ad Group ID for updates (optional for create, uses name for idempotency)",
        },
        campaignId: {
          type: "string",
          description: "Campaign ID",
        },
        name: {
          type: "string",
          description: "Ad Group name",
        },
        status: {
          type: "string",
          enum: ["ENABLED", "PAUSED", "REMOVED"],
          description: "Ad Group status",
        },
        type: {
          type: "string",
          enum: ["SEARCH_STANDARD", "SEARCH_DYNAMIC_ADS", "DISPLAY_STANDARD", "DISPLAY_ENGAGEMENT", "SHOPPING_PRODUCT_ADS", "HOTEL_ADS", "VIDEO_RESPONSIVE", "VIDEO_TRUE_VIEW_DISCOVERY", "VIDEO_TRUE_VIEW_IN_STREAM", "VIDEO_NON_SKIPPABLE_IN_STREAM", "VIDEO_OUTSTREAM", "VIDEO_SEQUENCE"],
          description: "Ad Group type",
        },
        targeting: {
          type: "object",
          description: "Targeting configuration",
        },
      },
      required: ["customerId", "campaignId", "name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeAdGroupUpsert(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.adgroup.upsert failed", error);
        } else {
          logger.error("ads.adgroup.upsert failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to list keywords
 */
async function executeKeywordListAPIRequest(
  validatedRequest: z.infer<typeof keywordListRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof keywordListResponseSchema>> {
  await adsClient.checkRateLimit("ads", "keyword.list");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        adGroupCriterion?: {
          criterion?: {
            id?: string;
            keyword?: {
              text?: string;
              matchType?: string;
            };
          };
          cpcBid?: {
            micros?: string;
          };
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  // Build GAQL query
  let query = "SELECT ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.cpc_bid_micros FROM ad_group_criterion WHERE ad_group_criterion.type = 'KEYWORD'";
  if (validatedRequest.adGroupId) {
    query = `${query} AND ad_group_criterion.ad_group = 'customers/${validatedRequest.customerId.replace(/^customers\//, "")}/adGroups/${validatedRequest.adGroupId}'`;
  }

  const response = (await googleAdsClient.search?.({
    customerId,
    query,
  })) as {
    results?: Array<{
      adGroupCriterion?: {
        criterion?: {
          id?: string;
          keyword?: {
            text?: string;
            matchType?: string;
          };
        };
        cpcBid?: {
          micros?: string;
        };
      };
    }>;
  };

  const keywords = (response.results || []).map((r) => {
    const cpcBidMicros = r.adGroupCriterion?.cpcBid?.micros;
    const cpcBid = cpcBidMicros ? parseFloat(cpcBidMicros) / 1000000 : undefined;
    return {
      keywordId: r.adGroupCriterion?.criterion?.id,
      text: r.adGroupCriterion?.criterion?.keyword?.text,
      matchType: r.adGroupCriterion?.criterion?.keyword?.matchType as "EXACT" | "PHRASE" | "BROAD" | undefined,
      cpcBid,
      negative: false,
    };
  });

  return { keywords };
}

/**
 * Execute keyword list
 */
export async function executeKeywordList(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof keywordListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.keyword.list",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.keyword.list", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(keywordListRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "campaigns")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads keyword management not available",
      {
        product: "ads",
        capability: "campaigns",
      }
    );
  }

  const result = await executeKeywordListAPIRequest(validatedRequest, adsClient);

  logger.info("ads.keyword.list completed", {
    opId: envelope.opId,
    keywordCount: result.keywords.length,
  });

  return result;
}

/**
 * Register ads.keyword.list tool
 */
function registerKeywordListTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.keyword.list",
    description: "List Google Ads keywords",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        adGroupId: {
          type: "string",
          description: "Optional ad group ID to filter keywords",
        },
      },
      required: ["customerId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeKeywordList(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.keyword.list failed", error);
        } else {
          logger.error("ads.keyword.list failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to upsert keyword
 */
async function executeKeywordUpsertAPIRequest(
  validatedRequest: z.infer<typeof keywordUpsertRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof keywordUpsertResponseSchema>> {
  await adsClient.checkRateLimit("ads", "keyword.upsert");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        adGroupCriterion?: {
          criterion?: {
            id?: string;
            resourceName?: string;
          };
        };
      }>;
    }>;
    mutate?: (params: unknown) => Promise<{
      results?: Array<{
        adGroupCriterion?: {
          resourceName?: string;
          criterion?: {
            id?: string;
            keyword?: {
              text?: string;
              matchType?: string;
            };
          };
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  const adGroupResourceName = `customers/${validatedRequest.customerId.replace(/^customers\//, "")}/adGroups/${validatedRequest.adGroupId}`;

  // Check if keyword exists (for idempotency)
  let existingKeyword: { id?: string; resourceName?: string } | undefined;
  if (validatedRequest.keywordId) {
    const searchResponse = (await googleAdsClient.search?.({
      customerId,
      query: `SELECT ad_group_criterion.criterion_id, ad_group_criterion.resource_name FROM ad_group_criterion WHERE ad_group_criterion.criterion_id = ${validatedRequest.keywordId}`,
    })) as {
      results?: Array<{
        adGroupCriterion?: {
          criterion?: {
            id?: string;
            resourceName?: string;
          };
        };
      }>;
    };
    existingKeyword = searchResponse.results?.[0]?.adGroupCriterion?.criterion;
  } else {
    // Check by text and match type for idempotency
    const searchResponse = (await googleAdsClient.search?.({
      customerId,
      query: `SELECT ad_group_criterion.criterion_id, ad_group_criterion.resource_name FROM ad_group_criterion WHERE ad_group_criterion.keyword.text = '${validatedRequest.text.replace(/'/g, "''")}' AND ad_group_criterion.keyword.match_type = '${validatedRequest.matchType}' AND ad_group_criterion.ad_group = '${adGroupResourceName}'`,
    })) as {
      results?: Array<{
        adGroupCriterion?: {
          criterion?: {
            id?: string;
            resourceName?: string;
          };
        };
      }>;
    };
    existingKeyword = searchResponse.results?.[0]?.adGroupCriterion?.criterion;
  }

  // Build mutation operation
  const operation: Record<string, unknown> = {};
  const cpcBidMicros = validatedRequest.cpcBid ? Math.round(validatedRequest.cpcBid * 1000000).toString() : undefined;

  if (existingKeyword) {
    // Update existing keyword
    operation.update = {
      resourceName: existingKeyword.resourceName || `customers/${validatedRequest.customerId.replace(/^customers\//, "")}/adGroupCriteria/${existingKeyword.id}`,
      keyword: {
        text: validatedRequest.text,
        matchType: validatedRequest.matchType,
      },
    };
    if (cpcBidMicros) {
      (operation.update as Record<string, unknown>).cpcBidMicros = cpcBidMicros;
    }
  } else {
    // Create new keyword
    operation.create = {
      adGroup: adGroupResourceName,
      keyword: {
        text: validatedRequest.text,
        matchType: validatedRequest.matchType,
      },
    };
    if (cpcBidMicros) {
      (operation.create as Record<string, unknown>).cpcBidMicros = cpcBidMicros;
    }
  }

  const response = (await googleAdsClient.mutate?.({
    customerId,
    operations: [operation],
  })) as {
    results?: Array<{
      adGroupCriterion?: {
        resourceName?: string;
        criterion?: {
          id?: string;
          keyword?: {
            text?: string;
            matchType?: string;
          };
        };
      };
    }>;
  };

  const result = response.results?.[0]?.adGroupCriterion;
  if (!result) {
    throw new Error("Failed to create/update keyword");
  }

  // Extract keyword ID from resource name
  const keywordId = result.criterion?.id || result.resourceName?.split("/").pop();

  return {
    keywordId,
    text: result.criterion?.keyword?.text || validatedRequest.text,
    matchType: result.criterion?.keyword?.matchType as "EXACT" | "PHRASE" | "BROAD" | undefined || validatedRequest.matchType,
    cpcBid: validatedRequest.cpcBid,
  };
}

/**
 * Execute keyword upsert
 */
export async function executeKeywordUpsert(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof keywordUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.keyword.upsert",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.keyword.upsert", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(keywordUpsertRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "campaigns")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads keyword management not available",
      {
        product: "ads",
        capability: "campaigns",
      }
    );
  }

  const result = await executeKeywordUpsertAPIRequest(validatedRequest, adsClient);

  logger.info("ads.keyword.upsert completed", {
    opId: envelope.opId,
    keywordId: result.keywordId,
  });

  return result;
}

/**
 * Register ads.keyword.upsert tool
 */
function registerKeywordUpsertTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.keyword.upsert",
    description: "Create or update Google Ads keyword",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        adGroupId: {
          type: "string",
          description: "Ad Group ID",
        },
        keywordId: {
          type: "string",
          description: "Keyword ID for updates (optional for create, uses text+matchType for idempotency)",
        },
        text: {
          type: "string",
          description: "Keyword text",
        },
        matchType: {
          type: "string",
          enum: ["EXACT", "PHRASE", "BROAD"],
          description: "Keyword match type",
        },
        cpcBid: {
          type: "number",
          description: "CPC bid amount",
        },
        negative: {
          type: "boolean",
          description: "Whether this is a negative keyword",
        },
      },
      required: ["customerId", "adGroupId", "text", "matchType"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeKeywordUpsert(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.keyword.upsert failed", error);
        } else {
          logger.error("ads.keyword.upsert failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to delete keyword
 */
async function executeKeywordDeleteAPIRequest(
  validatedRequest: z.infer<typeof keywordDeleteRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof keywordDeleteResponseSchema>> {
  await adsClient.checkRateLimit("ads", "keyword.delete");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        adGroupCriterion?: {
          criterion?: {
            id?: string;
            resourceName?: string;
          };
        };
      }>;
    }>;
    mutate?: (params: unknown) => Promise<{
      results?: Array<{
        adGroupCriterion?: {
          resourceName?: string;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  // Get keyword resource name
  const searchResponse = (await googleAdsClient.search?.({
    customerId,
    query: `SELECT ad_group_criterion.criterion_id, ad_group_criterion.resource_name FROM ad_group_criterion WHERE ad_group_criterion.criterion_id = ${validatedRequest.keywordId}`,
  })) as {
    results?: Array<{
      adGroupCriterion?: {
        criterion?: {
          id?: string;
          resourceName?: string;
        };
      };
    }>;
  };

  const keyword = searchResponse.results?.[0]?.adGroupCriterion?.criterion;
  if (!keyword) {
    throw new Error(`Keyword ${validatedRequest.keywordId} not found`);
  }

  const resourceName = keyword.resourceName || `customers/${validatedRequest.customerId.replace(/^customers\//, "")}/adGroupCriteria/${keyword.id}`;

  // Delete keyword
  const response = (await googleAdsClient.mutate?.({
    customerId,
    operations: [
      {
        remove: resourceName,
      },
    ],
  })) as {
    results?: Array<{
      adGroupCriterion?: {
        resourceName?: string;
      };
    }>;
  };

  const result = response.results?.[0]?.adGroupCriterion;
  if (!result) {
    throw new Error("Failed to delete keyword");
  }

  return {
    keywordId: validatedRequest.keywordId,
    deleted: true,
  };
}

/**
 * Execute keyword delete
 */
export async function executeKeywordDelete(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof keywordDeleteResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.keyword.delete",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.keyword.delete", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(keywordDeleteRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "campaigns")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads keyword management not available",
      {
        product: "ads",
        capability: "campaigns",
      }
    );
  }

  const result = await executeKeywordDeleteAPIRequest(validatedRequest, adsClient);

  logger.info("ads.keyword.delete completed", {
    opId: envelope.opId,
    keywordId: result.keywordId,
  });

  return result;
}

/**
 * Register ads.keyword.delete tool
 */
function registerKeywordDeleteTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.keyword.delete",
    description: "Delete Google Ads keyword",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        keywordId: {
          type: "string",
          description: "Keyword ID",
        },
      },
      required: ["customerId", "keywordId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeKeywordDelete(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.keyword.delete failed", error);
        } else {
          logger.error("ads.keyword.delete failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

