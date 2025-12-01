/**
 * GA4 tools registration
 * Registers GA4 Data API and Admin API tools with the MCP server
 */

import { z } from "zod";
import type { MCPServerBootstrap } from "../server/bootstrap.js";
import type { GA4Client } from "./client.js";
import type { ILogger, ICache } from "../core/types.js";
import type { ICapabilitiesRegistry } from "../core/types.js";
import {
  runReportRequestSchema,
  runReportResponseSchema,
  batchRunReportsRequestSchema,
  batchRunReportsResponseSchema,
  runPivotReportRequestSchema,
  runPivotReportResponseSchema,
} from "./schemas.js";
import { validateSchema } from "../core/validation.js";
import { createOperationEnvelope } from "../core/envelope.js";
import { createPreconditionError } from "../core/errors.js";

/**
 * Options for registering GA4 tools
 */
export interface GA4ToolsOptions {
  bootstrap: MCPServerBootstrap;
  ga4Client: GA4Client;
  cache: ICache;
  capabilitiesRegistry: ICapabilitiesRegistry;
  logger: ILogger;
}

/**
 * Register all GA4 tools
 * @param options - Tool registration options
 */
export function registerGA4Tools(options: GA4ToolsOptions): void {
  const { bootstrap, ga4Client, cache, capabilitiesRegistry, logger } = options;

  logger.info("Registering GA4 tools");

  // Data API tools
  registerReportRunTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerReportBatchTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerReportPivotTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);

  logger.info("GA4 tools registered");
}

/**
 * Check cache and return if found (for single report)
 */
async function checkCacheAndReturn(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof runReportResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for report", { cacheKey });
    return validateSchema(runReportResponseSchema, cached);
  }
  return null;
}

/**
 * Check cache and return if found (for batch reports)
 */
async function checkBatchCacheAndReturn(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof batchRunReportsResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for batch report", { cacheKey });
    return validateSchema(batchRunReportsResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request and validate response
 */
async function executeAPIRequest(
  validatedRequest: z.infer<typeof runReportRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof runReportResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "runReport");
  const dataClient = ga4Client.getAnalyticsDataClient();
  
  // Convert validated request to API format (handle optional name as null)
  const apiRequest = {
    ...validatedRequest,
    dateRanges: validatedRequest.dateRanges.map((dr) => ({
      startDate: dr.startDate,
      endDate: dr.endDate,
      name: dr.name ?? null,
    })),
  };
  
  const response = await dataClient.properties.runReport({
    property: validatedRequest.property,
    requestBody: apiRequest as never,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No data returned from GA4 API", {
      property: validatedRequest.property,
    });
  }

  return validateSchema(runReportResponseSchema, responseData.data);
}

/**
 * Execute report run operation
 */
async function executeReportRun(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<unknown> {
  const envelope = createOperationEnvelope({
    opName: "ga4.report.run",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { property: string }).property },
  });

  logger.info("Executing ga4.report.run", { opId: envelope.opId });

  // Validate input
  const validatedRequest = validateSchema(runReportRequestSchema, args);

  // Pre-check: verify capability
  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "data_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Data API v1 capability not available",
      { product: "ga4" }
    );
  }

  // Check cache
  const cacheKey = `ga4:report:${envelope.idempotencyKey}`;
  const cached = await checkCacheAndReturn(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  // Execute API request
  const validatedResponse = await executeAPIRequest(validatedRequest, ga4Client);

  // Cache response (TTL: 5 minutes for reports)
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.report.run completed", {
    opId: envelope.opId,
    rowCount: validatedResponse.rowCount,
  });

  return validatedResponse;
}

/**
 * Register ga4.report.run tool
 */
function registerReportRunTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.report.run",
    description:
      "Run a standard GA4 report query. Returns dimensions, metrics, and rows for the specified date range.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executeReportRun(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.report.run failed", error);
        } else {
          logger.error("ga4.report.run failed", new Error(String(error)));
        }
        throw error;
      }
    },
  });
}

/**
 * Execute batch API request and validate response
 */
async function executeBatchAPIRequest(
  validatedRequest: z.infer<typeof batchRunReportsRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof batchRunReportsResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "batchRunReports");
  const dataClient = ga4Client.getAnalyticsDataClient();

  // Convert validated request to API format (handle optional name as null)
  const apiRequest = {
    ...validatedRequest,
    requests: validatedRequest.requests.map((req) => ({
      ...req,
      dateRanges: req.dateRanges.map((dr) => ({
        startDate: dr.startDate,
        endDate: dr.endDate,
        name: dr.name ?? null,
      })),
    })),
  };

  const response = await dataClient.properties.batchRunReports({
    property: validatedRequest.property,
    requestBody: apiRequest as never,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No data returned from GA4 API", {
      property: validatedRequest.property,
    });
  }

  return validateSchema(batchRunReportsResponseSchema, responseData.data);
}

/**
 * Execute batch report run operation
 */
async function executeBatchReportRun(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<unknown> {
  const envelope = createOperationEnvelope({
    opName: "ga4.report.batch",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { property: string }).property },
  });

  logger.info("Executing ga4.report.batch", { opId: envelope.opId });

  // Validate input
  const validatedRequest = validateSchema(batchRunReportsRequestSchema, args);

  // Pre-check: verify capability
  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "data_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Data API v1 capability not available",
      { product: "ga4" }
    );
  }

  // Check cache
  const cacheKey = `ga4:batch:${envelope.idempotencyKey}`;
  const cached = await checkBatchCacheAndReturn(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  // Execute API request
  const validatedResponse = await executeBatchAPIRequest(validatedRequest, ga4Client);

  // Cache response (TTL: 5 minutes for reports)
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.report.batch completed", {
    opId: envelope.opId,
    reportCount: validatedResponse.reports.length,
  });

  return validatedResponse;
}

/**
 * Register ga4.report.batch tool
 */
function registerReportBatchTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.report.batch",
    description:
      "Run multiple GA4 report queries in a single batch request. Returns an array of report results.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executeBatchReportRun(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.report.batch failed", error);
        } else {
          logger.error("ga4.report.batch failed", new Error(String(error)));
        }
        throw error;
      }
    },
  });
}

/**
 * Check cache and return if found (for pivot reports)
 */
async function checkPivotCacheAndReturn(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof runPivotReportResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for pivot report", { cacheKey });
    return validateSchema(runPivotReportResponseSchema, cached);
  }
  return null;
}

/**
 * Execute pivot API request and validate response
 */
async function executePivotAPIRequest(
  validatedRequest: z.infer<typeof runPivotReportRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof runPivotReportResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "runPivotReport");
  const dataClient = ga4Client.getAnalyticsDataClient();

  // Convert validated request to API format (handle optional name as null)
  const apiRequest = {
    ...validatedRequest,
    dateRanges: validatedRequest.dateRanges.map((dr) => ({
      startDate: dr.startDate,
      endDate: dr.endDate,
      name: dr.name ?? null,
    })),
  };

  const response = await dataClient.properties.runPivotReport({
    property: validatedRequest.property,
    requestBody: apiRequest as never,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No data returned from GA4 API", {
      property: validatedRequest.property,
    });
  }

  return validateSchema(runPivotReportResponseSchema, responseData.data);
}

/**
 * Execute pivot report run operation
 */
async function executePivotReportRun(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<unknown> {
  const envelope = createOperationEnvelope({
    opName: "ga4.report.pivot",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { property: string }).property },
  });

  logger.info("Executing ga4.report.pivot", { opId: envelope.opId });

  // Validate input
  const validatedRequest = validateSchema(runPivotReportRequestSchema, args);

  // Pre-check: verify capability
  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "data_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Data API v1 capability not available",
      { product: "ga4" }
    );
  }

  // Check cache
  const cacheKey = `ga4:pivot:${envelope.idempotencyKey}`;
  const cached = await checkPivotCacheAndReturn(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  // Execute API request
  const validatedResponse = await executePivotAPIRequest(validatedRequest, ga4Client);

  // Cache response (TTL: 5 minutes for reports)
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.report.pivot completed", {
    opId: envelope.opId,
    pivotHeaderCount: validatedResponse.pivotHeaders.length,
  });

  return validatedResponse;
}

/**
 * Register ga4.report.pivot tool
 */
function registerReportPivotTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.report.pivot",
    description:
      "Run a GA4 pivot table report query. Returns pivoted dimensions, metrics, and rows for the specified date range.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executePivotReportRun(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.report.pivot failed", error);
        } else {
          logger.error("ga4.report.pivot failed", new Error(String(error)));
        }
        throw error;
      }
    },
  });
}

