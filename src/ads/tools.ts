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
}

