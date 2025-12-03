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
  conversionListRequestSchema,
  conversionListResponseSchema,
  conversionGetRequestSchema,
  conversionGetResponseSchema,
  conversionUpsertRequestSchema,
  conversionUpsertResponseSchema,
  conversionDeleteRequestSchema,
  conversionDeleteResponseSchema,
  conversionOfflineImportRequestSchema,
  conversionOfflineImportResponseSchema,
  conversionEnhancedRequestSchema,
  conversionEnhancedResponseSchema,
  audienceListRequestSchema,
  audienceListResponseSchema,
  audienceGetRequestSchema,
  audienceGetResponseSchema,
  audienceUpsertRequestSchema,
  audienceUpsertResponseSchema,
  audienceAttachRequestSchema,
  audienceAttachResponseSchema,
  budgetListRequestSchema,
  budgetListResponseSchema,
  budgetGetRequestSchema,
  budgetGetResponseSchema,
  budgetUpsertRequestSchema,
  budgetUpsertResponseSchema,
  biddingStrategyListRequestSchema,
  biddingStrategyListResponseSchema,
  biddingStrategyGetRequestSchema,
  biddingStrategyGetResponseSchema,
  biddingStrategyUpsertRequestSchema,
  biddingStrategyUpsertResponseSchema,
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

  // Conversion tools
  registerConversionListTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerConversionGetTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerConversionUpsertTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerConversionDeleteTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerConversionOfflineImportTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerConversionEnhancedTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);

  // Audience tools
  registerAudienceListTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerAudienceGetTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerAudienceUpsertTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerAudienceAttachTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);

  // Budget and bidding strategy tools
  registerBudgetListTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerBudgetGetTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerBudgetUpsertTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerBiddingStrategyListTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerBiddingStrategyGetTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
  registerBiddingStrategyUpsertTool(bootstrap, adsClient, cache, capabilitiesRegistry, logger);
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

/**
 * Execute API request to list conversion actions
 */
async function executeConversionListAPIRequest(
  validatedRequest: z.infer<typeof conversionListRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof conversionListResponseSchema>> {
  await adsClient.checkRateLimit("ads", "conversion.list");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        conversionAction?: {
          id?: string;
          name?: string;
          type?: string;
          category?: string;
          status?: string;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  // Build GAQL query
  let query = "SELECT conversion_action.id, conversion_action.name, conversion_action.type, conversion_action.category, conversion_action.status FROM conversion_action";
  if (validatedRequest.filter) {
    query = `${query} WHERE ${validatedRequest.filter}`;
  }

  const response = (await googleAdsClient.search?.({
    customerId,
    query,
  })) as {
    results?: Array<{
      conversionAction?: {
        id?: string;
        name?: string;
        type?: string;
        category?: string;
        status?: string;
      };
    }>;
  };

  const conversions = (response.results || []).map((r) => ({
    conversionId: r.conversionAction?.id,
    name: r.conversionAction?.name,
    type: r.conversionAction?.type,
    category: r.conversionAction?.category,
    status: r.conversionAction?.status as "ENABLED" | "REMOVED" | "HIDDEN" | undefined,
  }));

  return { conversions };
}

/**
 * Execute conversion list
 */
export async function executeConversionList(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof conversionListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.conversion.list",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.conversion.list", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(conversionListRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "conversions")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads conversion management not available",
      {
        product: "ads",
        capability: "conversions",
      }
    );
  }

  const result = await executeConversionListAPIRequest(validatedRequest, adsClient);

  logger.info("ads.conversion.list completed", {
    opId: envelope.opId,
    conversionCount: result.conversions.length,
  });

  return result;
}

/**
 * Register ads.conversion.list tool
 */
function registerConversionListTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.conversion.list",
    description: "List Google Ads conversion actions",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        filter: {
          type: "string",
          description: "Optional GAQL filter (e.g., conversion_action.status = 'ENABLED')",
        },
      },
      required: ["customerId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeConversionList(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.conversion.list failed", error);
        } else {
          logger.error("ads.conversion.list failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to get conversion action
 */
async function executeConversionGetAPIRequest(
  validatedRequest: z.infer<typeof conversionGetRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof conversionGetResponseSchema>> {
  await adsClient.checkRateLimit("ads", "conversion.get");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        conversionAction?: {
          id?: string;
          name?: string;
          type?: string;
          category?: string;
          status?: string;
          countingType?: string;
          attributionModel?: string;
          valueSettings?: {
            defaultValue?: number;
            alwaysUseDefaultValue?: boolean;
          };
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  const query = `SELECT conversion_action.id, conversion_action.name, conversion_action.type, conversion_action.category, conversion_action.status, conversion_action.counting_type, conversion_action.attribution_model, conversion_action.value_settings FROM conversion_action WHERE conversion_action.id = ${validatedRequest.conversionId}`;

  const response = (await googleAdsClient.search?.({
    customerId,
    query,
  })) as {
    results?: Array<{
      conversionAction?: {
        id?: string;
        name?: string;
        type?: string;
        category?: string;
        status?: string;
        countingType?: string;
        attributionModel?: string;
        valueSettings?: {
          defaultValue?: number;
          alwaysUseDefaultValue?: boolean;
        };
      };
    }>;
  };

  const conversion = response.results?.[0]?.conversionAction;

  if (!conversion) {
    throw new Error(`Conversion ${validatedRequest.conversionId} not found`);
  }

  return {
    conversionId: conversion.id,
    name: conversion.name,
    type: conversion.type as "WEBPAGE" | "APP" | "PHONE_CALL" | "IMPORT" | "GOOGLE_ANALYTICS" | undefined,
    category: conversion.category as z.infer<typeof conversionGetResponseSchema>["category"],
    status: conversion.status as "ENABLED" | "REMOVED" | "HIDDEN" | undefined,
    countingType: conversion.countingType as "ONE_PER_CLICK" | "MANY_PER_CLICK" | undefined,
    attributionModel: conversion.attributionModel as "DATA_DRIVEN" | "LAST_CLICK" | "FIRST_CLICK" | "LINEAR" | "TIME_DECAY" | "POSITION_BASED" | undefined,
    valueSettings: conversion.valueSettings,
  };
}

/**
 * Execute conversion get
 */
export async function executeConversionGet(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof conversionGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.conversion.get",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.conversion.get", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(conversionGetRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "conversions")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads conversion management not available",
      {
        product: "ads",
        capability: "conversions",
      }
    );
  }

  const result = await executeConversionGetAPIRequest(validatedRequest, adsClient);

  logger.info("ads.conversion.get completed", {
    opId: envelope.opId,
    conversionId: result.conversionId,
  });

  return result;
}

/**
 * Register ads.conversion.get tool
 */
function registerConversionGetTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.conversion.get",
    description: "Get Google Ads conversion action details",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        conversionId: {
          type: "string",
          description: "Conversion ID",
        },
      },
      required: ["customerId", "conversionId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeConversionGet(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.conversion.get failed", error);
        } else {
          logger.error("ads.conversion.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to upsert conversion action
 */
async function executeConversionUpsertAPIRequest(
  validatedRequest: z.infer<typeof conversionUpsertRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof conversionUpsertResponseSchema>> {
  await adsClient.checkRateLimit("ads", "conversion.upsert");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        conversionAction?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    }>;
    mutate?: (params: unknown) => Promise<{
      results?: Array<{
        conversionAction?: {
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

  // Check if conversion exists (for idempotency)
  let existingConversion: { id?: string; resourceName?: string } | undefined;
  if (validatedRequest.conversionId) {
    const searchResponse = (await googleAdsClient.search?.({
      customerId,
      query: `SELECT conversion_action.id, conversion_action.resource_name FROM conversion_action WHERE conversion_action.id = ${validatedRequest.conversionId}`,
    })) as {
      results?: Array<{
        conversionAction?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    };
    existingConversion = searchResponse.results?.[0]?.conversionAction;
  } else {
    // Check by name for idempotency
    const searchResponse = (await googleAdsClient.search?.({
      customerId,
      query: `SELECT conversion_action.id, conversion_action.resource_name FROM conversion_action WHERE conversion_action.name = '${validatedRequest.name.replace(/'/g, "''")}'`,
    })) as {
      results?: Array<{
        conversionAction?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    };
    existingConversion = searchResponse.results?.[0]?.conversionAction;
  }

  // Build mutation operation
  const operation: Record<string, unknown> = {};
  if (existingConversion) {
    // Update existing conversion
    operation.update = {
      resourceName: existingConversion.resourceName || `customers/${validatedRequest.customerId.replace(/^customers\//, "")}/conversionActions/${existingConversion.id}`,
      name: validatedRequest.name,
      status: validatedRequest.status || "ENABLED",
    };
    if (validatedRequest.type) {
      (operation.update as Record<string, unknown>).type = validatedRequest.type;
    }
    if (validatedRequest.category) {
      (operation.update as Record<string, unknown>).category = validatedRequest.category;
    }
    if (validatedRequest.countingType) {
      (operation.update as Record<string, unknown>).countingType = validatedRequest.countingType;
    }
    if (validatedRequest.attributionModel) {
      (operation.update as Record<string, unknown>).attributionModel = validatedRequest.attributionModel;
    }
    if (validatedRequest.valueSettings) {
      (operation.update as Record<string, unknown>).valueSettings = validatedRequest.valueSettings;
    }
  } else {
    // Create new conversion
    operation.create = {
      name: validatedRequest.name,
      type: validatedRequest.type || "WEBPAGE",
      status: validatedRequest.status || "ENABLED",
    };
    if (validatedRequest.category) {
      (operation.create as Record<string, unknown>).category = validatedRequest.category;
    }
    if (validatedRequest.countingType) {
      (operation.create as Record<string, unknown>).countingType = validatedRequest.countingType;
    }
    if (validatedRequest.attributionModel) {
      (operation.create as Record<string, unknown>).attributionModel = validatedRequest.attributionModel;
    }
    if (validatedRequest.valueSettings) {
      (operation.create as Record<string, unknown>).valueSettings = validatedRequest.valueSettings;
    }
  }

  const response = (await googleAdsClient.mutate?.({
    customerId,
    operations: [operation],
  })) as {
    results?: Array<{
      conversionAction?: {
        resourceName?: string;
        id?: string;
        name?: string;
        status?: string;
      };
    }>;
  };

  const result = response.results?.[0]?.conversionAction;
  if (!result) {
    throw new Error("Failed to create/update conversion action");
  }

  // Extract conversion ID from resource name
  const conversionId = result.id || result.resourceName?.split("/").pop();

  return {
    conversionId,
    name: result.name,
    status: result.status as "ENABLED" | "REMOVED" | "HIDDEN" | undefined,
    type: validatedRequest.type,
    category: validatedRequest.category,
    countingType: validatedRequest.countingType,
    attributionModel: validatedRequest.attributionModel,
    valueSettings: validatedRequest.valueSettings,
  };
}

/**
 * Execute conversion upsert
 */
export async function executeConversionUpsert(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof conversionUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.conversion.upsert",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.conversion.upsert", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(conversionUpsertRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "conversions")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads conversion management not available",
      {
        product: "ads",
        capability: "conversions",
      }
    );
  }

  const result = await executeConversionUpsertAPIRequest(validatedRequest, adsClient);

  logger.info("ads.conversion.upsert completed", {
    opId: envelope.opId,
    conversionId: result.conversionId,
  });

  return result;
}

/**
 * Register ads.conversion.upsert tool
 */
function registerConversionUpsertTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.conversion.upsert",
    description: "Create or update Google Ads conversion action",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        conversionId: {
          type: "string",
          description: "Conversion ID for updates (optional for create, uses name for idempotency)",
        },
        name: {
          type: "string",
          description: "Conversion name",
        },
        type: {
          type: "string",
          enum: ["WEBPAGE", "APP", "PHONE_CALL", "IMPORT", "GOOGLE_ANALYTICS"],
          description: "Conversion type",
        },
        category: {
          type: "string",
          enum: ["PURCHASE", "SIGNUP", "LEAD", "VIEW_ITEM", "ADD_TO_CART", "BEGIN_CHECKOUT", "SUBSCRIBE_PAID", "PHONE_CALL_LEAD", "IMPORTED_LEAD", "SUBMIT_LEAD_FORM", "BOOK_APPOINTMENT", "REQUEST_QUOTE", "GET_DIRECTIONS", "OUTBOUND_CLICK", "CALL_TRACKING"],
          description: "Conversion category",
        },
        status: {
          type: "string",
          enum: ["ENABLED", "REMOVED", "HIDDEN"],
          description: "Conversion status",
        },
        countingType: {
          type: "string",
          enum: ["ONE_PER_CLICK", "MANY_PER_CLICK"],
          description: "Counting type",
        },
        attributionModel: {
          type: "string",
          enum: ["DATA_DRIVEN", "LAST_CLICK", "FIRST_CLICK", "LINEAR", "TIME_DECAY", "POSITION_BASED"],
          description: "Attribution model",
        },
        valueSettings: {
          type: "object",
          description: "Value settings",
        },
      },
      required: ["customerId", "name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeConversionUpsert(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.conversion.upsert failed", error);
        } else {
          logger.error("ads.conversion.upsert failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to delete conversion action
 */
async function executeConversionDeleteAPIRequest(
  validatedRequest: z.infer<typeof conversionDeleteRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof conversionDeleteResponseSchema>> {
  await adsClient.checkRateLimit("ads", "conversion.delete");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        conversionAction?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    }>;
    mutate?: (params: unknown) => Promise<{
      results?: Array<{
        conversionAction?: {
          resourceName?: string;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  // Get conversion resource name
  const searchResponse = (await googleAdsClient.search?.({
    customerId,
    query: `SELECT conversion_action.id, conversion_action.resource_name FROM conversion_action WHERE conversion_action.id = ${validatedRequest.conversionId}`,
  })) as {
    results?: Array<{
      conversionAction?: {
        id?: string;
        resourceName?: string;
      };
    }>;
  };

  const conversion = searchResponse.results?.[0]?.conversionAction;
  if (!conversion) {
    throw new Error(`Conversion ${validatedRequest.conversionId} not found`);
  }

  const resourceName = conversion.resourceName || `customers/${validatedRequest.customerId.replace(/^customers\//, "")}/conversionActions/${conversion.id}`;

  // Delete conversion
  const response = (await googleAdsClient.mutate?.({
    customerId,
    operations: [
      {
        remove: resourceName,
      },
    ],
  })) as {
    results?: Array<{
      conversionAction?: {
        resourceName?: string;
      };
    }>;
  };

  const result = response.results?.[0]?.conversionAction;
  if (!result) {
    throw new Error("Failed to delete conversion action");
  }

  return {
    conversionId: validatedRequest.conversionId,
    deleted: true,
  };
}

/**
 * Execute conversion delete
 */
export async function executeConversionDelete(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof conversionDeleteResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.conversion.delete",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.conversion.delete", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(conversionDeleteRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "conversions")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads conversion management not available",
      {
        product: "ads",
        capability: "conversions",
      }
    );
  }

  const result = await executeConversionDeleteAPIRequest(validatedRequest, adsClient);

  logger.info("ads.conversion.delete completed", {
    opId: envelope.opId,
    conversionId: result.conversionId,
  });

  return result;
}

/**
 * Register ads.conversion.delete tool
 */
function registerConversionDeleteTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.conversion.delete",
    description: "Delete Google Ads conversion action",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        conversionId: {
          type: "string",
          description: "Conversion ID",
        },
      },
      required: ["customerId", "conversionId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeConversionDelete(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.conversion.delete failed", error);
        } else {
          logger.error("ads.conversion.delete failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to import offline conversions
 */
async function executeConversionOfflineImportAPIRequest(
  validatedRequest: z.infer<typeof conversionOfflineImportRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof conversionOfflineImportResponseSchema>> {
  await adsClient.checkRateLimit("ads", "conversion.offlineImport");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    uploadClickConversions?: (params: unknown) => Promise<{
      results?: Array<{
        gclid?: string;
        conversionDateTime?: string;
      }>;
      partialFailureError?: {
        errors?: Array<{
          message?: string;
        }>;
      };
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  const conversions = validatedRequest.conversions.map((conv) => ({
    gclid: conv.gclid,
    conversionDateTime: conv.conversionDateTime,
    conversionValue: conv.conversionValue,
    currencyCode: conv.currencyCode || "USD",
    orderId: conv.orderId,
  }));

  const response = (await googleAdsClient.uploadClickConversions?.({
    customerId,
    conversionAction: `customers/${validatedRequest.customerId.replace(/^customers\//, "")}/conversionActions/${validatedRequest.conversionId}`,
    conversions,
    partialFailure: true,
  })) as {
    results?: Array<{
      gclid?: string;
      conversionDateTime?: string;
    }>;
    partialFailureError?: {
      errors?: Array<{
        message?: string;
      }>;
    };
  };

  const imported = response.results?.length || 0;
  const errors = response.partialFailureError?.errors?.map((e) => e.message || "Unknown error") || [];

  return {
    imported,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Execute conversion offline import
 */
export async function executeConversionOfflineImport(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof conversionOfflineImportResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.conversion.offlineImport",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.conversion.offlineImport", {
    opId: envelope.opId,
    conversionCount: (args as { conversions?: unknown[] }).conversions?.length || 0,
  });

  const validatedRequest = validateSchema(conversionOfflineImportRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "conversions")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads offline conversion import not available",
      {
        product: "ads",
        capability: "conversions",
      }
    );
  }

  const result = await executeConversionOfflineImportAPIRequest(validatedRequest, adsClient);

  logger.info("ads.conversion.offlineImport completed", {
    opId: envelope.opId,
    imported: result.imported,
  });

  return result;
}

/**
 * Register ads.conversion.offlineImport tool
 */
function registerConversionOfflineImportTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.conversion.offlineImport",
    description: "Import offline conversions to Google Ads",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        conversionId: {
          type: "string",
          description: "Conversion action ID",
        },
        conversions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              gclid: {
                type: "string",
                description: "Google Click ID",
              },
              conversionDateTime: {
                type: "string",
                description: "Conversion date and time (YYYY-MM-DD HH:MM:SS format)",
              },
              conversionValue: {
                type: "number",
                description: "Conversion value",
              },
              currencyCode: {
                type: "string",
                description: "Currency code (default: USD)",
              },
              orderId: {
                type: "string",
                description: "Order ID for deduplication",
              },
            },
            required: ["conversionDateTime"],
          },
          description: "Array of offline conversions to import",
        },
      },
      required: ["customerId", "conversionId", "conversions"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeConversionOfflineImport(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.conversion.offlineImport failed", error);
        } else {
          logger.error("ads.conversion.offlineImport failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to configure enhanced conversions
 */
async function executeConversionEnhancedAPIRequest(
  validatedRequest: z.infer<typeof conversionEnhancedRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof conversionEnhancedResponseSchema>> {
  await adsClient.checkRateLimit("ads", "conversion.enhanced");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        conversionAction?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    }>;
    mutate?: (params: unknown) => Promise<{
      results?: Array<{
        conversionAction?: {
          resourceName?: string;
          id?: string;
          enhancedConversionsForLeadsEnabled?: boolean;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  // Get conversion resource name
  const searchResponse = (await googleAdsClient.search?.({
    customerId,
    query: `SELECT conversion_action.id, conversion_action.resource_name FROM conversion_action WHERE conversion_action.id = ${validatedRequest.conversionId}`,
  })) as {
    results?: Array<{
      conversionAction?: {
        id?: string;
        resourceName?: string;
      };
    }>;
  };

  const conversion = searchResponse.results?.[0]?.conversionAction;
  if (!conversion) {
    throw new Error(`Conversion ${validatedRequest.conversionId} not found`);
  }

  const resourceName = conversion.resourceName || `customers/${validatedRequest.customerId.replace(/^customers\//, "")}/conversionActions/${conversion.id}`;

  // Update enhanced conversions setting
  const response = (await googleAdsClient.mutate?.({
    customerId,
    operations: [
      {
        update: {
          resourceName,
          enhancedConversionsForLeadsEnabled: validatedRequest.enabled,
        },
      },
    ],
  })) as {
    results?: Array<{
      conversionAction?: {
        resourceName?: string;
        id?: string;
        enhancedConversionsForLeadsEnabled?: boolean;
      };
    }>;
  };

  const result = response.results?.[0]?.conversionAction;
  if (!result) {
    throw new Error("Failed to configure enhanced conversions");
  }

  return {
    conversionId: result.id || validatedRequest.conversionId,
    enabled: result.enhancedConversionsForLeadsEnabled || validatedRequest.enabled,
  };
}

/**
 * Execute conversion enhanced
 */
export async function executeConversionEnhanced(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof conversionEnhancedResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.conversion.enhanced",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.conversion.enhanced", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(conversionEnhancedRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "conversions")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads enhanced conversions not available",
      {
        product: "ads",
        capability: "conversions",
      }
    );
  }

  const result = await executeConversionEnhancedAPIRequest(validatedRequest, adsClient);

  logger.info("ads.conversion.enhanced completed", {
    opId: envelope.opId,
    conversionId: result.conversionId,
    enabled: result.enabled,
  });

  return result;
}

/**
 * Register ads.conversion.enhanced tool
 */
function registerConversionEnhancedTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.conversion.enhanced",
    description: "Configure enhanced conversions for Google Ads conversion action",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        conversionId: {
          type: "string",
          description: "Conversion action ID",
        },
        enabled: {
          type: "boolean",
          description: "Enable or disable enhanced conversions",
        },
      },
      required: ["customerId", "conversionId", "enabled"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeConversionEnhanced(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.conversion.enhanced failed", error);
        } else {
          logger.error("ads.conversion.enhanced failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to list audiences
 */
async function executeAudienceListAPIRequest(
  validatedRequest: z.infer<typeof audienceListRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof audienceListResponseSchema>> {
  await adsClient.checkRateLimit("ads", "audience.list");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        audience?: {
          id?: string;
          name?: string;
          type?: string;
          status?: string;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  // Build GAQL query
  let query = "SELECT user_list.id, user_list.name, user_list.type, user_list.status FROM user_list";
  if (validatedRequest.type) {
    query = `${query} WHERE user_list.type = '${validatedRequest.type}'`;
  }

  const response = (await googleAdsClient.search?.({
    customerId,
    query,
  })) as {
    results?: Array<{
      audience?: {
        id?: string;
        name?: string;
        type?: string;
        status?: string;
      };
      userList?: {
        id?: string;
        name?: string;
        type?: string;
        status?: string;
      };
    }>;
  };

  const audiences = (response.results || []).map((r) => {
    const audience = r.audience || r.userList;
    return {
      audienceId: audience?.id,
      name: audience?.name,
      type: audience?.type,
      status: audience?.status as "ENABLED" | "REMOVED" | "HIDDEN" | undefined,
    };
  });

  return { audiences };
}

/**
 * Execute audience list
 */
export async function executeAudienceList(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof audienceListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.audience.list",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.audience.list", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(audienceListRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "audiences")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads audience management not available",
      {
        product: "ads",
        capability: "audiences",
      }
    );
  }

  const result = await executeAudienceListAPIRequest(validatedRequest, adsClient);

  logger.info("ads.audience.list completed", {
    opId: envelope.opId,
    audienceCount: result.audiences.length,
  });

  return result;
}

/**
 * Register ads.audience.list tool
 */
function registerAudienceListTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.audience.list",
    description: "List Google Ads audiences (remarketing, customer match, custom)",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        type: {
          type: "string",
          enum: ["USER_LIST", "CUSTOMER_MATCH_USER_LIST", "BASIC_USER_LIST", "LOGICAL_USER_LIST", "SIMILAR_USER_LIST"],
          description: "Optional audience type filter",
        },
      },
      required: ["customerId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeAudienceList(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.audience.list failed", error);
        } else {
          logger.error("ads.audience.list failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to get audience
 */
async function executeAudienceGetAPIRequest(
  validatedRequest: z.infer<typeof audienceGetRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof audienceGetResponseSchema>> {
  await adsClient.checkRateLimit("ads", "audience.get");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        userList?: {
          id?: string;
          name?: string;
          type?: string;
          status?: string;
          membershipStatus?: string;
          membershipLifeSpan?: number;
          description?: string;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  const query = `SELECT user_list.id, user_list.name, user_list.type, user_list.status, user_list.membership_status, user_list.membership_life_span, user_list.description FROM user_list WHERE user_list.id = ${validatedRequest.audienceId}`;

  const response = (await googleAdsClient.search?.({
    customerId,
    query,
  })) as {
    results?: Array<{
      userList?: {
        id?: string;
        name?: string;
        type?: string;
        status?: string;
        membershipStatus?: string;
        membershipLifeSpan?: number;
        description?: string;
      };
    }>;
  };

  const audience = response.results?.[0]?.userList;

  if (!audience) {
    throw new Error(`Audience ${validatedRequest.audienceId} not found`);
  }

  return {
    audienceId: audience.id,
    name: audience.name,
    type: audience.type as "USER_LIST" | "CUSTOMER_MATCH_USER_LIST" | "BASIC_USER_LIST" | "LOGICAL_USER_LIST" | "SIMILAR_USER_LIST" | undefined,
    status: audience.status as "ENABLED" | "REMOVED" | "HIDDEN" | undefined,
    membershipStatus: audience.membershipStatus as "OPEN" | "CLOSED" | undefined,
    membershipLifeSpan: audience.membershipLifeSpan,
    description: audience.description,
  };
}

/**
 * Execute audience get
 */
export async function executeAudienceGet(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof audienceGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.audience.get",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.audience.get", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(audienceGetRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "audiences")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads audience management not available",
      {
        product: "ads",
        capability: "audiences",
      }
    );
  }

  const result = await executeAudienceGetAPIRequest(validatedRequest, adsClient);

  logger.info("ads.audience.get completed", {
    opId: envelope.opId,
    audienceId: result.audienceId,
  });

  return result;
}

/**
 * Register ads.audience.get tool
 */
function registerAudienceGetTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.audience.get",
    description: "Get Google Ads audience details",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        audienceId: {
          type: "string",
          description: "Audience ID",
        },
      },
      required: ["customerId", "audienceId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeAudienceGet(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.audience.get failed", error);
        } else {
          logger.error("ads.audience.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to upsert audience
 */
async function executeAudienceUpsertAPIRequest(
  validatedRequest: z.infer<typeof audienceUpsertRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof audienceUpsertResponseSchema>> {
  await adsClient.checkRateLimit("ads", "audience.upsert");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        userList?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    }>;
    mutate?: (params: unknown) => Promise<{
      results?: Array<{
        userList?: {
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

  // Check if audience exists (for idempotency)
  let existingAudience: { id?: string; resourceName?: string } | undefined;
  if (validatedRequest.audienceId) {
    const searchResponse = (await googleAdsClient.search?.({
      customerId,
      query: `SELECT user_list.id, user_list.resource_name FROM user_list WHERE user_list.id = ${validatedRequest.audienceId}`,
    })) as {
      results?: Array<{
        userList?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    };
    existingAudience = searchResponse.results?.[0]?.userList;
  } else {
    // Check by name for idempotency
    const searchResponse = (await googleAdsClient.search?.({
      customerId,
      query: `SELECT user_list.id, user_list.resource_name FROM user_list WHERE user_list.name = '${validatedRequest.name.replace(/'/g, "''")}'`,
    })) as {
      results?: Array<{
        userList?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    };
    existingAudience = searchResponse.results?.[0]?.userList;
  }

  // Build mutation operation
  const operation: Record<string, unknown> = {};
  if (existingAudience) {
    // Update existing audience
    operation.update = {
      resourceName: existingAudience.resourceName || `customers/${validatedRequest.customerId.replace(/^customers\//, "")}/userLists/${existingAudience.id}`,
      name: validatedRequest.name,
      status: validatedRequest.status || "ENABLED",
    };
    if (validatedRequest.membershipStatus) {
      (operation.update as Record<string, unknown>).membershipStatus = validatedRequest.membershipStatus;
    }
    if (validatedRequest.membershipLifeSpan) {
      (operation.update as Record<string, unknown>).membershipLifeSpan = validatedRequest.membershipLifeSpan;
    }
    if (validatedRequest.description) {
      (operation.update as Record<string, unknown>).description = validatedRequest.description;
    }
  } else {
    // Create new audience
    operation.create = {
      name: validatedRequest.name,
      type: validatedRequest.type || "USER_LIST",
      status: validatedRequest.status || "ENABLED",
    };
    if (validatedRequest.membershipStatus) {
      (operation.create as Record<string, unknown>).membershipStatus = validatedRequest.membershipStatus;
    }
    if (validatedRequest.membershipLifeSpan) {
      (operation.create as Record<string, unknown>).membershipLifeSpan = validatedRequest.membershipLifeSpan;
    }
    if (validatedRequest.description) {
      (operation.create as Record<string, unknown>).description = validatedRequest.description;
    }
  }

  const response = (await googleAdsClient.mutate?.({
    customerId,
    operations: [operation],
  })) as {
    results?: Array<{
      userList?: {
        resourceName?: string;
        id?: string;
        name?: string;
        status?: string;
      };
    }>;
  };

  const result = response.results?.[0]?.userList;
  if (!result) {
    throw new Error("Failed to create/update audience");
  }

  // Extract audience ID from resource name
  const audienceId = result.id || result.resourceName?.split("/").pop();

  return {
    audienceId,
    name: result.name,
    status: result.status as "ENABLED" | "REMOVED" | "HIDDEN" | undefined,
    type: validatedRequest.type,
    membershipStatus: validatedRequest.membershipStatus,
    membershipLifeSpan: validatedRequest.membershipLifeSpan,
    description: validatedRequest.description,
  };
}

/**
 * Execute audience upsert
 */
export async function executeAudienceUpsert(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof audienceUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.audience.upsert",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.audience.upsert", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(audienceUpsertRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "audiences")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads audience management not available",
      {
        product: "ads",
        capability: "audiences",
      }
    );
  }

  const result = await executeAudienceUpsertAPIRequest(validatedRequest, adsClient);

  logger.info("ads.audience.upsert completed", {
    opId: envelope.opId,
    audienceId: result.audienceId,
  });

  return result;
}

/**
 * Register ads.audience.upsert tool
 */
function registerAudienceUpsertTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.audience.upsert",
    description: "Create or update Google Ads audience",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        audienceId: {
          type: "string",
          description: "Audience ID for updates (optional for create, uses name for idempotency)",
        },
        name: {
          type: "string",
          description: "Audience name",
        },
        type: {
          type: "string",
          enum: ["USER_LIST", "CUSTOMER_MATCH_USER_LIST", "BASIC_USER_LIST", "LOGICAL_USER_LIST", "SIMILAR_USER_LIST"],
          description: "Audience type",
        },
        status: {
          type: "string",
          enum: ["ENABLED", "REMOVED", "HIDDEN"],
          description: "Audience status",
        },
        membershipStatus: {
          type: "string",
          enum: ["OPEN", "CLOSED"],
          description: "Membership status",
        },
        membershipLifeSpan: {
          type: "number",
          description: "Membership life span in days (1-540)",
        },
        description: {
          type: "string",
          description: "Audience description",
        },
      },
      required: ["customerId", "name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeAudienceUpsert(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.audience.upsert failed", error);
        } else {
          logger.error("ads.audience.upsert failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to attach audience to campaign
 */
async function executeAudienceAttachAPIRequest(
  validatedRequest: z.infer<typeof audienceAttachRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof audienceAttachResponseSchema>> {
  await adsClient.checkRateLimit("ads", "audience.attach");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        campaignAudienceView?: {
          campaign?: string;
          audience?: string;
        };
      }>;
    }>;
    mutate?: (params: unknown) => Promise<{
      results?: Array<{
        campaignAudience?: {
          resourceName?: string;
          campaign?: string;
          audience?: string;
          bidModifier?: number;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  // Check if already attached
  const searchResponse = (await googleAdsClient.search?.({
    customerId,
    query: `SELECT campaign_audience_view.campaign, campaign_audience_view.audience FROM campaign_audience_view WHERE campaign_audience_view.campaign = 'customers/${validatedRequest.customerId.replace(/^customers\//, "")}/campaigns/${validatedRequest.campaignId}' AND campaign_audience_view.audience = 'customers/${validatedRequest.customerId.replace(/^customers\//, "")}/userLists/${validatedRequest.audienceId}'`,
  })) as {
    results?: Array<{
      campaignAudienceView?: {
        campaign?: string;
        audience?: string;
      };
    }>;
  };

  const existing = searchResponse.results?.[0]?.campaignAudienceView;

  // Build mutation operation
  const operation: Record<string, unknown> = {};
  if (existing) {
    // Update existing attachment
    operation.update = {
      campaign: existing.campaign,
      audience: existing.audience,
    };
    if (validatedRequest.bidModifier !== undefined) {
      (operation.update as Record<string, unknown>).bidModifier = validatedRequest.bidModifier;
    }
  } else {
    // Create new attachment
    operation.create = {
      campaign: `customers/${validatedRequest.customerId.replace(/^customers\//, "")}/campaigns/${validatedRequest.campaignId}`,
      audience: `customers/${validatedRequest.customerId.replace(/^customers\//, "")}/userLists/${validatedRequest.audienceId}`,
    };
    if (validatedRequest.bidModifier !== undefined) {
      (operation.create as Record<string, unknown>).bidModifier = validatedRequest.bidModifier;
    }
  }

  const response = (await googleAdsClient.mutate?.({
    customerId,
    operations: [operation],
  })) as {
    results?: Array<{
      campaignAudience?: {
        resourceName?: string;
        campaign?: string;
        audience?: string;
        bidModifier?: number;
      };
    }>;
  };

  const result = response.results?.[0]?.campaignAudience;
  if (!result) {
    throw new Error("Failed to attach audience to campaign");
  }

  return {
    campaignId: validatedRequest.campaignId,
    audienceId: validatedRequest.audienceId,
    attached: true,
    bidModifier: result.bidModifier || validatedRequest.bidModifier,
  };
}

/**
 * Execute audience attach
 */
export async function executeAudienceAttach(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof audienceAttachResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.audience.attach",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.audience.attach", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(audienceAttachRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "audiences")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads audience management not available",
      {
        product: "ads",
        capability: "audiences",
      }
    );
  }

  const result = await executeAudienceAttachAPIRequest(validatedRequest, adsClient);

  logger.info("ads.audience.attach completed", {
    opId: envelope.opId,
    campaignId: result.campaignId,
    audienceId: result.audienceId,
  });

  return result;
}

/**
 * Register ads.audience.attach tool
 */
function registerAudienceAttachTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.audience.attach",
    description: "Attach audience to Google Ads campaign",
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
        audienceId: {
          type: "string",
          description: "Audience ID",
        },
        bidModifier: {
          type: "number",
          description: "Optional bid modifier (e.g., 1.2 for 20% increase)",
        },
      },
      required: ["customerId", "campaignId", "audienceId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeAudienceAttach(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.audience.attach failed", error);
        } else {
          logger.error("ads.audience.attach failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to list budgets
 */
async function executeBudgetListAPIRequest(
  validatedRequest: z.infer<typeof budgetListRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof budgetListResponseSchema>> {
  await adsClient.checkRateLimit("ads", "budget.list");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        campaignBudget?: {
          id?: string;
          name?: string;
          amountMicros?: string;
          deliveryMethod?: string;
          status?: string;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  const query = "SELECT campaign_budget.id, campaign_budget.name, campaign_budget.amount_micros, campaign_budget.delivery_method, campaign_budget.status FROM campaign_budget";

  const response = (await googleAdsClient.search?.({
    customerId,
    query,
  })) as {
    results?: Array<{
      campaignBudget?: {
        id?: string;
        name?: string;
        amountMicros?: string;
        deliveryMethod?: string;
        status?: string;
      };
    }>;
  };

  const budgets = (response.results || []).map((r) => {
    const budget = r.campaignBudget;
    const amountMicros = budget?.amountMicros ? parseInt(budget.amountMicros, 10) : undefined;
    const amount = amountMicros ? amountMicros / 1000000 : undefined;
    return {
      budgetId: budget?.id,
      name: budget?.name,
      amount,
      deliveryMethod: budget?.deliveryMethod as "STANDARD" | "ACCELERATED" | undefined,
      status: budget?.status as "ENABLED" | "REMOVED" | "UNKNOWN" | undefined,
    };
  });

  return { budgets };
}

/**
 * Execute budget list
 */
export async function executeBudgetList(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof budgetListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.budget.list",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.budget.list", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(budgetListRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "budgets")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads budget management not available",
      {
        product: "ads",
        capability: "budgets",
      }
    );
  }

  const result = await executeBudgetListAPIRequest(validatedRequest, adsClient);

  logger.info("ads.budget.list completed", {
    opId: envelope.opId,
    budgetCount: result.budgets.length,
  });

  return result;
}

/**
 * Register ads.budget.list tool
 */
function registerBudgetListTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.budget.list",
    description: "List Google Ads budgets",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
      },
      required: ["customerId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeBudgetList(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.budget.list failed", error);
        } else {
          logger.error("ads.budget.list failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to get budget
 */
async function executeBudgetGetAPIRequest(
  validatedRequest: z.infer<typeof budgetGetRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof budgetGetResponseSchema>> {
  await adsClient.checkRateLimit("ads", "budget.get");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        campaignBudget?: {
          id?: string;
          name?: string;
          amountMicros?: string;
          deliveryMethod?: string;
          status?: string;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  const query = `SELECT campaign_budget.id, campaign_budget.name, campaign_budget.amount_micros, campaign_budget.delivery_method, campaign_budget.status FROM campaign_budget WHERE campaign_budget.id = ${validatedRequest.budgetId}`;

  const response = (await googleAdsClient.search?.({
    customerId,
    query,
  })) as {
    results?: Array<{
      campaignBudget?: {
        id?: string;
        name?: string;
        amountMicros?: string;
        deliveryMethod?: string;
        status?: string;
      };
    }>;
  };

  const budget = response.results?.[0]?.campaignBudget;

  if (!budget) {
    throw new Error(`Budget ${validatedRequest.budgetId} not found`);
  }

  const amountMicros = budget.amountMicros ? parseInt(budget.amountMicros, 10) : undefined;
  const amount = amountMicros ? amountMicros / 1000000 : undefined;

  return {
    budgetId: budget.id,
    name: budget.name,
    amount,
    deliveryMethod: budget.deliveryMethod as "STANDARD" | "ACCELERATED" | undefined,
    status: budget.status as "ENABLED" | "REMOVED" | "UNKNOWN" | undefined,
  };
}

/**
 * Execute budget get
 */
export async function executeBudgetGet(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof budgetGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.budget.get",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.budget.get", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(budgetGetRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "budgets")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads budget management not available",
      {
        product: "ads",
        capability: "budgets",
      }
    );
  }

  const result = await executeBudgetGetAPIRequest(validatedRequest, adsClient);

  logger.info("ads.budget.get completed", {
    opId: envelope.opId,
    budgetId: result.budgetId,
  });

  return result;
}

/**
 * Register ads.budget.get tool
 */
function registerBudgetGetTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.budget.get",
    description: "Get Google Ads budget details",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        budgetId: {
          type: "string",
          description: "Budget ID",
        },
      },
      required: ["customerId", "budgetId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeBudgetGet(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.budget.get failed", error);
        } else {
          logger.error("ads.budget.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to upsert budget
 */
async function executeBudgetUpsertAPIRequest(
  validatedRequest: z.infer<typeof budgetUpsertRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof budgetUpsertResponseSchema>> {
  await adsClient.checkRateLimit("ads", "budget.upsert");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        campaignBudget?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    }>;
    mutate?: (params: unknown) => Promise<{
      results?: Array<{
        campaignBudget?: {
          resourceName?: string;
          id?: string;
          name?: string;
          amountMicros?: string;
          status?: string;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  // Check if budget exists (for idempotency)
  let existingBudget: { id?: string; resourceName?: string } | undefined;
  if (validatedRequest.budgetId) {
    const searchResponse = (await googleAdsClient.search?.({
      customerId,
      query: `SELECT campaign_budget.id, campaign_budget.resource_name FROM campaign_budget WHERE campaign_budget.id = ${validatedRequest.budgetId}`,
    })) as {
      results?: Array<{
        campaignBudget?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    };
    existingBudget = searchResponse.results?.[0]?.campaignBudget;
  } else {
    // Check by name for idempotency
    const searchResponse = (await googleAdsClient.search?.({
      customerId,
      query: `SELECT campaign_budget.id, campaign_budget.resource_name FROM campaign_budget WHERE campaign_budget.name = '${validatedRequest.name.replace(/'/g, "''")}'`,
    })) as {
      results?: Array<{
        campaignBudget?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    };
    existingBudget = searchResponse.results?.[0]?.campaignBudget;
  }

  // Build mutation operation
  const operation: Record<string, unknown> = {};
  if (existingBudget) {
    // Update existing budget
    operation.update = {
      resourceName: existingBudget.resourceName || `customers/${validatedRequest.customerId.replace(/^customers\//, "")}/campaignBudgets/${existingBudget.id}`,
      name: validatedRequest.name,
    };
    if (validatedRequest.amount !== undefined) {
      (operation.update as Record<string, unknown>).amountMicros = Math.round(validatedRequest.amount * 1000000).toString();
    }
    if (validatedRequest.deliveryMethod) {
      (operation.update as Record<string, unknown>).deliveryMethod = validatedRequest.deliveryMethod;
    }
  } else {
    // Create new budget
    operation.create = {
      name: validatedRequest.name,
      amountMicros: validatedRequest.amount ? Math.round(validatedRequest.amount * 1000000).toString() : "0",
      deliveryMethod: validatedRequest.deliveryMethod || "STANDARD",
    };
  }

  const response = (await googleAdsClient.mutate?.({
    customerId,
    operations: [operation],
  })) as {
    results?: Array<{
      campaignBudget?: {
        resourceName?: string;
        id?: string;
        name?: string;
        amountMicros?: string;
        status?: string;
      };
    }>;
  };

  const result = response.results?.[0]?.campaignBudget;
  if (!result) {
    throw new Error("Failed to create/update budget");
  }

  // Extract budget ID from resource name
  const budgetId = result.id || result.resourceName?.split("/").pop();
  const amountMicros = result.amountMicros ? parseInt(result.amountMicros, 10) : undefined;
  const amount = amountMicros ? amountMicros / 1000000 : undefined;

  return {
    budgetId,
    name: result.name,
    amount,
    deliveryMethod: validatedRequest.deliveryMethod || "STANDARD",
    status: result.status as "ENABLED" | "REMOVED" | "UNKNOWN" | undefined,
  };
}

/**
 * Execute budget upsert
 */
export async function executeBudgetUpsert(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof budgetUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.budget.upsert",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.budget.upsert", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(budgetUpsertRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "budgets")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads budget management not available",
      {
        product: "ads",
        capability: "budgets",
      }
    );
  }

  const result = await executeBudgetUpsertAPIRequest(validatedRequest, adsClient);

  logger.info("ads.budget.upsert completed", {
    opId: envelope.opId,
    budgetId: result.budgetId,
  });

  return result;
}

/**
 * Register ads.budget.upsert tool
 */
function registerBudgetUpsertTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.budget.upsert",
    description: "Create or update Google Ads budget",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        budgetId: {
          type: "string",
          description: "Budget ID for updates (optional for create, uses name for idempotency)",
        },
        name: {
          type: "string",
          description: "Budget name",
        },
        amount: {
          type: "number",
          description: "Budget amount in currency units (e.g., 100.0 for $100)",
        },
        deliveryMethod: {
          type: "string",
          enum: ["STANDARD", "ACCELERATED"],
          description: "Budget delivery method",
        },
      },
      required: ["customerId", "name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeBudgetUpsert(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.budget.upsert failed", error);
        } else {
          logger.error("ads.budget.upsert failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to list bidding strategies
 */
async function executeBiddingStrategyListAPIRequest(
  validatedRequest: z.infer<typeof biddingStrategyListRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof biddingStrategyListResponseSchema>> {
  await adsClient.checkRateLimit("ads", "biddingStrategy.list");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        biddingStrategy?: {
          id?: string;
          name?: string;
          type?: string;
          status?: string;
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  const query = "SELECT bidding_strategy.id, bidding_strategy.name, bidding_strategy.type, bidding_strategy.status FROM bidding_strategy";

  const response = (await googleAdsClient.search?.({
    customerId,
    query,
  })) as {
    results?: Array<{
      biddingStrategy?: {
        id?: string;
        name?: string;
        type?: string;
        status?: string;
      };
    }>;
  };

  const strategies = (response.results || []).map((r) => {
    const strategy = r.biddingStrategy;
    return {
      strategyId: strategy?.id,
      name: strategy?.name,
      type: strategy?.type,
      status: strategy?.status as "ENABLED" | "REMOVED" | "UNKNOWN" | undefined,
    };
  });

  return { strategies };
}

/**
 * Execute bidding strategy list
 */
export async function executeBiddingStrategyList(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof biddingStrategyListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.biddingStrategy.list",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.biddingStrategy.list", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(biddingStrategyListRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "biddingStrategies")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads bidding strategy management not available",
      {
        product: "ads",
        capability: "biddingStrategies",
      }
    );
  }

  const result = await executeBiddingStrategyListAPIRequest(validatedRequest, adsClient);

  logger.info("ads.biddingStrategy.list completed", {
    opId: envelope.opId,
    strategyCount: result.strategies.length,
  });

  return result;
}

/**
 * Register ads.biddingStrategy.list tool
 */
function registerBiddingStrategyListTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.biddingStrategy.list",
    description: "List Google Ads bidding strategies",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
      },
      required: ["customerId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeBiddingStrategyList(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.biddingStrategy.list failed", error);
        } else {
          logger.error("ads.biddingStrategy.list failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to get bidding strategy
 */
async function executeBiddingStrategyGetAPIRequest(
  validatedRequest: z.infer<typeof biddingStrategyGetRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof biddingStrategyGetResponseSchema>> {
  await adsClient.checkRateLimit("ads", "biddingStrategy.get");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        biddingStrategy?: {
          id?: string;
          name?: string;
          type?: string;
          status?: string;
          targetCpa?: {
            targetCpaMicros?: string;
          };
          targetRoas?: {
            targetRoas?: number;
          };
          targetSpend?: {
            targetSpendMicros?: string;
          };
        };
      }>;
    }>;
  };

  // Normalize customer ID format
  const customerId = validatedRequest.customerId.startsWith("customers/")
    ? validatedRequest.customerId
    : `customers/${validatedRequest.customerId}`;

  const query = `SELECT bidding_strategy.id, bidding_strategy.name, bidding_strategy.type, bidding_strategy.status, bidding_strategy.target_cpa.target_cpa_micros, bidding_strategy.target_roas.target_roas, bidding_strategy.target_spend.target_spend_micros FROM bidding_strategy WHERE bidding_strategy.id = ${validatedRequest.strategyId}`;

  const response = (await googleAdsClient.search?.({
    customerId,
    query,
  })) as {
    results?: Array<{
      biddingStrategy?: {
        id?: string;
        name?: string;
        type?: string;
        status?: string;
        targetCpa?: {
          targetCpaMicros?: string;
        };
        targetRoas?: {
          targetRoas?: number;
        };
        targetSpend?: {
          targetSpendMicros?: string;
        };
      };
    }>;
  };

  const strategy = response.results?.[0]?.biddingStrategy;

  if (!strategy) {
    throw new Error(`Bidding strategy ${validatedRequest.strategyId} not found`);
  }

  const targetCpaMicros = strategy.targetCpa?.targetCpaMicros ? parseInt(strategy.targetCpa.targetCpaMicros, 10) : undefined;
  const targetCpa = targetCpaMicros ? targetCpaMicros / 1000000 : undefined;

  const targetSpendMicros = strategy.targetSpend?.targetSpendMicros ? parseInt(strategy.targetSpend.targetSpendMicros, 10) : undefined;
  const targetSpend = targetSpendMicros ? targetSpendMicros / 1000000 : undefined;

  return {
    strategyId: strategy.id,
    name: strategy.name,
    type: strategy.type as "MAXIMIZE_CONVERSIONS" | "MAXIMIZE_CONVERSION_VALUE" | "TARGET_CPA" | "TARGET_ROAS" | "TARGET_SPEND" | "TARGET_IMPRESSION_SHARE" | "MANUAL_CPC" | "ENHANCED_CPC" | undefined,
    status: strategy.status as "ENABLED" | "REMOVED" | "UNKNOWN" | undefined,
    targetCpa: targetCpa ? { targetCpaMicros: strategy.targetCpa?.targetCpaMicros } : undefined,
    targetRoas: strategy.targetRoas,
    targetSpend: targetSpend ? { targetSpendMicros: strategy.targetSpend?.targetSpendMicros } : undefined,
  };
}

/**
 * Execute bidding strategy get
 */
export async function executeBiddingStrategyGet(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof biddingStrategyGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.biddingStrategy.get",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.biddingStrategy.get", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(biddingStrategyGetRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "biddingStrategies")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads bidding strategy management not available",
      {
        product: "ads",
        capability: "biddingStrategies",
      }
    );
  }

  const result = await executeBiddingStrategyGetAPIRequest(validatedRequest, adsClient);

  logger.info("ads.biddingStrategy.get completed", {
    opId: envelope.opId,
    strategyId: result.strategyId,
  });

  return result;
}

/**
 * Register ads.biddingStrategy.get tool
 */
function registerBiddingStrategyGetTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.biddingStrategy.get",
    description: "Get Google Ads bidding strategy details",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        strategyId: {
          type: "string",
          description: "Bidding strategy ID",
        },
      },
      required: ["customerId", "strategyId"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeBiddingStrategyGet(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.biddingStrategy.get failed", error);
        } else {
          logger.error("ads.biddingStrategy.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to upsert bidding strategy
 */
async function executeBiddingStrategyUpsertAPIRequest(
  validatedRequest: z.infer<typeof biddingStrategyUpsertRequestSchema>,
  adsClient: AdsClient
): Promise<z.infer<typeof biddingStrategyUpsertResponseSchema>> {
  await adsClient.checkRateLimit("ads", "biddingStrategy.upsert");
  const googleAdsClient = adsClient.getGoogleAdsClient() as {
    search?: (params: unknown) => Promise<{
      results?: Array<{
        biddingStrategy?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    }>;
    mutate?: (params: unknown) => Promise<{
      results?: Array<{
        biddingStrategy?: {
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

  // Check if strategy exists (for idempotency)
  let existingStrategy: { id?: string; resourceName?: string } | undefined;
  if (validatedRequest.strategyId) {
    const searchResponse = (await googleAdsClient.search?.({
      customerId,
      query: `SELECT bidding_strategy.id, bidding_strategy.resource_name FROM bidding_strategy WHERE bidding_strategy.id = ${validatedRequest.strategyId}`,
    })) as {
      results?: Array<{
        biddingStrategy?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    };
    existingStrategy = searchResponse.results?.[0]?.biddingStrategy;
  } else {
    // Check by name for idempotency
    const searchResponse = (await googleAdsClient.search?.({
      customerId,
      query: `SELECT bidding_strategy.id, bidding_strategy.resource_name FROM bidding_strategy WHERE bidding_strategy.name = '${validatedRequest.name.replace(/'/g, "''")}'`,
    })) as {
      results?: Array<{
        biddingStrategy?: {
          id?: string;
          resourceName?: string;
        };
      }>;
    };
    existingStrategy = searchResponse.results?.[0]?.biddingStrategy;
  }

  // Build mutation operation
  const operation: Record<string, unknown> = {};
  if (existingStrategy) {
    // Update existing strategy
    operation.update = {
      resourceName: existingStrategy.resourceName || `customers/${validatedRequest.customerId.replace(/^customers\//, "")}/biddingStrategies/${existingStrategy.id}`,
      name: validatedRequest.name,
    };
    if (validatedRequest.type) {
      (operation.update as Record<string, unknown>).type = validatedRequest.type;
    }
    if (validatedRequest.targetCpa !== undefined) {
      (operation.update as Record<string, unknown>).targetCpa = {
        targetCpaMicros: Math.round(validatedRequest.targetCpa * 1000000).toString(),
      };
    }
    if (validatedRequest.targetRoas !== undefined) {
      (operation.update as Record<string, unknown>).targetRoas = {
        targetRoas: validatedRequest.targetRoas,
      };
    }
    if (validatedRequest.targetSpend !== undefined) {
      (operation.update as Record<string, unknown>).targetSpend = {
        targetSpendMicros: Math.round(validatedRequest.targetSpend * 1000000).toString(),
      };
    }
  } else {
    // Create new strategy
    operation.create = {
      name: validatedRequest.name,
      type: validatedRequest.type || "MAXIMIZE_CONVERSIONS",
    };
    if (validatedRequest.targetCpa !== undefined) {
      (operation.create as Record<string, unknown>).targetCpa = {
        targetCpaMicros: Math.round(validatedRequest.targetCpa * 1000000).toString(),
      };
    }
    if (validatedRequest.targetRoas !== undefined) {
      (operation.create as Record<string, unknown>).targetRoas = {
        targetRoas: validatedRequest.targetRoas,
      };
    }
    if (validatedRequest.targetSpend !== undefined) {
      (operation.create as Record<string, unknown>).targetSpend = {
        targetSpendMicros: Math.round(validatedRequest.targetSpend * 1000000).toString(),
      };
    }
  }

  const response = (await googleAdsClient.mutate?.({
    customerId,
    operations: [operation],
  })) as {
    results?: Array<{
      biddingStrategy?: {
        resourceName?: string;
        id?: string;
        name?: string;
        status?: string;
      };
    }>;
  };

  const result = response.results?.[0]?.biddingStrategy;
  if (!result) {
    throw new Error("Failed to create/update bidding strategy");
  }

  // Extract strategy ID from resource name
  const strategyId = result.id || result.resourceName?.split("/").pop();

  return {
    strategyId,
    name: result.name,
    type: validatedRequest.type,
    status: result.status as "ENABLED" | "REMOVED" | "UNKNOWN" | undefined,
    targetCpa: validatedRequest.targetCpa !== undefined ? { targetCpaMicros: Math.round(validatedRequest.targetCpa * 1000000).toString() } : undefined,
    targetRoas: validatedRequest.targetRoas !== undefined ? { targetRoas: validatedRequest.targetRoas } : undefined,
    targetSpend: validatedRequest.targetSpend !== undefined ? { targetSpendMicros: Math.round(validatedRequest.targetSpend * 1000000).toString() } : undefined,
  };
}

/**
 * Execute bidding strategy upsert
 */
export async function executeBiddingStrategyUpsert(
  args: unknown,
  adsClient: AdsClient,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof biddingStrategyUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ads.biddingStrategy.upsert",
    actor: "user",
    target: { product: "ads" },
    request: { args: args as Record<string, unknown> },
  });

  logger.info("Executing ads.biddingStrategy.upsert", {
    opId: envelope.opId,
  });

  const validatedRequest = validateSchema(biddingStrategyUpsertRequestSchema, args);

  if (!capabilitiesRegistry.hasCapability("ads", "biddingStrategies")) {
    throw createPreconditionError(
      "precheck_failed",
      "Google Ads bidding strategy management not available",
      {
        product: "ads",
        capability: "biddingStrategies",
      }
    );
  }

  const result = await executeBiddingStrategyUpsertAPIRequest(validatedRequest, adsClient);

  logger.info("ads.biddingStrategy.upsert completed", {
    opId: envelope.opId,
    strategyId: result.strategyId,
  });

  return result;
}

/**
 * Register ads.biddingStrategy.upsert tool
 */
function registerBiddingStrategyUpsertTool(
  bootstrap: MCPServerBootstrap,
  adsClient: AdsClient,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ads.biddingStrategy.upsert",
    description: "Create or update Google Ads bidding strategy",
    inputSchema: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID (numeric or customers/1234567890 format)",
        },
        strategyId: {
          type: "string",
          description: "Strategy ID for updates (optional for create, uses name for idempotency)",
        },
        name: {
          type: "string",
          description: "Strategy name",
        },
        type: {
          type: "string",
          enum: ["MAXIMIZE_CONVERSIONS", "MAXIMIZE_CONVERSION_VALUE", "TARGET_CPA", "TARGET_ROAS", "TARGET_SPEND", "TARGET_IMPRESSION_SHARE", "MANUAL_CPC", "ENHANCED_CPC"],
          description: "Bidding strategy type",
        },
        targetCpa: {
          type: "number",
          description: "Target CPA in currency units (for TARGET_CPA strategy)",
        },
        targetRoas: {
          type: "number",
          description: "Target ROAS (for TARGET_ROAS strategy)",
        },
        targetSpend: {
          type: "number",
          description: "Target spend in currency units (for TARGET_SPEND strategy)",
        },
      },
      required: ["customerId", "name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeBiddingStrategyUpsert(args, adsClient, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ads.biddingStrategy.upsert failed", error);
        } else {
          logger.error("ads.biddingStrategy.upsert failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

