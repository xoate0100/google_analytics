/**
 * GA4 tools registration
 * Registers GA4 Data API and Admin API tools with the MCP server
 */

import { z } from "zod";
import type { MCPServerBootstrap } from "../server/bootstrap.js";
import type { GA4Client } from "./client.js";
import type { MeasurementProtocolClient } from "./measurement.js";
import type { ILogger, ICache } from "../core/types.js";
import type { ICapabilitiesRegistry } from "../core/types.js";
import {
  runReportRequestSchema,
  runReportResponseSchema,
  batchRunReportsRequestSchema,
  batchRunReportsResponseSchema,
  runPivotReportRequestSchema,
  runPivotReportResponseSchema,
  runRealtimeReportRequestSchema,
  runRealtimeReportResponseSchema,
  measurementRequestSchema,
  measurementValidationResponseSchema,
  propertyListRequestSchema,
  propertyListResponseSchema,
  propertyGetRequestSchema,
  propertyGetResponseSchema,
  propertyUpsertRequestSchema,
  propertyUpsertResponseSchema,
  propertyDeleteRequestSchema,
  propertyDeleteResponseSchema,
  dataStreamListRequestSchema,
  dataStreamListResponseSchema,
  dataStreamGetRequestSchema,
  dataStreamGetResponseSchema,
  dataStreamUpsertRequestSchema,
  dataStreamUpsertResponseSchema,
  dataStreamDeleteRequestSchema,
  dataStreamDeleteResponseSchema,
  enhancedMeasurementGetRequestSchema,
  enhancedMeasurementResponseSchema,
  enhancedMeasurementUpdateRequestSchema,
  enhancedMeasurementUpdateResponseSchema,
  customDimensionListRequestSchema,
  customDimensionListResponseSchema,
  customDimensionGetRequestSchema,
  customDimensionGetResponseSchema,
  customDimensionUpsertRequestSchema,
  customDimensionUpsertResponseSchema,
  customDimensionDeleteRequestSchema,
  customDimensionDeleteResponseSchema,
  customMetricListRequestSchema,
  customMetricListResponseSchema,
  customMetricGetRequestSchema,
  customMetricGetResponseSchema,
  customMetricUpsertRequestSchema,
  customMetricUpsertResponseSchema,
  customMetricDeleteRequestSchema,
  customMetricDeleteResponseSchema,
  eventListRequestSchema,
  eventListResponseSchema,
  eventGetRequestSchema,
  eventGetResponseSchema,
  eventUpsertRequestSchema,
  eventUpsertResponseSchema,
  eventParameterListRequestSchema,
  eventParameterListResponseSchema,
  eventParameterUpsertRequestSchema,
  eventParameterUpsertResponseSchema,
  eventParameterDeleteRequestSchema,
  eventParameterDeleteResponseSchema,
  conversionListRequestSchema,
  conversionListResponseSchema,
  conversionGetRequestSchema,
  conversionGetResponseSchema,
  conversionUpsertRequestSchema,
  conversionUpsertResponseSchema,
  conversionDeleteRequestSchema,
  conversionDeleteResponseSchema,
  audienceListRequestSchema,
  audienceListResponseSchema,
  audienceGetRequestSchema,
  audienceGetResponseSchema,
  audienceUpsertRequestSchema,
  audienceUpsertResponseSchema,
  audienceDeleteRequestSchema,
  audienceDeleteResponseSchema,
  propertySettingsGetRequestSchema,
  propertySettingsResponseSchema,
  propertySettingsUpdateRequestSchema,
  googleSignalsGetRequestSchema,
  googleSignalsResponseSchema,
  googleSignalsUpdateRequestSchema,
  dataRetentionGetRequestSchema,
  dataRetentionResponseSchema,
  dataRetentionUpdateRequestSchema,
  dataFilterListRequestSchema,
  dataFilterListResponseSchema,
  dataFilterGetRequestSchema,
  dataFilterGetResponseSchema,
  dataFilterCreateRequestSchema,
  dataFilterCreateResponseSchema,
  dataFilterUpdateRequestSchema,
  dataFilterUpdateResponseSchema,
  dataFilterDeleteRequestSchema,
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
  measurementClient?: MeasurementProtocolClient;
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
  registerRealtimeSnapshotTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);

  // Measurement Protocol tools
  if (options.measurementClient) {
    registerMeasurementSendTool(bootstrap, options.measurementClient, logger);
    registerMeasurementValidateTool(bootstrap, options.measurementClient, logger);
  }

  // Admin API tools - Properties
  registerPropertyListTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerPropertyGetTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerPropertyUpsertTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerPropertyDeleteTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);

  // Admin API tools - Data Streams
  registerDataStreamListTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerDataStreamGetTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerDataStreamUpsertTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerDataStreamDeleteTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerEnhancedMeasurementGetTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerEnhancedMeasurementUpdateTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);

  // Admin API tools - Custom Dimensions
  registerCustomDimensionListTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerCustomDimensionGetTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerCustomDimensionUpsertTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerCustomDimensionDeleteTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);

  // Admin API tools - Custom Metrics
  registerCustomMetricListTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerCustomMetricGetTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerCustomMetricUpsertTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerCustomMetricDeleteTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);

  // Admin API tools - Events
  registerEventListTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerEventGetTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerEventUpsertTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerEventParameterListTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerEventParameterUpsertTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerEventParameterDeleteTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);

  // Admin API tools - Conversions
  registerConversionListTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerConversionGetTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerConversionUpsertTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerConversionDeleteTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);

  // Admin API tools - Audiences
  registerAudienceListTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerAudienceGetTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerAudienceUpsertTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerAudienceDeleteTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);

  // Admin API tools - Property Settings
  registerPropertySettingsGetTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerPropertySettingsUpdateTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);

  // Admin API tools - Google Signals
  registerGoogleSignalsGetTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerGoogleSignalsUpdateTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);

  // Admin API tools - Data Retention
  registerDataRetentionGetTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerDataRetentionUpdateTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);

  // Admin API tools - Data Filters
  registerDataFilterListTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerDataFilterGetTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerDataFilterCreateTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerDataFilterUpdateTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerDataFilterDeleteTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);

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

/**
 * Check cache and return if found (for realtime reports)
 */
async function checkRealtimeCacheAndReturn(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof runRealtimeReportResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for realtime report", { cacheKey });
    return validateSchema(runRealtimeReportResponseSchema, cached);
  }
  return null;
}

/**
 * Execute realtime API request and validate response
 */
async function executeRealtimeAPIRequest(
  validatedRequest: z.infer<typeof runRealtimeReportRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof runRealtimeReportResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "runRealtimeReport");
  const dataClient = ga4Client.getAnalyticsDataClient();

  const response = await dataClient.properties.runRealtimeReport({
    property: validatedRequest.property,
    requestBody: validatedRequest as never,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No data returned from GA4 API", {
      property: validatedRequest.property,
    });
  }

  return validateSchema(runRealtimeReportResponseSchema, responseData.data);
}

/**
 * Execute realtime snapshot operation
 */
async function executeRealtimeSnapshot(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<unknown> {
  const envelope = createOperationEnvelope({
    opName: "ga4.realtime.snapshot",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { property: string }).property },
  });

  logger.info("Executing ga4.realtime.snapshot", { opId: envelope.opId });

  // Validate input
  const validatedRequest = validateSchema(runRealtimeReportRequestSchema, args);

  // Pre-check: verify capability
  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "data_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Data API v1 capability not available",
      { product: "ga4" }
    );
  }

  // Check cache (shorter TTL for realtime data - 30 seconds)
  const cacheKey = `ga4:realtime:${envelope.idempotencyKey}`;
  const cached = await checkRealtimeCacheAndReturn(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  // Execute API request
  const validatedResponse = await executeRealtimeAPIRequest(validatedRequest, ga4Client);

  // Cache response (TTL: 30 seconds for realtime data)
  await cache.set(cacheKey, validatedResponse, 30000);

  logger.info("ga4.realtime.snapshot completed", {
    opId: envelope.opId,
    rowCount: validatedResponse.rowCount,
  });

  return validatedResponse;
}

/**
 * Register ga4.realtime.snapshot tool
 */
function registerRealtimeSnapshotTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.realtime.snapshot",
    description:
      "Get a real-time snapshot of GA4 data. Returns current active users, events, and other real-time metrics.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executeRealtimeSnapshot(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.realtime.snapshot failed", error);
        } else {
          logger.error("ga4.realtime.snapshot failed", new Error(String(error)));
        }
        throw error;
      }
    },
  });
}

/**
 * Execute measurement send operation
 */
async function executeMeasurementSend(
  args: unknown,
  measurementClient: MeasurementProtocolClient,
  logger: ILogger
): Promise<void> {
  const envelope = createOperationEnvelope({
    opName: "ga4.measurement.send",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", operation: "measurement.send" },
  });

  logger.info("Executing ga4.measurement.send", { opId: envelope.opId });

  // Validate input
  const validatedRequest = validateSchema(measurementRequestSchema, args);

  // Send event (cast to MeasurementRequest to satisfy exactOptionalPropertyTypes)
  await measurementClient.sendEvent(validatedRequest as Parameters<typeof measurementClient.sendEvent>[0]);

  logger.info("ga4.measurement.send completed", {
    opId: envelope.opId,
    eventCount: validatedRequest.events.length,
  });
}

/**
 * Register ga4.measurement.send tool
 */
function registerMeasurementSendTool(
  bootstrap: MCPServerBootstrap,
  measurementClient: MeasurementProtocolClient,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.measurement.send",
    description:
      "Send events via GA4 Measurement Protocol. Supports client_id, user_id, custom parameters, and user properties.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executeMeasurementSend(args, measurementClient, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.measurement.send failed", error);
        } else {
          logger.error("ga4.measurement.send failed", new Error(String(error)));
        }
        throw error;
      }
    },
  });
}

/**
 * Execute measurement validate operation
 */
async function executeMeasurementValidate(
  args: unknown,
  measurementClient: MeasurementProtocolClient,
  logger: ILogger
): Promise<z.infer<typeof measurementValidationResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.measurement.validate",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", operation: "measurement.validate" },
  });

  logger.info("Executing ga4.measurement.validate", { opId: envelope.opId });

  // Validate input
  const validatedRequest = validateSchema(measurementRequestSchema, args);

  // Validate event (cast to MeasurementRequest to satisfy exactOptionalPropertyTypes)
  const validationResult = await measurementClient.validateEvent(validatedRequest as Parameters<typeof measurementClient.validateEvent>[0]);

  // Validate response schema
  const validatedResponse = validateSchema(measurementValidationResponseSchema, validationResult);

  logger.info("ga4.measurement.validate completed", {
    opId: envelope.opId,
    messageCount: validatedResponse.validationMessages.length,
  });

  return validatedResponse;
}

/**
 * Register ga4.measurement.validate tool
 */
function registerMeasurementValidateTool(
  bootstrap: MCPServerBootstrap,
  measurementClient: MeasurementProtocolClient,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.measurement.validate",
    description:
      "Validate event structure via GA4 Measurement Protocol debug endpoint. Does not send events, only validates structure.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executeMeasurementValidate(args, measurementClient, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.measurement.validate failed", error);
        } else {
          logger.error("ga4.measurement.validate failed", new Error(String(error)));
        }
        throw error;
      }
    },
  });
}

/**
 * Check cache and return property settings if found
 */
async function checkPropertySettingsCache(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof propertySettingsResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for property settings", { cacheKey });
    return validateSchema(propertySettingsResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request to get property settings
 */
async function executePropertySettingsAPIRequest(
  property: string,
  ga4Client: GA4Client
): Promise<z.infer<typeof propertySettingsResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "getProperty");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const response = await adminClient.properties.get({
    name: property,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Property not found", {
      property,
    });
  }

  return validateSchema(propertySettingsResponseSchema, responseData.data);
}

/**
 * Execute property settings get operation
 */
async function executePropertySettingsGet(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof propertySettingsResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.property.settings.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { property: string }).property },
  });

  logger.info("Executing ga4.property.settings.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(propertySettingsGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const cacheKey = `ga4:property:${validatedRequest.property}:settings`;
  const cached = await checkPropertySettingsCache(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  const validatedResponse = await executePropertySettingsAPIRequest(validatedRequest.property, ga4Client);

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.property.settings.get completed", {
    opId: envelope.opId,
    property: validatedRequest.property,
  });

  return validatedResponse;
}

/**
 * Execute API request to list properties
 */
async function executePropertyListAPIRequest(
  validatedRequest: z.infer<typeof propertyListRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof propertyListResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "property.list");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  
  const params: Record<string, unknown> = {};
  if (validatedRequest.parent) {
    params.parent = validatedRequest.parent;
  }
  if (validatedRequest.pageSize) {
    params.pageSize = validatedRequest.pageSize;
  }
  if (validatedRequest.pageToken) {
    params.pageToken = validatedRequest.pageToken;
  }
  if (validatedRequest.filter) {
    params.filter = validatedRequest.filter;
  }
  if (validatedRequest.showDeleted !== undefined) {
    params.showDeleted = validatedRequest.showDeleted;
  }

  const response = await adminClient.properties.list(params);

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No properties found", {});
  }

  return validateSchema(propertyListResponseSchema, responseData.data);
}

/**
 * Execute property list operation
 */
async function executePropertyList(
  args: unknown,
  ga4Client: GA4Client,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof propertyListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.property.list",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4" },
  });

  logger.info("Executing ga4.property.list", { opId: envelope.opId });

  const validatedRequest = validateSchema(propertyListRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const validatedResponse = await executePropertyListAPIRequest(validatedRequest, ga4Client);

  logger.info("ga4.property.list completed", {
    opId: envelope.opId,
    propertyCount: validatedResponse.properties.length,
  });

  return validatedResponse;
}

/**
 * Register ga4.property.list tool
 */
function registerPropertyListTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.property.list",
    description: "List GA4 properties for an account",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Account ID in format accounts/123456789 (optional)",
        },
        pageSize: {
          type: "number",
          description: "Maximum number of properties to return (1-200)",
        },
        pageToken: {
          type: "string",
          description: "Token for pagination",
        },
        filter: {
          type: "string",
          description: "Filter expression for properties",
        },
        showDeleted: {
          type: "boolean",
          description: "Include deleted properties",
        },
      },
    },
    handler: async (args: unknown) => {
      try {
        return await executePropertyList(args, ga4Client, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.property.list failed", error);
        } else {
          logger.error("ga4.property.list failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Check cache and return property if found
 */
async function checkPropertyCache(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof propertyGetResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for property", { cacheKey });
    return validateSchema(propertyGetResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request to get property
 */
async function executePropertyGetAPIRequest(
  propertyName: string,
  ga4Client: GA4Client
): Promise<z.infer<typeof propertyGetResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "property.get");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const response = await adminClient.properties.get({
    name: propertyName,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Property not found", {
      property: propertyName,
    });
  }

  return validateSchema(propertyGetResponseSchema, responseData.data);
}

/**
 * Execute property get operation
 */
async function executePropertyGet(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof propertyGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.property.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { name: string }).name },
  });

  logger.info("Executing ga4.property.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(propertyGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const cacheKey = `ga4:property:${validatedRequest.name}`;
  const cached = await checkPropertyCache(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  const validatedResponse = await executePropertyGetAPIRequest(validatedRequest.name, ga4Client);

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.property.get completed", {
    opId: envelope.opId,
    property: validatedRequest.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.property.get tool
 */
function registerPropertyGetTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.property.get",
    description: "Get GA4 property details by property ID",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Property ID in format properties/123456789",
        },
      },
      required: ["name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executePropertyGet(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.property.get failed", error);
        } else {
          logger.error("ga4.property.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to create/update property
 */
async function executePropertyUpsertAPIRequest(
  validatedRequest: z.infer<typeof propertyUpsertRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof propertyUpsertResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "property.upsert");
  const adminClient = ga4Client.getAnalyticsAdminClient();

  const propertyData: Record<string, unknown> = {
    displayName: validatedRequest.displayName,
  };
  if (validatedRequest.timeZone) {
    propertyData.timeZone = validatedRequest.timeZone;
  }
  if (validatedRequest.currencyCode) {
    propertyData.currencyCode = validatedRequest.currencyCode;
  }
  if (validatedRequest.industryCategory) {
    propertyData.industryCategory = validatedRequest.industryCategory;
  }
  if (validatedRequest.propertyType) {
    propertyData.propertyType = validatedRequest.propertyType;
  }

  let response;
  if (validatedRequest.name) {
    // Update existing property
    response = await adminClient.properties.patch({
      name: validatedRequest.name,
      updateMask: "displayName,timeZone,currencyCode,industryCategory,propertyType",
      requestBody: propertyData,
    });
  } else {
    // Create new property
    propertyData.parent = validatedRequest.parent;
    response = await adminClient.properties.create({
      requestBody: propertyData,
    });
  }

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Property operation failed", {});
  }

  return validateSchema(propertyUpsertResponseSchema, responseData.data);
}

/**
 * Execute property upsert operation with pre/post validation
 */
async function executePropertyUpsert(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof propertyUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.property.upsert",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      ...((args as { name?: string }).name ? { propertyId: (args as { name: string }).name } : {}),
      accountId: (args as { parent: string }).parent,
    },
  });

  logger.info("Executing ga4.property.upsert", { opId: envelope.opId });

  const validatedRequest = validateSchema(propertyUpsertRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  // Pre-check: if updating, verify property exists
  if (validatedRequest.name) {
    await ga4Client.checkRateLimit("ga4", "property.get");
    const adminClient = ga4Client.getAnalyticsAdminClient();
    try {
      await adminClient.properties.get({ name: validatedRequest.name });
    } catch {
      throw createPreconditionError("not_found", "Property not found", {
        property: validatedRequest.name,
      });
    }
  }

  const validatedResponse = await executePropertyUpsertAPIRequest(validatedRequest, ga4Client);

  // Post-check: verify property was created/updated
  const cacheKey = `ga4:property:${validatedResponse.name}`;
  await cache.invalidate(cacheKey);
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.property.upsert completed", {
    opId: envelope.opId,
    property: validatedResponse.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.property.upsert tool
 */
function registerPropertyUpsertTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.property.upsert",
    description: "Create or update GA4 property",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Account ID in format accounts/123456789 (required for create)",
        },
        name: {
          type: "string",
          description: "Property ID in format properties/123456789 (required for update)",
        },
        displayName: {
          type: "string",
          description: "Property display name",
        },
        timeZone: {
          type: "string",
          description: "Property timezone (e.g., America/New_York)",
        },
        currencyCode: {
          type: "string",
          description: "Property currency code (e.g., USD)",
        },
        industryCategory: {
          type: "string",
          description: "Industry category",
        },
        propertyType: {
          type: "string",
          enum: ["PROPERTY_TYPE_ORDINARY", "PROPERTY_TYPE_SUBPROPERTY", "PROPERTY_TYPE_ROLLUP"],
          description: "Property type",
        },
      },
      required: ["displayName"],
    },
    handler: async (args: unknown) => {
      try {
        return await executePropertyUpsert(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.property.upsert failed", error);
        } else {
          logger.error("ga4.property.upsert failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute property delete operation with rollback
 */
async function executePropertyDelete(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof propertyDeleteResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.property.delete",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { name: string }).name,
    },
  });

  logger.info("Executing ga4.property.delete", { opId: envelope.opId });

  const validatedRequest = validateSchema(propertyDeleteRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  // Pre-check: verify property exists
  await ga4Client.checkRateLimit("ga4", "property.get");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  try {
    await adminClient.properties.get({ name: validatedRequest.name });
  } catch {
    throw createPreconditionError("not_found", "Property not found", {
      property: validatedRequest.name,
    });
  }

  // Delete property
  await ga4Client.checkRateLimit("ga4", "property.delete");
  try {
    await adminClient.properties.delete({
      name: validatedRequest.name,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Property delete failed, rollback not needed", error);
    } else {
      logger.error("Property delete failed, rollback not needed", new Error(String(error)));
    }
    throw error;
  }

  // Post-check: verify property was deleted
  try {
    await adminClient.properties.get({ name: validatedRequest.name });
    // If we get here, property still exists - rollback scenario
    logger.warn("Property delete post-check failed - property still exists", {
      property: validatedRequest.name,
    });
    throw createPreconditionError("precheck_failed", "Property deletion failed", {
      property: validatedRequest.name,
    });
  } catch (error) {
    // Expected: property should not exist
    if (error instanceof Error && error.message.includes("not found")) {
      // Success - property deleted
    } else {
      throw error;
    }
  }

  // Invalidate cache
  const cacheKey = `ga4:property:${validatedRequest.name}`;
  await cache.delete(cacheKey);

  logger.info("ga4.property.delete completed", {
    opId: envelope.opId,
    property: validatedRequest.name,
  });

  return {
    success: true,
    name: validatedRequest.name,
  };
}

/**
 * Register ga4.property.delete tool
 */
function registerPropertyDeleteTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.property.delete",
    description: "Delete GA4 property",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Property ID in format properties/123456789",
        },
      },
      required: ["name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executePropertyDelete(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.property.delete failed", error);
        } else {
          logger.error("ga4.property.delete failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to list data streams
 */
async function executeDataStreamListAPIRequest(
  validatedRequest: z.infer<typeof dataStreamListRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof dataStreamListResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "datastream.list");
  const adminClient = ga4Client.getAnalyticsAdminClient();

  const params: Record<string, unknown> = {
    parent: validatedRequest.parent,
  };
  if (validatedRequest.pageSize) {
    params.pageSize = validatedRequest.pageSize;
  }
  if (validatedRequest.pageToken) {
    params.pageToken = validatedRequest.pageToken;
  }

  const response = await adminClient.properties.dataStreams.list(params);

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No data streams found", {});
  }

  return validateSchema(dataStreamListResponseSchema, responseData.data);
}

/**
 * Execute data stream list operation
 */
async function executeDataStreamList(
  args: unknown,
  ga4Client: GA4Client,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof dataStreamListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.datastream.list",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { parent: string }).parent },
  });

  logger.info("Executing ga4.datastream.list", { opId: envelope.opId });

  const validatedRequest = validateSchema(dataStreamListRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const validatedResponse = await executeDataStreamListAPIRequest(validatedRequest, ga4Client);

  logger.info("ga4.datastream.list completed", {
    opId: envelope.opId,
    streamCount: validatedResponse.dataStreams.length,
  });

  return validatedResponse;
}

/**
 * Register ga4.datastream.list tool
 */
function registerDataStreamListTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.datastream.list",
    description: "List data streams for a GA4 property",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Property ID in format properties/123456789",
        },
        pageSize: {
          type: "number",
          description: "Maximum number of streams to return (1-200)",
        },
        pageToken: {
          type: "string",
          description: "Token for pagination",
        },
      },
      required: ["parent"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeDataStreamList(args, ga4Client, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.datastream.list failed", error);
        } else {
          logger.error("ga4.datastream.list failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Check cache and return data stream if found
 */
async function checkDataStreamCache(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof dataStreamGetResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for data stream", { cacheKey });
    return validateSchema(dataStreamGetResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request to get data stream
 */
async function executeDataStreamGetAPIRequest(
  streamName: string,
  ga4Client: GA4Client
): Promise<z.infer<typeof dataStreamGetResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "datastream.get");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const response = await adminClient.properties.dataStreams.get({
    name: streamName,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Data stream not found", {
      stream: streamName,
    });
  }

  return validateSchema(dataStreamGetResponseSchema, responseData.data);
}

/**
 * Execute data stream get operation
 */
async function executeDataStreamGet(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof dataStreamGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.datastream.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { name: string }).name.split("/dataStreams/")[0] || "",
    },
  });

  logger.info("Executing ga4.datastream.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(dataStreamGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const cacheKey = `ga4:datastream:${validatedRequest.name}`;
  const cached = await checkDataStreamCache(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  const validatedResponse = await executeDataStreamGetAPIRequest(validatedRequest.name, ga4Client);

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.datastream.get completed", {
    opId: envelope.opId,
    stream: validatedRequest.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.datastream.get tool
 */
function registerDataStreamGetTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.datastream.get",
    description: "Get GA4 data stream details by stream ID",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Data stream ID in format properties/123456789/dataStreams/987654321",
        },
      },
      required: ["name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeDataStreamGet(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.datastream.get failed", error);
        } else {
          logger.error("ga4.datastream.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to create/update data stream
 */
async function executeDataStreamUpsertAPIRequest(
  validatedRequest: z.infer<typeof dataStreamUpsertRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof dataStreamUpsertResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "datastream.upsert");
  const adminClient = ga4Client.getAnalyticsAdminClient();

  const streamData: Record<string, unknown> = {
    displayName: validatedRequest.displayName,
    type: validatedRequest.type,
  };
  if (validatedRequest.webStreamData) {
    streamData.webStreamData = validatedRequest.webStreamData;
  }
  if (validatedRequest.iosAppStreamData) {
    streamData.iosAppStreamData = validatedRequest.iosAppStreamData;
  }
  if (validatedRequest.androidAppStreamData) {
    streamData.androidAppStreamData = validatedRequest.androidAppStreamData;
  }

  let response;
  if (validatedRequest.name) {
    // Update existing stream
    response = await adminClient.properties.dataStreams.patch({
      name: validatedRequest.name,
      updateMask: "displayName,webStreamData,iosAppStreamData,androidAppStreamData",
      requestBody: streamData,
    });
  } else {
    // Create new stream
    streamData.parent = validatedRequest.parent;
    response = await adminClient.properties.dataStreams.create({
      requestBody: streamData,
    });
  }

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Data stream operation failed", {});
  }

  return validateSchema(dataStreamUpsertResponseSchema, responseData.data);
}

/**
 * Execute data stream upsert operation with pre/post validation
 */
async function executeDataStreamUpsert(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof dataStreamUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.datastream.upsert",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      ...((args as { name?: string }).name
        ? { propertyId: (args as { name: string }).name.split("/dataStreams/")[0] || "" }
        : { propertyId: (args as { parent: string }).parent }),
    },
  });

  logger.info("Executing ga4.datastream.upsert", { opId: envelope.opId });

  const validatedRequest = validateSchema(dataStreamUpsertRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  // Pre-check: if updating, verify stream exists
  if (validatedRequest.name) {
    await ga4Client.checkRateLimit("ga4", "datastream.get");
    const adminClient = ga4Client.getAnalyticsAdminClient();
    try {
      await adminClient.properties.dataStreams.get({ name: validatedRequest.name });
    } catch {
      throw createPreconditionError("not_found", "Data stream not found", {
        stream: validatedRequest.name,
      });
    }
  }

  const validatedResponse = await executeDataStreamUpsertAPIRequest(validatedRequest, ga4Client);

  // Post-check: verify stream was created/updated
  const cacheKey = `ga4:datastream:${validatedResponse.name}`;
  await cache.invalidate(cacheKey);
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.datastream.upsert completed", {
    opId: envelope.opId,
    stream: validatedResponse.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.datastream.upsert tool
 */
function registerDataStreamUpsertTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.datastream.upsert",
    description: "Create or update GA4 data stream",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Property ID in format properties/123456789 (required for create)",
        },
        name: {
          type: "string",
          description: "Data stream ID in format properties/123456789/dataStreams/987654321 (required for update)",
        },
        displayName: {
          type: "string",
          description: "Data stream display name",
        },
        type: {
          type: "string",
          enum: ["WEB_DATA_STREAM", "IOS_APP_DATA_STREAM", "ANDROID_APP_DATA_STREAM"],
          description: "Data stream type",
        },
        webStreamData: {
          type: "object",
          properties: {
            defaultUri: {
              type: "string",
              description: "Default URI for web stream",
            },
          },
          description: "Web stream data (required for WEB_DATA_STREAM)",
        },
        iosAppStreamData: {
          type: "object",
          properties: {
            bundleId: {
              type: "string",
              description: "iOS bundle ID",
            },
          },
          description: "iOS app stream data (required for IOS_APP_DATA_STREAM)",
        },
        androidAppStreamData: {
          type: "object",
          properties: {
            packageName: {
              type: "string",
              description: "Android package name",
            },
          },
          description: "Android app stream data (required for ANDROID_APP_DATA_STREAM)",
        },
      },
      required: ["parent", "displayName", "type"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeDataStreamUpsert(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.datastream.upsert failed", error);
        } else {
          logger.error("ga4.datastream.upsert failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute data stream delete operation with rollback
 */
async function executeDataStreamDelete(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof dataStreamDeleteResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.datastream.delete",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { name: string }).name.split("/dataStreams/")[0] || "",
    },
  });

  logger.info("Executing ga4.datastream.delete", { opId: envelope.opId });

  const validatedRequest = validateSchema(dataStreamDeleteRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  // Pre-check: verify stream exists
  await ga4Client.checkRateLimit("ga4", "datastream.get");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  try {
    await adminClient.properties.dataStreams.get({ name: validatedRequest.name });
  } catch {
    throw createPreconditionError("not_found", "Data stream not found", {
      stream: validatedRequest.name,
    });
  }

  // Delete stream
  await ga4Client.checkRateLimit("ga4", "datastream.delete");
  try {
    await adminClient.properties.dataStreams.delete({
      name: validatedRequest.name,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Data stream delete failed, rollback not needed", error);
    } else {
      logger.error("Data stream delete failed, rollback not needed", new Error(String(error)));
    }
    throw error;
  }

  // Post-check: verify stream was deleted
  try {
    await adminClient.properties.dataStreams.get({ name: validatedRequest.name });
    // If we get here, stream still exists - rollback scenario
    logger.warn("Data stream delete post-check failed - stream still exists", {
      stream: validatedRequest.name,
    });
    throw createPreconditionError("precheck_failed", "Data stream deletion failed", {
      stream: validatedRequest.name,
    });
  } catch (error) {
    // Expected: stream should not exist
    if (error instanceof Error && error.message.includes("not found")) {
      // Success - stream deleted
    } else {
      throw error;
    }
  }

  // Invalidate cache
  const cacheKey = `ga4:datastream:${validatedRequest.name}`;
  await cache.delete(cacheKey);

  logger.info("ga4.datastream.delete completed", {
    opId: envelope.opId,
    stream: validatedRequest.name,
  });

  return {
    success: true,
    name: validatedRequest.name,
  };
}

/**
 * Register ga4.datastream.delete tool
 */
function registerDataStreamDeleteTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.datastream.delete",
    description: "Delete GA4 data stream",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Data stream ID in format properties/123456789/dataStreams/987654321",
        },
      },
      required: ["name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeDataStreamDelete(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.datastream.delete failed", error);
        } else {
          logger.error("ga4.datastream.delete failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to get enhanced measurement settings
 */
async function executeEnhancedMeasurementGetAPIRequest(
  streamName: string,
  ga4Client: GA4Client
): Promise<z.infer<typeof enhancedMeasurementResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "getEnhancedMeasurementSettings");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const response = (await (
    adminClient.properties.dataStreams as {
      getEnhancedMeasurementSettings?: (params: { name: string }) => Promise<{ data?: unknown }>;
    }
  ).getEnhancedMeasurementSettings?.({
    name: `${streamName}/enhancedMeasurementSettings`,
  })) as { data?: unknown };

  if (!response || !response.data) {
    throw createPreconditionError("not_found", "Enhanced measurement settings not found", {
      stream: streamName,
    });
  }

  return validateSchema(enhancedMeasurementResponseSchema, response.data);
}

/**
 * Execute enhanced measurement get operation
 */
async function executeEnhancedMeasurementGet(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof enhancedMeasurementResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.datastream.enhancedMeasurement.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { name: string }).name.split("/dataStreams/")[0] || "",
    },
  });

  logger.info("Executing ga4.datastream.enhancedMeasurement.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(enhancedMeasurementGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const cacheKey = `ga4:datastream:${validatedRequest.name}:enhancedMeasurement`;
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for enhanced measurement", { cacheKey });
    return validateSchema(enhancedMeasurementResponseSchema, cached);
  }

  const validatedResponse = await executeEnhancedMeasurementGetAPIRequest(
    validatedRequest.name,
    ga4Client
  );

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.datastream.enhancedMeasurement.get completed", {
    opId: envelope.opId,
    stream: validatedRequest.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.datastream.enhancedMeasurement.get tool
 */
function registerEnhancedMeasurementGetTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.datastream.enhancedMeasurement.get",
    description: "Get enhanced measurement settings for a GA4 data stream",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Data stream name in format properties/123456789/dataStreams/987654321",
        },
      },
      required: ["name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeEnhancedMeasurementGet(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.datastream.enhancedMeasurement.get failed", error);
        } else {
          logger.error("ga4.datastream.enhancedMeasurement.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to update enhanced measurement settings
 */
async function executeEnhancedMeasurementUpdateAPIRequest(
  streamName: string,
  settings: z.infer<typeof enhancedMeasurementUpdateRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof enhancedMeasurementUpdateResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "updateEnhancedMeasurementSettings");
  const adminClient = ga4Client.getAnalyticsAdminClient();

  const settingsData: Record<string, unknown> = {};
  if (settings.streamEnabled !== undefined) {
    settingsData.streamEnabled = settings.streamEnabled;
  }
  if (settings.scrollsEnabled !== undefined) {
    settingsData.scrollsEnabled = settings.scrollsEnabled;
  }
  if (settings.scrollsThresholdPercent !== undefined) {
    settingsData.scrollsThresholdPercent = settings.scrollsThresholdPercent;
  }
  if (settings.outboundClicksEnabled !== undefined) {
    settingsData.outboundClicksEnabled = settings.outboundClicksEnabled;
  }
  if (settings.siteSearchEnabled !== undefined) {
    settingsData.siteSearchEnabled = settings.siteSearchEnabled;
  }
  if (settings.videoEngagementEnabled !== undefined) {
    settingsData.videoEngagementEnabled = settings.videoEngagementEnabled;
  }
  if (settings.fileDownloadsEnabled !== undefined) {
    settingsData.fileDownloadsEnabled = settings.fileDownloadsEnabled;
  }
  if (settings.pageChangesEnabled !== undefined) {
    settingsData.pageChangesEnabled = settings.pageChangesEnabled;
  }
  if (settings.pageViewsEnabled !== undefined) {
    settingsData.pageViewsEnabled = settings.pageViewsEnabled;
  }

  const response = (await (
    adminClient.properties.dataStreams as {
      updateEnhancedMeasurementSettings?: (params: {
        name: string;
        updateMask?: string;
        requestBody?: Record<string, unknown>;
      }) => Promise<{ data?: unknown }>;
    }
  ).updateEnhancedMeasurementSettings?.({
    name: `${streamName}/enhancedMeasurementSettings`,
    updateMask: Object.keys(settingsData).join(","),
    requestBody: settingsData,
  })) as { data?: unknown };

  if (!response || !response.data) {
    throw createPreconditionError("not_found", "Enhanced measurement update failed", {
      stream: streamName,
    });
  }

  return validateSchema(enhancedMeasurementUpdateResponseSchema, response.data);
}

/**
 * Execute enhanced measurement update operation
 */
async function executeEnhancedMeasurementUpdate(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof enhancedMeasurementUpdateResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.datastream.enhancedMeasurement.update",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { name: string }).name.split("/dataStreams/")[0] || "",
    },
  });

  logger.info("Executing ga4.datastream.enhancedMeasurement.update", { opId: envelope.opId });

  const validatedRequest = validateSchema(enhancedMeasurementUpdateRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const validatedResponse = await executeEnhancedMeasurementUpdateAPIRequest(
    validatedRequest.name,
    validatedRequest,
    ga4Client
  );

  // Invalidate cache
  const cacheKey = `ga4:datastream:${validatedRequest.name}:enhancedMeasurement`;
  await cache.invalidate(cacheKey);
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.datastream.enhancedMeasurement.update completed", {
    opId: envelope.opId,
    stream: validatedRequest.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.datastream.enhancedMeasurement.update tool
 */
function registerEnhancedMeasurementUpdateTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.datastream.enhancedMeasurement.update",
    description: "Update enhanced measurement settings for a GA4 data stream",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Data stream name in format properties/123456789/dataStreams/987654321",
        },
        streamEnabled: {
          type: "boolean",
          description: "Enable/disable enhanced measurement",
        },
        scrollsEnabled: {
          type: "boolean",
          description: "Enable scroll tracking",
        },
        scrollsThresholdPercent: {
          type: "number",
          description: "Scroll threshold percentage (0-100)",
        },
        outboundClicksEnabled: {
          type: "boolean",
          description: "Enable outbound click tracking",
        },
        siteSearchEnabled: {
          type: "boolean",
          description: "Enable site search tracking",
        },
        videoEngagementEnabled: {
          type: "boolean",
          description: "Enable video engagement tracking",
        },
        fileDownloadsEnabled: {
          type: "boolean",
          description: "Enable file download tracking",
        },
        pageChangesEnabled: {
          type: "boolean",
          description: "Enable page change tracking",
        },
        pageViewsEnabled: {
          type: "boolean",
          description: "Enable page view tracking",
        },
      },
      required: ["name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeEnhancedMeasurementUpdate(
          args,
          ga4Client,
          cache,
          capabilitiesRegistry,
          logger
        );
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.datastream.enhancedMeasurement.update failed", error);
        } else {
          logger.error("ga4.datastream.enhancedMeasurement.update failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to list custom dimensions
 */
async function executeCustomDimensionListAPIRequest(
  validatedRequest: z.infer<typeof customDimensionListRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof customDimensionListResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "customDimension.list");
  const adminClient = ga4Client.getAnalyticsAdminClient();

  const params: Record<string, unknown> = {
    parent: validatedRequest.parent,
  };
  if (validatedRequest.pageSize) {
    params.pageSize = validatedRequest.pageSize;
  }
  if (validatedRequest.pageToken) {
    params.pageToken = validatedRequest.pageToken;
  }

  const response = await adminClient.properties.customDimensions.list(params);

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No custom dimensions found", {});
  }

  return validateSchema(customDimensionListResponseSchema, responseData.data);
}

/**
 * Execute custom dimension list operation
 */
async function executeCustomDimensionList(
  args: unknown,
  ga4Client: GA4Client,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof customDimensionListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.customDimension.list",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { parent: string }).parent },
  });

  logger.info("Executing ga4.customDimension.list", { opId: envelope.opId });

  const validatedRequest = validateSchema(customDimensionListRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const validatedResponse = await executeCustomDimensionListAPIRequest(validatedRequest, ga4Client);

  logger.info("ga4.customDimension.list completed", {
    opId: envelope.opId,
    dimensionCount: validatedResponse.customDimensions.length,
  });

  return validatedResponse;
}

/**
 * Register ga4.customDimension.list tool
 */
function registerCustomDimensionListTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.customDimension.list",
    description: "List custom dimensions for a GA4 property",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Property ID in format properties/123456789",
        },
        pageSize: {
          type: "number",
          description: "Maximum number of dimensions to return (1-200)",
        },
        pageToken: {
          type: "string",
          description: "Token for pagination",
        },
      },
      required: ["parent"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeCustomDimensionList(args, ga4Client, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.customDimension.list failed", error);
        } else {
          logger.error("ga4.customDimension.list failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Check cache and return custom dimension if found
 */
async function checkCustomDimensionCache(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof customDimensionGetResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for custom dimension", { cacheKey });
    return validateSchema(customDimensionGetResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request to get custom dimension
 */
async function executeCustomDimensionGetAPIRequest(
  dimensionName: string,
  ga4Client: GA4Client
): Promise<z.infer<typeof customDimensionGetResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "customDimension.get");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const response = await adminClient.properties.customDimensions.get({
    name: dimensionName,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Custom dimension not found", {
      dimension: dimensionName,
    });
  }

  return validateSchema(customDimensionGetResponseSchema, responseData.data);
}

/**
 * Execute custom dimension get operation
 */
async function executeCustomDimensionGet(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof customDimensionGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.customDimension.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { name: string }).name.split("/customDimensions/")[0] || "",
    },
  });

  logger.info("Executing ga4.customDimension.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(customDimensionGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const cacheKey = `ga4:customDimension:${validatedRequest.name}`;
  const cached = await checkCustomDimensionCache(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  const validatedResponse = await executeCustomDimensionGetAPIRequest(
    validatedRequest.name,
    ga4Client
  );

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.customDimension.get completed", {
    opId: envelope.opId,
    dimension: validatedRequest.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.customDimension.get tool
 */
function registerCustomDimensionGetTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.customDimension.get",
    description: "Get GA4 custom dimension details by dimension ID",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Custom dimension ID in format properties/123456789/customDimensions/dimension_name",
        },
      },
      required: ["name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeCustomDimensionGet(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.customDimension.get failed", error);
        } else {
          logger.error("ga4.customDimension.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to create/update custom dimension
 */
async function executeCustomDimensionUpsertAPIRequest(
  validatedRequest: z.infer<typeof customDimensionUpsertRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof customDimensionUpsertResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "customDimension.upsert");
  const adminClient = ga4Client.getAnalyticsAdminClient();

  const dimensionData: Record<string, unknown> = {
    parameterName: validatedRequest.parameterName,
    scope: validatedRequest.scope,
  };
  if (validatedRequest.displayName) {
    dimensionData.displayName = validatedRequest.displayName;
  }
  if (validatedRequest.description) {
    dimensionData.description = validatedRequest.description;
  }
  if (validatedRequest.disallowAdsPersonalization !== undefined) {
    dimensionData.disallowAdsPersonalization = validatedRequest.disallowAdsPersonalization;
  }

  // Check if dimension exists by trying to get it
  const dimensionName = `${validatedRequest.parent}/customDimensions/${validatedRequest.parameterName}`;
  let response;
  try {
    await adminClient.properties.customDimensions.get({ name: dimensionName });
    // Dimension exists, update it
    response = await adminClient.properties.customDimensions.patch({
      name: dimensionName,
      updateMask: "displayName,description,disallowAdsPersonalization",
      requestBody: dimensionData,
    });
  } catch {
    // Dimension doesn't exist, create it
    dimensionData.parent = validatedRequest.parent;
    response = await adminClient.properties.customDimensions.create({
      requestBody: dimensionData,
    });
  }

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Custom dimension operation failed", {});
  }

  return validateSchema(customDimensionUpsertResponseSchema, responseData.data);
}

/**
 * Execute custom dimension upsert operation with pre/post validation
 */
async function executeCustomDimensionUpsert(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof customDimensionUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.customDimension.upsert",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { parent: string }).parent,
    },
  });

  logger.info("Executing ga4.customDimension.upsert", { opId: envelope.opId });

  const validatedRequest = validateSchema(customDimensionUpsertRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const validatedResponse = await executeCustomDimensionUpsertAPIRequest(validatedRequest, ga4Client);

  // Post-check: verify dimension was created/updated
  const cacheKey = `ga4:customDimension:${validatedResponse.name}`;
  await cache.invalidate(cacheKey);
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.customDimension.upsert completed", {
    opId: envelope.opId,
    dimension: validatedResponse.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.customDimension.upsert tool
 */
function registerCustomDimensionUpsertTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.customDimension.upsert",
    description: "Create or update GA4 custom dimension (supports USER, EVENT, ITEM scopes)",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Property ID in format properties/123456789",
        },
        parameterName: {
          type: "string",
          description: "Parameter name for the custom dimension",
        },
        displayName: {
          type: "string",
          description: "Display name for the custom dimension",
        },
        description: {
          type: "string",
          description: "Description of the custom dimension",
        },
        scope: {
          type: "string",
          enum: ["USER", "EVENT", "ITEM"],
          description: "Scope of the custom dimension",
        },
        disallowAdsPersonalization: {
          type: "boolean",
          description: "Disallow ads personalization for this dimension",
        },
      },
      required: ["parent", "parameterName", "scope"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeCustomDimensionUpsert(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.customDimension.upsert failed", error);
        } else {
          logger.error("ga4.customDimension.upsert failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute custom dimension delete operation (archive)
 */
async function executeCustomDimensionDelete(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof customDimensionDeleteResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.customDimension.delete",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { name: string }).name.split("/customDimensions/")[0] || "",
    },
  });

  logger.info("Executing ga4.customDimension.delete", { opId: envelope.opId });

  const validatedRequest = validateSchema(customDimensionDeleteRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  // Pre-check: verify dimension exists
  await ga4Client.checkRateLimit("ga4", "customDimension.get");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  try {
    await adminClient.properties.customDimensions.get({ name: validatedRequest.name });
  } catch {
    throw createPreconditionError("not_found", "Custom dimension not found", {
      dimension: validatedRequest.name,
    });
  }

  // Archive dimension (GA4 uses archive, not delete)
  await ga4Client.checkRateLimit("ga4", "customDimension.archive");
  try {
    await adminClient.properties.customDimensions.archive({
      name: validatedRequest.name,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Custom dimension archive failed", error);
    } else {
      logger.error("Custom dimension archive failed", new Error(String(error)));
    }
    throw error;
  }

  // Invalidate cache
  const cacheKey = `ga4:customDimension:${validatedRequest.name}`;
  await cache.delete(cacheKey);

  logger.info("ga4.customDimension.delete completed", {
    opId: envelope.opId,
    dimension: validatedRequest.name,
  });

  return {
    success: true,
    name: validatedRequest.name,
  };
}

/**
 * Register ga4.customDimension.delete tool
 */
function registerCustomDimensionDeleteTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.customDimension.delete",
    description: "Archive (delete) GA4 custom dimension",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Custom dimension ID in format properties/123456789/customDimensions/dimension_name",
        },
      },
      required: ["name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeCustomDimensionDelete(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.customDimension.delete failed", error);
        } else {
          logger.error("ga4.customDimension.delete failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to list custom metrics
 */
async function executeCustomMetricListAPIRequest(
  validatedRequest: z.infer<typeof customMetricListRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof customMetricListResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "customMetric.list");
  const adminClient = ga4Client.getAnalyticsAdminClient();

  const params: Record<string, unknown> = {
    parent: validatedRequest.parent,
  };
  if (validatedRequest.pageSize) {
    params.pageSize = validatedRequest.pageSize;
  }
  if (validatedRequest.pageToken) {
    params.pageToken = validatedRequest.pageToken;
  }

  const response = await adminClient.properties.customMetrics.list(params);

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No custom metrics found", {});
  }

  return validateSchema(customMetricListResponseSchema, responseData.data);
}

/**
 * Execute custom metric list operation
 */
async function executeCustomMetricList(
  args: unknown,
  ga4Client: GA4Client,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof customMetricListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.customMetric.list",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { parent: string }).parent },
  });

  logger.info("Executing ga4.customMetric.list", { opId: envelope.opId });

  const validatedRequest = validateSchema(customMetricListRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const validatedResponse = await executeCustomMetricListAPIRequest(validatedRequest, ga4Client);

  logger.info("ga4.customMetric.list completed", {
    opId: envelope.opId,
    metricCount: validatedResponse.customMetrics.length,
  });

  return validatedResponse;
}

/**
 * Register ga4.customMetric.list tool
 */
function registerCustomMetricListTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.customMetric.list",
    description: "List custom metrics for a GA4 property",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Property ID in format properties/123456789",
        },
        pageSize: {
          type: "number",
          description: "Maximum number of metrics to return (1-200)",
        },
        pageToken: {
          type: "string",
          description: "Token for pagination",
        },
      },
      required: ["parent"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeCustomMetricList(args, ga4Client, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.customMetric.list failed", error);
        } else {
          logger.error("ga4.customMetric.list failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Check cache and return custom metric if found
 */
async function checkCustomMetricCache(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof customMetricGetResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for custom metric", { cacheKey });
    return validateSchema(customMetricGetResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request to get custom metric
 */
async function executeCustomMetricGetAPIRequest(
  metricName: string,
  ga4Client: GA4Client
): Promise<z.infer<typeof customMetricGetResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "customMetric.get");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const response = await adminClient.properties.customMetrics.get({
    name: metricName,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Custom metric not found", {
      metric: metricName,
    });
  }

  return validateSchema(customMetricGetResponseSchema, responseData.data);
}

/**
 * Execute custom metric get operation
 */
async function executeCustomMetricGet(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof customMetricGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.customMetric.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { name: string }).name.split("/customMetrics/")[0] || "",
    },
  });

  logger.info("Executing ga4.customMetric.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(customMetricGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const cacheKey = `ga4:customMetric:${validatedRequest.name}`;
  const cached = await checkCustomMetricCache(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  const validatedResponse = await executeCustomMetricGetAPIRequest(validatedRequest.name, ga4Client);

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.customMetric.get completed", {
    opId: envelope.opId,
    metric: validatedRequest.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.customMetric.get tool
 */
function registerCustomMetricGetTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.customMetric.get",
    description: "Get GA4 custom metric details by metric ID",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Custom metric ID in format properties/123456789/customMetrics/metric_name",
        },
      },
      required: ["name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeCustomMetricGet(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.customMetric.get failed", error);
        } else {
          logger.error("ga4.customMetric.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to create/update custom metric
 */
async function executeCustomMetricUpsertAPIRequest(
  validatedRequest: z.infer<typeof customMetricUpsertRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof customMetricUpsertResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "customMetric.upsert");
  const adminClient = ga4Client.getAnalyticsAdminClient();

  const metricData: Record<string, unknown> = {
    parameterName: validatedRequest.parameterName,
    scope: validatedRequest.scope,
    type: validatedRequest.type,
  };
  if (validatedRequest.displayName) {
    metricData.displayName = validatedRequest.displayName;
  }
  if (validatedRequest.description) {
    metricData.description = validatedRequest.description;
  }
  if (validatedRequest.measurementUnit) {
    metricData.measurementUnit = validatedRequest.measurementUnit;
  }

  // Check if metric exists by trying to get it
  const metricName = `${validatedRequest.parent}/customMetrics/${validatedRequest.parameterName}`;
  let response;
  try {
    await adminClient.properties.customMetrics.get({ name: metricName });
    // Metric exists, update it
    response = await adminClient.properties.customMetrics.patch({
      name: metricName,
      updateMask: "displayName,description,measurementUnit",
      requestBody: metricData,
    });
  } catch {
    // Metric doesn't exist, create it
    metricData.parent = validatedRequest.parent;
    response = await adminClient.properties.customMetrics.create({
      requestBody: metricData,
    });
  }

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Custom metric operation failed", {});
  }

  return validateSchema(customMetricUpsertResponseSchema, responseData.data);
}

/**
 * Execute custom metric upsert operation with pre/post validation
 */
async function executeCustomMetricUpsert(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof customMetricUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.customMetric.upsert",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { parent: string }).parent,
    },
  });

  logger.info("Executing ga4.customMetric.upsert", { opId: envelope.opId });

  const validatedRequest = validateSchema(customMetricUpsertRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const validatedResponse = await executeCustomMetricUpsertAPIRequest(validatedRequest, ga4Client);

  // Post-check: verify metric was created/updated
  const cacheKey = `ga4:customMetric:${validatedResponse.name}`;
  await cache.invalidate(cacheKey);
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.customMetric.upsert completed", {
    opId: envelope.opId,
    metric: validatedResponse.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.customMetric.upsert tool
 */
function registerCustomMetricUpsertTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.customMetric.upsert",
    description: "Create or update GA4 custom metric (supports currency/time units)",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Property ID in format properties/123456789",
        },
        parameterName: {
          type: "string",
          description: "Parameter name for the custom metric",
        },
        displayName: {
          type: "string",
          description: "Display name for the custom metric",
        },
        description: {
          type: "string",
          description: "Description of the custom metric",
        },
        measurementUnit: {
          type: "string",
          enum: [
            "MEASUREMENT_UNIT_UNSPECIFIED",
            "STANDARD",
            "CURRENCY",
            "FEET",
            "METERS",
            "KILOMETERS",
            "MILES",
            "MILLISECONDS",
            "SECONDS",
            "MINUTES",
            "HOURS",
          ],
          description: "Measurement unit for the metric",
        },
        scope: {
          type: "string",
          enum: ["USER", "EVENT", "ITEM"],
          description: "Scope of the custom metric",
        },
        type: {
          type: "string",
          enum: ["INTEGER", "FLOAT", "SECONDS", "MILLISECONDS", "CURRENCY", "FEET", "METERS"],
          description: "Type of the custom metric",
        },
      },
      required: ["parent", "parameterName", "scope", "type"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeCustomMetricUpsert(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.customMetric.upsert failed", error);
        } else {
          logger.error("ga4.customMetric.upsert failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute custom metric delete operation (archive)
 */
async function executeCustomMetricDelete(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof customMetricDeleteResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.customMetric.delete",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { name: string }).name.split("/customMetrics/")[0] || "",
    },
  });

  logger.info("Executing ga4.customMetric.delete", { opId: envelope.opId });

  const validatedRequest = validateSchema(customMetricDeleteRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  // Pre-check: verify metric exists
  await ga4Client.checkRateLimit("ga4", "customMetric.get");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  try {
    await adminClient.properties.customMetrics.get({ name: validatedRequest.name });
  } catch {
    throw createPreconditionError("not_found", "Custom metric not found", {
      metric: validatedRequest.name,
    });
  }

  // Archive metric (GA4 uses archive, not delete)
  await ga4Client.checkRateLimit("ga4", "customMetric.archive");
  try {
    await adminClient.properties.customMetrics.archive({
      name: validatedRequest.name,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Custom metric archive failed", error);
    } else {
      logger.error("Custom metric archive failed", new Error(String(error)));
    }
    throw error;
  }

  // Invalidate cache
  const cacheKey = `ga4:customMetric:${validatedRequest.name}`;
  await cache.delete(cacheKey);

  logger.info("ga4.customMetric.delete completed", {
    opId: envelope.opId,
    metric: validatedRequest.name,
  });

  return {
    success: true,
    name: validatedRequest.name,
  };
}

/**
 * Register ga4.customMetric.delete tool
 */
function registerCustomMetricDeleteTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.customMetric.delete",
    description: "Archive (delete) GA4 custom metric",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Custom metric ID in format properties/123456789/customMetrics/metric_name",
        },
      },
      required: ["name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeCustomMetricDelete(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.customMetric.delete failed", error);
        } else {
          logger.error("ga4.customMetric.delete failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to list events
 */
async function executeEventListAPIRequest(
  validatedRequest: z.infer<typeof eventListRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof eventListResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "event.list");
  const adminClient = ga4Client.getAnalyticsAdminClient();

  const params: Record<string, unknown> = {
    parent: validatedRequest.parent,
  };
  if (validatedRequest.pageSize) {
    params.pageSize = validatedRequest.pageSize;
  }
  if (validatedRequest.pageToken) {
    params.pageToken = validatedRequest.pageToken;
  }

  const eventCreateRules = (
    adminClient.properties as {
      eventCreateRules?: {
        list: (params: Record<string, unknown>) => Promise<{ data?: unknown }>;
      };
    }
  ).eventCreateRules;

  if (!eventCreateRules) {
    throw createPreconditionError("not_found", "Event create rules API not available", {});
  }

  const response = await eventCreateRules.list(params);

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No events found", {});
  }

  // Transform eventCreateRules to events format
  const rulesData = responseData.data as { eventCreateRules?: unknown[]; nextPageToken?: string };
  return validateSchema(eventListResponseSchema, {
    events: rulesData.eventCreateRules || [],
    nextPageToken: rulesData.nextPageToken,
  });
}

/**
 * Execute event list operation
 */
async function executeEventList(
  args: unknown,
  ga4Client: GA4Client,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof eventListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.event.list",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { parent: string }).parent },
  });

  logger.info("Executing ga4.event.list", { opId: envelope.opId });

  const validatedRequest = validateSchema(eventListRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const validatedResponse = await executeEventListAPIRequest(validatedRequest, ga4Client);

  logger.info("ga4.event.list completed", {
    opId: envelope.opId,
    eventCount: validatedResponse.events.length,
  });

  return validatedResponse;
}

/**
 * Register ga4.event.list tool
 */
function registerEventListTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.event.list",
    description: "List event definitions for a GA4 property",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Property ID in format properties/123456789",
        },
        pageSize: {
          type: "number",
          description: "Maximum number of events to return (1-200)",
        },
        pageToken: {
          type: "string",
          description: "Token for pagination",
        },
      },
      required: ["parent"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeEventList(args, ga4Client, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.event.list failed", error);
        } else {
          logger.error("ga4.event.list failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Check cache and return event if found
 */
async function checkEventCache(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof eventGetResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for event", { cacheKey });
    return validateSchema(eventGetResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request to get event
 */
async function executeEventGetAPIRequest(
  eventName: string,
  ga4Client: GA4Client
): Promise<z.infer<typeof eventGetResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "event.get");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const eventCreateRules = (
    adminClient.properties as {
      eventCreateRules?: {
        get: (params: { name: string }) => Promise<{ data?: unknown }>;
      };
    }
  ).eventCreateRules;

  if (!eventCreateRules) {
    throw createPreconditionError("not_found", "Event create rules API not available", {
      event: eventName,
    });
  }

  const response = await eventCreateRules.get({
    name: eventName,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Event not found", {
      event: eventName,
    });
  }

  return validateSchema(eventGetResponseSchema, responseData.data);
}

/**
 * Execute event get operation
 */
async function executeEventGet(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof eventGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.event.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { name: string }).name.split("/eventCreateRules/")[0] || "",
    },
  });

  logger.info("Executing ga4.event.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(eventGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const cacheKey = `ga4:event:${validatedRequest.name}`;
  const cached = await checkEventCache(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  const validatedResponse = await executeEventGetAPIRequest(validatedRequest.name, ga4Client);

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.event.get completed", {
    opId: envelope.opId,
    event: validatedRequest.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.event.get tool
 */
function registerEventGetTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.event.get",
    description: "Get GA4 event definition by event ID",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Event create rule ID in format properties/123456789/eventCreateRules/event_name",
        },
      },
      required: ["name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeEventGet(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.event.get failed", error);
        } else {
          logger.error("ga4.event.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to create/update event
 */
async function executeEventUpsertAPIRequest(
  validatedRequest: z.infer<typeof eventUpsertRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof eventUpsertResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "event.upsert");
  const adminClient = ga4Client.getAnalyticsAdminClient();

  const eventData: Record<string, unknown> = {
    eventName: validatedRequest.eventName,
  };
  if (validatedRequest.createEvent !== undefined) {
    eventData.createEvent = validatedRequest.createEvent;
  }
  if (validatedRequest.matchingCondition) {
    eventData.matchingCondition = validatedRequest.matchingCondition;
  }

  // Check if event exists by trying to get it
  const eventName = `${validatedRequest.parent}/eventCreateRules/${validatedRequest.eventName}`;
  const eventCreateRules = (
    adminClient.properties as {
      eventCreateRules?: {
        get: (params: { name: string }) => Promise<{ data?: unknown }>;
        patch: (params: {
          name: string;
          updateMask?: string;
          requestBody?: Record<string, unknown>;
        }) => Promise<{ data?: unknown }>;
        create: (params: { requestBody?: Record<string, unknown> }) => Promise<{ data?: unknown }>;
      };
    }
  ).eventCreateRules;

  if (!eventCreateRules) {
    throw createPreconditionError("not_found", "Event create rules API not available", {});
  }

  let response;
  try {
    await eventCreateRules.get({ name: eventName });
    // Event exists, update it
    response = await eventCreateRules.patch({
      name: eventName,
      updateMask: "createEvent,matchingCondition",
      requestBody: eventData,
    });
  } catch {
    // Event doesn't exist, create it
    eventData.parent = validatedRequest.parent;
    response = await eventCreateRules.create({
      requestBody: eventData,
    });
  }

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Event operation failed", {});
  }

  return validateSchema(eventUpsertResponseSchema, responseData.data);
}

/**
 * Execute event upsert operation with pre-check for conflicts
 */
async function executeEventUpsert(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof eventUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.event.upsert",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { parent: string }).parent,
    },
  });

  logger.info("Executing ga4.event.upsert", { opId: envelope.opId });

  const validatedRequest = validateSchema(eventUpsertRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  // Pre-check: verify no event name conflicts
  const eventName = `${validatedRequest.parent}/eventCreateRules/${validatedRequest.eventName}`;
  try {
    await ga4Client.checkRateLimit("ga4", "event.get");
    const adminClient = ga4Client.getAnalyticsAdminClient();
    const eventCreateRules = (
      adminClient.properties as {
        eventCreateRules?: {
          get: (params: { name: string }) => Promise<{ data?: unknown }>;
        };
      }
    ).eventCreateRules;
    if (eventCreateRules) {
      await eventCreateRules.get({ name: eventName });
      // Event exists, will update
    }
  } catch {
    // Event doesn't exist, will create
  }

  const validatedResponse = await executeEventUpsertAPIRequest(validatedRequest, ga4Client);

  // Post-check: verify event was created/updated
  const cacheKey = `ga4:event:${validatedResponse.name}`;
  await cache.invalidate(cacheKey);
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.event.upsert completed", {
    opId: envelope.opId,
    event: validatedResponse.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.event.upsert tool
 */
function registerEventUpsertTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.event.upsert",
    description: "Create or update GA4 event definition with custom parameters",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Property ID in format properties/123456789",
        },
        eventName: {
          type: "string",
          description: "Event name",
        },
        createEvent: {
          type: "boolean",
          description: "Whether to create the event",
        },
        matchingCondition: {
          type: "object",
          properties: {
            field: {
              type: "string",
              description: "Field to match",
            },
            comparisonType: {
              type: "string",
              description: "Comparison type",
            },
            value: {
              type: "string",
              description: "Value to match",
            },
          },
          description: "Matching condition for event creation",
        },
      },
      required: ["parent", "eventName"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeEventUpsert(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.event.upsert failed", error);
        } else {
          logger.error("ga4.event.upsert failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute event parameter list operation
 * Note: Event parameters are dynamic and not directly supported via GA4 Admin API.
 * This tool returns a note suggesting to use custom dimensions instead.
 */
async function executeEventParameterList(
  args: unknown,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof eventParameterListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.event.parameter.list",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { parent: string }).parent },
  });

  logger.info("Executing ga4.event.parameter.list", { opId: envelope.opId });

  const validatedRequest = validateSchema(eventParameterListRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  logger.warn("Event parameters are dynamic and not directly supported via API", {
    event: validatedRequest.eventName,
    suggestion: "Use custom dimensions for event parameter tracking",
  });

  await Promise.resolve(); // Satisfy async requirement

  return {
    parameters: [],
    note: "Event parameters are dynamic and not directly supported via GA4 Admin API. Use custom dimensions (ga4.customDimension.upsert) with EVENT scope for event parameter tracking.",
  };
}

/**
 * Register ga4.event.parameter.list tool
 */
function registerEventParameterListTool(
  bootstrap: MCPServerBootstrap,
  _ga4Client: GA4Client,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.event.parameter.list",
    description:
      "List event parameters. Note: Event parameters are dynamic and not directly supported via API. Use custom dimensions with EVENT scope instead.",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Property ID in format properties/123456789",
        },
        eventName: {
          type: "string",
          description: "Event name",
        },
      },
      required: ["parent", "eventName"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeEventParameterList(args, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.event.parameter.list failed", error);
        } else {
          logger.error("ga4.event.parameter.list failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute event parameter upsert operation
 * Note: Event parameters are dynamic and not directly supported via GA4 Admin API.
 * This tool returns a note suggesting to use custom dimensions instead.
 */
async function executeEventParameterUpsert(
  args: unknown,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof eventParameterUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.event.parameter.upsert",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { parent: string }).parent },
  });

  logger.info("Executing ga4.event.parameter.upsert", { opId: envelope.opId });

  const validatedRequest = validateSchema(eventParameterUpsertRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  logger.warn("Event parameters are dynamic and not directly supported via API", {
    event: validatedRequest.eventName,
    parameter: validatedRequest.parameterName,
    suggestion: "Use custom dimensions for event parameter tracking",
  });

  await Promise.resolve(); // Satisfy async requirement

  return {
    success: false,
    note: "Event parameters are dynamic and not directly supported via GA4 Admin API.",
    suggestion: `Use ga4.customDimension.upsert with parent="${validatedRequest.parent}", parameterName="${validatedRequest.parameterName}", scope="EVENT" to track this as a custom dimension instead.`,
  };
}

/**
 * Register ga4.event.parameter.upsert tool
 */
function registerEventParameterUpsertTool(
  bootstrap: MCPServerBootstrap,
  _ga4Client: GA4Client,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.event.parameter.upsert",
    description:
      "Create or update event parameter. Note: Event parameters are dynamic and not directly supported via API. Use custom dimensions with EVENT scope instead.",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Property ID in format properties/123456789",
        },
        eventName: {
          type: "string",
          description: "Event name",
        },
        parameterName: {
          type: "string",
          description: "Parameter name",
        },
        parameterType: {
          type: "string",
          description: "Parameter type",
        },
        required: {
          type: "boolean",
          description: "Whether parameter is required",
        },
        description: {
          type: "string",
          description: "Parameter description",
        },
      },
      required: ["parent", "eventName", "parameterName"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeEventParameterUpsert(args, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.event.parameter.upsert failed", error);
        } else {
          logger.error("ga4.event.parameter.upsert failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute event parameter delete operation
 * Note: Event parameters are dynamic and not directly supported via GA4 Admin API.
 */
async function executeEventParameterDelete(
  args: unknown,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof eventParameterDeleteResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.event.parameter.delete",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { parent: string }).parent },
  });

  logger.info("Executing ga4.event.parameter.delete", { opId: envelope.opId });

  const validatedRequest = validateSchema(eventParameterDeleteRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  logger.warn("Event parameters are dynamic and not directly supported via API", {
    event: validatedRequest.eventName,
    parameter: validatedRequest.parameterName,
    suggestion: "Event parameters cannot be deleted via API",
  });

  await Promise.resolve(); // Satisfy async requirement

  return {
    success: false,
    note: "Event parameters are dynamic and cannot be deleted via GA4 Admin API. If you created a custom dimension for this parameter, use ga4.customDimension.delete to archive it.",
  };
}

/**
 * Register ga4.event.parameter.delete tool
 */
function registerEventParameterDeleteTool(
  bootstrap: MCPServerBootstrap,
  _ga4Client: GA4Client,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.event.parameter.delete",
    description:
      "Delete event parameter. Note: Event parameters are dynamic and not directly supported via API. If you created a custom dimension for this parameter, use ga4.customDimension.delete instead.",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Property ID in format properties/123456789",
        },
        eventName: {
          type: "string",
          description: "Event name",
        },
        parameterName: {
          type: "string",
          description: "Parameter name",
        },
      },
      required: ["parent", "eventName", "parameterName"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeEventParameterDelete(args, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.event.parameter.delete failed", error);
        } else {
          logger.error("ga4.event.parameter.delete failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to list conversions
 */
async function executeConversionListAPIRequest(
  validatedRequest: z.infer<typeof conversionListRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof conversionListResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "conversion.list");
  const adminClient = ga4Client.getAnalyticsAdminClient();

  const params: Record<string, unknown> = {
    parent: validatedRequest.parent,
  };
  if (validatedRequest.pageSize) {
    params.pageSize = validatedRequest.pageSize;
  }
  if (validatedRequest.pageToken) {
    params.pageToken = validatedRequest.pageToken;
  }

  const response = await adminClient.properties.conversionEvents.list(params);

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No conversions found", {});
  }

  // Transform conversionEvents to conversions format
  const eventsData = responseData.data as { conversionEvents?: unknown[]; nextPageToken?: string };
  return validateSchema(conversionListResponseSchema, {
    conversions: eventsData.conversionEvents || [],
    nextPageToken: eventsData.nextPageToken,
  });
}

/**
 * Execute conversion list operation
 */
async function executeConversionList(
  args: unknown,
  ga4Client: GA4Client,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof conversionListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.conversion.list",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { parent: string }).parent },
  });

  logger.info("Executing ga4.conversion.list", { opId: envelope.opId });

  const validatedRequest = validateSchema(conversionListRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const validatedResponse = await executeConversionListAPIRequest(validatedRequest, ga4Client);

  logger.info("ga4.conversion.list completed", {
    opId: envelope.opId,
    conversionCount: validatedResponse.conversions.length,
  });

  return validatedResponse;
}

/**
 * Register ga4.conversion.list tool
 */
function registerConversionListTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.conversion.list",
    description: "List conversion events for a GA4 property",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Property ID in format properties/123456789",
        },
        pageSize: {
          type: "number",
          description: "Maximum number of conversions to return (1-200)",
        },
        pageToken: {
          type: "string",
          description: "Token for pagination",
        },
      },
      required: ["parent"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeConversionList(args, ga4Client, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.conversion.list failed", error);
        } else {
          logger.error("ga4.conversion.list failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Check cache and return conversion if found
 */
async function checkConversionCache(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof conversionGetResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for conversion", { cacheKey });
    return validateSchema(conversionGetResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request to get conversion
 */
async function executeConversionGetAPIRequest(
  conversionName: string,
  ga4Client: GA4Client
): Promise<z.infer<typeof conversionGetResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "conversion.get");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const response = await adminClient.properties.conversionEvents.get({
    name: conversionName,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Conversion not found", {
      conversion: conversionName,
    });
  }

  return validateSchema(conversionGetResponseSchema, responseData.data);
}

/**
 * Execute conversion get operation
 */
async function executeConversionGet(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof conversionGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.conversion.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { name: string }).name.split("/conversionEvents/")[0] || "",
    },
  });

  logger.info("Executing ga4.conversion.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(conversionGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const cacheKey = `ga4:conversion:${validatedRequest.name}`;
  const cached = await checkConversionCache(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  const validatedResponse = await executeConversionGetAPIRequest(validatedRequest.name, ga4Client);

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.conversion.get completed", {
    opId: envelope.opId,
    conversion: validatedRequest.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.conversion.get tool
 */
function registerConversionGetTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.conversion.get",
    description: "Get GA4 conversion event details by conversion ID",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Conversion event ID in format properties/123456789/conversionEvents/event_name",
        },
      },
      required: ["name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeConversionGet(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.conversion.get failed", error);
        } else {
          logger.error("ga4.conversion.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to create/update conversion
 */
async function executeConversionUpsertAPIRequest(
  validatedRequest: z.infer<typeof conversionUpsertRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof conversionUpsertResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "conversion.upsert");
  const adminClient = ga4Client.getAnalyticsAdminClient();

  const conversionData: Record<string, unknown> = {
    eventName: validatedRequest.eventName,
  };
  if (validatedRequest.countingMethod) {
    conversionData.countingMethod = validatedRequest.countingMethod;
  }

  // Check if conversion exists by trying to get it
  const conversionName = `${validatedRequest.parent}/conversionEvents/${validatedRequest.eventName}`;
  let response;
  try {
    await adminClient.properties.conversionEvents.get({ name: conversionName });
    // Conversion exists, but conversions can't be updated - they're based on events
    // Return existing conversion
    response = await adminClient.properties.conversionEvents.get({ name: conversionName });
  } catch {
    // Conversion doesn't exist, create it
    conversionData.parent = validatedRequest.parent;
    response = await adminClient.properties.conversionEvents.create({
      requestBody: conversionData,
    });
  }

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Conversion operation failed", {});
  }

  return validateSchema(conversionUpsertResponseSchema, responseData.data);
}

/**
 * Execute conversion upsert operation with idempotency via event name
 */
async function executeConversionUpsert(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof conversionUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.conversion.upsert",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { parent: string }).parent,
    },
  });

  logger.info("Executing ga4.conversion.upsert", { opId: envelope.opId });

  const validatedRequest = validateSchema(conversionUpsertRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const validatedResponse = await executeConversionUpsertAPIRequest(validatedRequest, ga4Client);

  // Post-check: verify conversion was created/updated
  const cacheKey = `ga4:conversion:${validatedResponse.name}`;
  await cache.invalidate(cacheKey);
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.conversion.upsert completed", {
    opId: envelope.opId,
    conversion: validatedResponse.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.conversion.upsert tool
 */
function registerConversionUpsertTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.conversion.upsert",
    description: "Create or update GA4 conversion event with counting method and value settings",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Property ID in format properties/123456789",
        },
        eventName: {
          type: "string",
          description: "Event name to mark as conversion",
        },
        countingMethod: {
          type: "string",
          enum: ["CONVERSION_COUNTING_METHOD_UNSPECIFIED", "ONCE_PER_EVENT", "ONCE_PER_SESSION"],
          description: "Counting method for the conversion",
        },
      },
      required: ["parent", "eventName"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeConversionUpsert(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.conversion.upsert failed", error);
        } else {
          logger.error("ga4.conversion.upsert failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute conversion delete operation with rollback
 */
async function executeConversionDelete(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof conversionDeleteResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.conversion.delete",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { name: string }).name.split("/conversionEvents/")[0] || "",
    },
  });

  logger.info("Executing ga4.conversion.delete", { opId: envelope.opId });

  const validatedRequest = validateSchema(conversionDeleteRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  // Pre-check: verify conversion exists
  await ga4Client.checkRateLimit("ga4", "conversion.get");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  try {
    await adminClient.properties.conversionEvents.get({ name: validatedRequest.name });
  } catch {
    throw createPreconditionError("not_found", "Conversion not found", {
      conversion: validatedRequest.name,
    });
  }

  // Delete conversion
  await ga4Client.checkRateLimit("ga4", "conversion.delete");
  try {
    await adminClient.properties.conversionEvents.delete({
      name: validatedRequest.name,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Conversion delete failed", error);
    } else {
      logger.error("Conversion delete failed", new Error(String(error)));
    }
    throw error;
  }

  // Post-check: verify conversion was deleted
  try {
    await adminClient.properties.conversionEvents.get({ name: validatedRequest.name });
    // If we get here, conversion still exists - rollback scenario
    logger.warn("Conversion delete post-check failed - conversion still exists", {
      conversion: validatedRequest.name,
    });
    throw createPreconditionError("precheck_failed", "Conversion deletion failed", {
      conversion: validatedRequest.name,
    });
  } catch (error) {
    // Expected: conversion should not exist
    if (error instanceof Error && error.message.includes("not found")) {
      // Success - conversion deleted
    } else if (error instanceof Error && error.message.includes("precheck_failed")) {
      throw error;
    } else {
      // Expected error - conversion not found
    }
  }

  // Invalidate cache
  const cacheKey = `ga4:conversion:${validatedRequest.name}`;
  await cache.delete(cacheKey);

  logger.info("ga4.conversion.delete completed", {
    opId: envelope.opId,
    conversion: validatedRequest.name,
  });

  return {
    success: true,
    name: validatedRequest.name,
  };
}

/**
 * Register ga4.conversion.delete tool
 */
function registerConversionDeleteTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.conversion.delete",
    description: "Delete GA4 conversion event",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Conversion event ID in format properties/123456789/conversionEvents/event_name",
        },
      },
      required: ["name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeConversionDelete(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.conversion.delete failed", error);
        } else {
          logger.error("ga4.conversion.delete failed", new Error(String(error)));
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
  ga4Client: GA4Client
): Promise<z.infer<typeof audienceListResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "audience.list");
  const adminClient = ga4Client.getAnalyticsAdminClient();

  const params: Record<string, unknown> = {
    parent: validatedRequest.parent,
  };
  if (validatedRequest.pageSize) {
    params.pageSize = validatedRequest.pageSize;
  }
  if (validatedRequest.pageToken) {
    params.pageToken = validatedRequest.pageToken;
  }

  const audiences = (
    adminClient.properties as {
      audiences?: {
        list: (params: Record<string, unknown>) => Promise<{ data?: unknown }>;
      };
    }
  ).audiences;

  if (!audiences) {
    throw createPreconditionError("not_found", "Audiences API not available", {});
  }

  const response = await audiences.list(params);

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "No audiences found", {});
  }

  return validateSchema(audienceListResponseSchema, responseData.data);
}

/**
 * Execute audience list operation
 */
async function executeAudienceList(
  args: unknown,
  ga4Client: GA4Client,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof audienceListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.audience.list",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { parent: string }).parent },
  });

  logger.info("Executing ga4.audience.list", { opId: envelope.opId });

  const validatedRequest = validateSchema(audienceListRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const validatedResponse = await executeAudienceListAPIRequest(validatedRequest, ga4Client);

  logger.info("ga4.audience.list completed", {
    opId: envelope.opId,
    audienceCount: validatedResponse.audiences.length,
  });

  return validatedResponse;
}

/**
 * Register ga4.audience.list tool
 */
function registerAudienceListTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.audience.list",
    description: "List audiences for a GA4 property",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Property ID in format properties/123456789",
        },
        pageSize: {
          type: "number",
          description: "Maximum number of audiences to return (1-200)",
        },
        pageToken: {
          type: "string",
          description: "Token for pagination",
        },
      },
      required: ["parent"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeAudienceList(args, ga4Client, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.audience.list failed", error);
        } else {
          logger.error("ga4.audience.list failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Check cache and return audience if found
 */
async function checkAudienceCache(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof audienceGetResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for audience", { cacheKey });
    return validateSchema(audienceGetResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request to get audience
 */
async function executeAudienceGetAPIRequest(
  audienceName: string,
  ga4Client: GA4Client
): Promise<z.infer<typeof audienceGetResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "audience.get");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const audiences = (
    adminClient.properties as {
      audiences?: {
        get: (params: { name: string }) => Promise<{ data?: unknown }>;
      };
    }
  ).audiences;

  if (!audiences) {
    throw createPreconditionError("not_found", "Audiences API not available", {
      audience: audienceName,
    });
  }

  const response = await audiences.get({
    name: audienceName,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Audience not found", {
      audience: audienceName,
    });
  }

  return validateSchema(audienceGetResponseSchema, responseData.data);
}

/**
 * Execute audience get operation
 */
async function executeAudienceGet(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof audienceGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.audience.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { name: string }).name.split("/audiences/")[0] || "",
    },
  });

  logger.info("Executing ga4.audience.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(audienceGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const cacheKey = `ga4:audience:${validatedRequest.name}`;
  const cached = await checkAudienceCache(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  const validatedResponse = await executeAudienceGetAPIRequest(validatedRequest.name, ga4Client);

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.audience.get completed", {
    opId: envelope.opId,
    audience: validatedRequest.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.audience.get tool
 */
function registerAudienceGetTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.audience.get",
    description: "Get GA4 audience details by audience ID",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Audience ID in format properties/123456789/audiences/987654321",
        },
      },
      required: ["name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeAudienceGet(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.audience.get failed", error);
        } else {
          logger.error("ga4.audience.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to create/update audience
 */
async function executeAudienceUpsertAPIRequest(
  validatedRequest: z.infer<typeof audienceUpsertRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof audienceUpsertResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "audience.upsert");
  const adminClient = ga4Client.getAnalyticsAdminClient();

  const audienceData: Record<string, unknown> = {
    displayName: validatedRequest.displayName,
  };
  if (validatedRequest.description) {
    audienceData.description = validatedRequest.description;
  }
  if (validatedRequest.membershipDurationDays) {
    audienceData.membershipDurationDays = validatedRequest.membershipDurationDays;
  }
  if (validatedRequest.filterClauses) {
    audienceData.filterClauses = validatedRequest.filterClauses;
  }

  // For audiences, we need to check by displayName since there's no direct ID
  // This is a simplified implementation - in practice, we'd need to list and match
  audienceData.parent = validatedRequest.parent;
  const audiences = (
    adminClient.properties as {
      audiences?: {
        create: (params: { requestBody?: Record<string, unknown> }) => Promise<{ data?: unknown }>;
      };
    }
  ).audiences;

  if (!audiences) {
    throw createPreconditionError("not_found", "Audiences API not available", {});
  }

  const response = await audiences.create({
    requestBody: audienceData,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Audience operation failed", {});
  }

  return validateSchema(audienceUpsertResponseSchema, responseData.data);
}

/**
 * Execute audience upsert operation with pre/post validation
 */
async function executeAudienceUpsert(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof audienceUpsertResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.audience.upsert",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { parent: string }).parent,
    },
  });

  logger.info("Executing ga4.audience.upsert", { opId: envelope.opId });

  const validatedRequest = validateSchema(audienceUpsertRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const validatedResponse = await executeAudienceUpsertAPIRequest(validatedRequest, ga4Client);

  // Post-check: verify audience was created
  const cacheKey = `ga4:audience:${validatedResponse.name}`;
  await cache.invalidate(cacheKey);
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.audience.upsert completed", {
    opId: envelope.opId,
    audience: validatedResponse.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.audience.upsert tool
 */
function registerAudienceUpsertTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.audience.upsert",
    description: "Create or update GA4 audience with definitions and filters",
    inputSchema: {
      type: "object",
      properties: {
        parent: {
          type: "string",
          description: "Property ID in format properties/123456789",
        },
        displayName: {
          type: "string",
          description: "Audience display name",
        },
        description: {
          type: "string",
          description: "Audience description",
        },
        membershipDurationDays: {
          type: "number",
          description: "Membership duration in days (1-540)",
        },
        filterClauses: {
          type: "array",
          description: "Filter clauses for audience definition",
        },
      },
      required: ["parent", "displayName"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeAudienceUpsert(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.audience.upsert failed", error);
        } else {
          logger.error("ga4.audience.upsert failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute audience delete operation (archive)
 */
async function executeAudienceDelete(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof audienceDeleteResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.audience.delete",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: {
      product: "ga4",
      propertyId: (args as { name: string }).name.split("/audiences/")[0] || "",
    },
  });

  logger.info("Executing ga4.audience.delete", { opId: envelope.opId });

  const validatedRequest = validateSchema(audienceDeleteRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  // Pre-check: verify audience exists
  await ga4Client.checkRateLimit("ga4", "audience.get");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const audiences = (
    adminClient.properties as {
      audiences?: {
        get: (params: { name: string }) => Promise<{ data?: unknown }>;
        archive: (params: { name: string }) => Promise<unknown>;
      };
    }
  ).audiences;

  if (!audiences) {
    throw createPreconditionError("not_found", "Audiences API not available", {
      audience: validatedRequest.name,
    });
  }

  try {
    await audiences.get({ name: validatedRequest.name });
  } catch {
    throw createPreconditionError("not_found", "Audience not found", {
      audience: validatedRequest.name,
    });
  }

  // Archive audience (GA4 uses archive, not delete)
  await ga4Client.checkRateLimit("ga4", "audience.archive");
  try {
    await audiences.archive({
      name: validatedRequest.name,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Audience archive failed", error);
    } else {
      logger.error("Audience archive failed", new Error(String(error)));
    }
    throw error;
  }

  // Invalidate cache
  const cacheKey = `ga4:audience:${validatedRequest.name}`;
  await cache.delete(cacheKey);

  logger.info("ga4.audience.delete completed", {
    opId: envelope.opId,
    audience: validatedRequest.name,
  });

  return {
    success: true,
    name: validatedRequest.name,
  };
}

/**
 * Register ga4.audience.delete tool
 */
function registerAudienceDeleteTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.audience.delete",
    description: "Archive (delete) GA4 audience",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Audience ID in format properties/123456789/audiences/987654321",
        },
      },
      required: ["name"],
    },
    handler: async (args: unknown) => {
      try {
        return await executeAudienceDelete(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.audience.delete failed", error);
        } else {
          logger.error("ga4.audience.delete failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Register ga4.property.settings.get tool
 */
function registerPropertySettingsGetTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.property.settings.get",
    description:
      "Get GA4 property settings including currency, timezone, display name, and industry category.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executePropertySettingsGet(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.property.settings.get failed", error);
        } else {
          logger.error("ga4.property.settings.get failed", new Error(String(error)));
        }
        throw error;
      }
    },
  });
}

/**
 * Build update mask from request
 */
function buildUpdateMask(
  request: z.infer<typeof propertySettingsUpdateRequestSchema>
): string {
  return Object.keys(request)
    .filter((key) => key !== "property" && request[key as keyof typeof request] !== undefined)
    .join(",");
}

/**
 * Execute API request to update property settings
 */
async function executePropertySettingsUpdateAPIRequest(
  property: string,
  updateMask: string,
  updates: {
    displayName?: string;
    currencyCode?: string;
    timeZone?: string;
    industryCategory?: string;
  },
  ga4Client: GA4Client
): Promise<z.infer<typeof propertySettingsResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "updateProperty");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const response = await adminClient.properties.patch({
    name: property,
    updateMask,
    requestBody: updates as never,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Property not found", {
      property,
    });
  }

  return validateSchema(propertySettingsResponseSchema, responseData.data);
}

/**
 * Build updates object from request
 */
function buildPropertySettingsUpdates(
  request: z.infer<typeof propertySettingsUpdateRequestSchema>
): {
  displayName?: string;
  currencyCode?: string;
  timeZone?: string;
  industryCategory?: string;
} {
  const updates: {
    displayName?: string;
    currencyCode?: string;
    timeZone?: string;
    industryCategory?: string;
  } = {};

  if (request.displayName !== undefined) {
    updates.displayName = request.displayName;
  }
  if (request.currencyCode !== undefined) {
    updates.currencyCode = request.currencyCode;
  }
  if (request.timeZone !== undefined) {
    updates.timeZone = request.timeZone;
  }
  if (request.industryCategory !== undefined) {
    updates.industryCategory = request.industryCategory;
  }

  return updates;
}

/**
 * Execute property settings update operation
 */
async function executePropertySettingsUpdate(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof propertySettingsResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.property.settings.update",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { property: string }).property },
  });

  logger.info("Executing ga4.property.settings.update", { opId: envelope.opId });

  const validatedRequest = validateSchema(propertySettingsUpdateRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const updateMask = buildUpdateMask(validatedRequest);
  const updates = buildPropertySettingsUpdates(validatedRequest);
  const validatedResponse = await executePropertySettingsUpdateAPIRequest(
    validatedRequest.property,
    updateMask,
    updates,
    ga4Client
  );

  const cacheKey = `ga4:property:${validatedRequest.property}:settings`;
  await cache.delete(cacheKey);

  logger.info("ga4.property.settings.update completed", {
    opId: envelope.opId,
    property: validatedRequest.property,
  });

  return validatedResponse;
}

/**
 * Register ga4.property.settings.update tool
 */
function registerPropertySettingsUpdateTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.property.settings.update",
    description:
      "Update GA4 property settings including currency, timezone, display name, and industry category.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executePropertySettingsUpdate(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.property.settings.update failed", error);
        } else {
          logger.error("ga4.property.settings.update failed", new Error(String(error)));
        }
        throw error;
      }
    },
  });
}

/**
 * Check cache and return Google Signals settings if found
 */
async function checkGoogleSignalsCache(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof googleSignalsResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for Google Signals settings", { cacheKey });
    return validateSchema(googleSignalsResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request to get Google Signals settings
 */
async function executeGoogleSignalsGetAPIRequest(
  property: string,
  ga4Client: GA4Client
): Promise<z.infer<typeof googleSignalsResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "getGoogleSignalsSettings");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const response = (await (adminClient.properties as { getGoogleSignalsSettings?: (params: { name: string }) => Promise<{ data?: unknown }> }).getGoogleSignalsSettings?.({
    name: `${property}/googleSignalsSettings`,
  })) as { data?: unknown };
  
  if (!response) {
    throw createPreconditionError("not_found", "Google Signals settings not found", {
      property,
    });
  }

  const responseData = response;
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Google Signals settings not found", {
      property,
    });
  }

  return validateSchema(googleSignalsResponseSchema, responseData.data);
}

/**
 * Execute Google Signals get operation
 */
async function executeGoogleSignalsGet(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof googleSignalsResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.property.googleSignals.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { property: string }).property },
  });

  logger.info("Executing ga4.property.googleSignals.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(googleSignalsGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const cacheKey = `ga4:property:${validatedRequest.property}:googleSignals`;
  const cached = await checkGoogleSignalsCache(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  const validatedResponse = await executeGoogleSignalsGetAPIRequest(validatedRequest.property, ga4Client);

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.property.googleSignals.get completed", {
    opId: envelope.opId,
    property: validatedRequest.property,
  });

  return validatedResponse;
}

/**
 * Register ga4.property.googleSignals.get tool
 */
function registerGoogleSignalsGetTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.property.googleSignals.get",
    description:
      "Get Google Signals configuration for a GA4 property. Google Signals enables cross-device tracking.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executeGoogleSignalsGet(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.property.googleSignals.get failed", error);
        } else {
          logger.error("ga4.property.googleSignals.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to update Google Signals settings
 */
async function executeGoogleSignalsUpdateAPIRequest(
  property: string,
  state: "GOOGLE_SIGNALS_ENABLED" | "GOOGLE_SIGNALS_DISABLED",
  ga4Client: GA4Client
): Promise<z.infer<typeof googleSignalsResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "updateGoogleSignalsSettings");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const response = (await (adminClient.properties as { updateGoogleSignalsSettings?: (params: { googleSignalsSettings: { name: string; state: string }; updateMask: string }) => Promise<{ data?: unknown }> }).updateGoogleSignalsSettings?.({
    googleSignalsSettings: {
      name: `${property}/googleSignalsSettings`,
      state,
    } as never,
    updateMask: "state",
  })) as { data?: unknown };
  
  if (!response) {
    throw createPreconditionError("not_found", "Google Signals settings not found", {
      property,
    });
  }

  const responseData = response;
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Google Signals settings not found", {
      property,
    });
  }

  return validateSchema(googleSignalsResponseSchema, responseData.data);
}

/**
 * Execute Google Signals update operation
 */
async function executeGoogleSignalsUpdate(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof googleSignalsResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.property.googleSignals.update",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { property: string }).property },
  });

  logger.info("Executing ga4.property.googleSignals.update", { opId: envelope.opId });

  const validatedRequest = validateSchema(googleSignalsUpdateRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const validatedResponse = await executeGoogleSignalsUpdateAPIRequest(
    validatedRequest.property,
    validatedRequest.state,
    ga4Client
  );

  const cacheKey = `ga4:property:${validatedRequest.property}:googleSignals`;
  await cache.delete(cacheKey);

  logger.info("ga4.property.googleSignals.update completed", {
    opId: envelope.opId,
    property: validatedRequest.property,
    state: validatedRequest.state,
  });

  return validatedResponse;
}

/**
 * Register ga4.property.googleSignals.update tool
 */
function registerGoogleSignalsUpdateTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.property.googleSignals.update",
    description:
      "Update Google Signals configuration for a GA4 property. Enable or disable cross-device tracking.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executeGoogleSignalsUpdate(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.property.googleSignals.update failed", error);
        } else {
          logger.error("ga4.property.googleSignals.update failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Check cache and return data retention settings if found
 */
async function checkDataRetentionCache(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof dataRetentionResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for data retention settings", { cacheKey });
    return validateSchema(dataRetentionResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request to get data retention settings
 */
async function executeDataRetentionGetAPIRequest(
  property: string,
  ga4Client: GA4Client
): Promise<z.infer<typeof dataRetentionResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "getDataRetentionSettings");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const response = (await (adminClient.properties as { getDataRetentionSettings?: (params: { name: string }) => Promise<{ data?: unknown }> }).getDataRetentionSettings?.({
    name: `${property}/dataRetentionSettings`,
  })) as { data?: unknown };
  
  if (!response) {
    throw createPreconditionError("not_found", "Data retention settings not found", {
      property,
    });
  }

  const responseData = response;
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Data retention settings not found", {
      property,
    });
  }

  return validateSchema(dataRetentionResponseSchema, responseData.data);
}

/**
 * Execute data retention get operation
 */
async function executeDataRetentionGet(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof dataRetentionResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.property.dataRetention.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { property: string }).property },
  });

  logger.info("Executing ga4.property.dataRetention.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(dataRetentionGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const cacheKey = `ga4:property:${validatedRequest.property}:dataRetention`;
  const cached = await checkDataRetentionCache(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  const validatedResponse = await executeDataRetentionGetAPIRequest(validatedRequest.property, ga4Client);

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.property.dataRetention.get completed", {
    opId: envelope.opId,
    property: validatedRequest.property,
  });

  return validatedResponse;
}

/**
 * Register ga4.property.dataRetention.get tool
 */
function registerDataRetentionGetTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.property.dataRetention.get",
    description:
      "Get data retention settings for a GA4 property. Data retention determines how long user-level and event-level data is stored.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executeDataRetentionGet(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.property.dataRetention.get failed", error);
        } else {
          logger.error("ga4.property.dataRetention.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to update data retention settings
 */
async function executeDataRetentionUpdateAPIRequest(
  property: string,
  retentionDays: "RETENTION_14_MONTHS" | "RETENTION_26_MONTHS" | "RETENTION_38_MONTHS" | "RETENTION_50_MONTHS",
  eventDataRetention: "EVENT_DATA_RETENTION_2_MONTHS" | "EVENT_DATA_RETENTION_14_MONTHS" | "EVENT_DATA_RETENTION_26_MONTHS" | "EVENT_DATA_RETENTION_38_MONTHS" | "EVENT_DATA_RETENTION_50_MONTHS" | undefined,
  ga4Client: GA4Client
): Promise<z.infer<typeof dataRetentionResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "updateDataRetentionSettings");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const updateMask = eventDataRetention ? "retentionDays,eventDataRetention" : "retentionDays";
  const response = (await (adminClient.properties as { updateDataRetentionSettings?: (params: { dataRetentionSettings: { name: string; retentionDays: string; eventDataRetention?: string }; updateMask: string }) => Promise<{ data?: unknown }> }).updateDataRetentionSettings?.({
    dataRetentionSettings: {
      name: `${property}/dataRetentionSettings`,
      retentionDays,
      eventDataRetention,
    } as never,
    updateMask,
  })) as { data?: unknown };
  
  if (!response) {
    throw createPreconditionError("not_found", "Data retention settings not found", {
      property,
    });
  }

  const responseData = response;
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Data retention settings not found", {
      property,
    });
  }

  return validateSchema(dataRetentionResponseSchema, responseData.data);
}

/**
 * Execute data retention update operation
 */
async function executeDataRetentionUpdate(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof dataRetentionResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.property.dataRetention.update",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { property: string }).property },
  });

  logger.info("Executing ga4.property.dataRetention.update", { opId: envelope.opId });

  const validatedRequest = validateSchema(dataRetentionUpdateRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const validatedResponse = await executeDataRetentionUpdateAPIRequest(
    validatedRequest.property,
    validatedRequest.retentionDays,
    validatedRequest.eventDataRetention,
    ga4Client
  );

  const cacheKey = `ga4:property:${validatedRequest.property}:dataRetention`;
  await cache.delete(cacheKey);

  logger.info("ga4.property.dataRetention.update completed", {
    opId: envelope.opId,
    property: validatedRequest.property,
    retentionDays: validatedRequest.retentionDays,
  });

  return validatedResponse;
}

/**
 * Register ga4.property.dataRetention.update tool
 */
function registerDataRetentionUpdateTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.property.dataRetention.update",
    description:
      "Update data retention settings for a GA4 property. Set retention period to 14, 26, 38, or 50 months.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executeDataRetentionUpdate(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.property.dataRetention.update failed", error);
        } else {
          logger.error("ga4.property.dataRetention.update failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to list data filters
 */
async function executeDataFilterListAPIRequest(
  property: string,
  pageSize: number | undefined,
  pageToken: string | undefined,
  ga4Client: GA4Client
): Promise<z.infer<typeof dataFilterListResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "listDataFilters");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const params: { parent: string; pageSize?: number; pageToken?: string } = {
    parent: property,
  };
  if (pageSize !== undefined) {
    params.pageSize = pageSize;
  }
  if (pageToken !== undefined) {
    params.pageToken = pageToken;
  }
  const response = (await (adminClient.properties as { dataFilters?: { list?: (params: { parent: string; pageSize?: number; pageToken?: string }) => Promise<{ data?: unknown }> } }).dataFilters?.list?.(params)) as { data?: unknown };
  
  if (!response || !response.data) {
    throw createPreconditionError("not_found", "Data filters not found", {
      property,
    });
  }

  return validateSchema(dataFilterListResponseSchema, response.data);
}

/**
 * Execute data filter list operation
 */
async function executeDataFilterList(
  args: unknown,
  ga4Client: GA4Client,
  _cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof dataFilterListResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.dataFilter.list",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { property: string }).property },
  });

  logger.info("Executing ga4.dataFilter.list", { opId: envelope.opId });

  const validatedRequest = validateSchema(dataFilterListRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const validatedResponse = await executeDataFilterListAPIRequest(
    validatedRequest.property,
    validatedRequest.pageSize,
    validatedRequest.pageToken,
    ga4Client
  );

  logger.info("ga4.dataFilter.list completed", {
    opId: envelope.opId,
    property: validatedRequest.property,
    count: validatedResponse.dataFilters.length,
  });

  return validatedResponse;
}

/**
 * Register ga4.dataFilter.list tool
 */
function registerDataFilterListTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.dataFilter.list",
    description:
      "List data filters for a GA4 property. Data filters include internal traffic filters, bot filters, and exclusion rules.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executeDataFilterList(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.dataFilter.list failed", error);
        } else {
          logger.error("ga4.dataFilter.list failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Check cache and return data filter if found
 */
async function checkDataFilterCache(
  cacheKey: string,
  cache: ICache,
  logger: ILogger
): Promise<z.infer<typeof dataFilterGetResponseSchema> | null> {
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for data filter", { cacheKey });
    return validateSchema(dataFilterGetResponseSchema, cached);
  }
  return null;
}

/**
 * Execute API request to get data filter
 */
async function executeDataFilterGetAPIRequest(
  property: string,
  filterId: string,
  ga4Client: GA4Client
): Promise<z.infer<typeof dataFilterGetResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "getDataFilter");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const response = (await (adminClient.properties as { dataFilters?: { get?: (params: { name: string }) => Promise<{ data?: unknown }> } }).dataFilters?.get?.({
    name: `${property}/${filterId}`,
  })) as { data?: unknown };
  
  if (!response || !response.data) {
    throw createPreconditionError("not_found", "Data filter not found", {
      property,
      filterId,
    });
  }

  return validateSchema(dataFilterGetResponseSchema, response.data);
}

/**
 * Execute data filter get operation
 */
async function executeDataFilterGet(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof dataFilterGetResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.dataFilter.get",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { property: string }).property },
  });

  logger.info("Executing ga4.dataFilter.get", { opId: envelope.opId });

  const validatedRequest = validateSchema(dataFilterGetRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const cacheKey = `ga4:property:${validatedRequest.property}:dataFilter:${validatedRequest.filterId}`;
  const cached = await checkDataFilterCache(cacheKey, cache, logger);
  if (cached) {
    return cached;
  }

  const validatedResponse = await executeDataFilterGetAPIRequest(
    validatedRequest.property,
    validatedRequest.filterId,
    ga4Client
  );

  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.dataFilter.get completed", {
    opId: envelope.opId,
    property: validatedRequest.property,
    filterId: validatedRequest.filterId,
  });

  return validatedResponse;
}

/**
 * Register ga4.dataFilter.get tool
 */
function registerDataFilterGetTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.dataFilter.get",
    description:
      "Get details of a specific data filter for a GA4 property.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executeDataFilterGet(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.dataFilter.get failed", error);
        } else {
          logger.error("ga4.dataFilter.get failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to create data filter
 */
async function executeDataFilterCreateAPIRequest(
  property: string,
  request: z.infer<typeof dataFilterCreateRequestSchema>,
  ga4Client: GA4Client
): Promise<z.infer<typeof dataFilterCreateResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "createDataFilter");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const response = (await (adminClient.properties as { dataFilters?: { create?: (params: { parent: string; dataFilter: unknown }) => Promise<{ data?: unknown }> } }).dataFilters?.create?.({
    parent: property,
    dataFilter: {
      displayName: request.name,
      type: request.type,
      filterExpression: request.filterExpression,
      applyTo: request.applyTo,
      eventNames: request.eventNames,
    } as never,
  })) as { data?: unknown };
  
  if (!response || !response.data) {
    throw createPreconditionError("precheck_failed", "Failed to create data filter", {
      property,
    });
  }

  return validateSchema(dataFilterCreateResponseSchema, response.data);
}

/**
 * Execute data filter create operation
 */
async function executeDataFilterCreate(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof dataFilterCreateResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.dataFilter.create",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { property: string }).property },
  });

  logger.info("Executing ga4.dataFilter.create", { opId: envelope.opId });

  const validatedRequest = validateSchema(dataFilterCreateRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const validatedResponse = await executeDataFilterCreateAPIRequest(
    validatedRequest.property,
    validatedRequest,
    ga4Client
  );

  const cacheKey = `ga4:property:${validatedRequest.property}:dataFilter:${validatedResponse.filterId || "unknown"}`;
  await cache.delete(cacheKey);

  logger.info("ga4.dataFilter.create completed", {
    opId: envelope.opId,
    property: validatedRequest.property,
    filterName: validatedRequest.name,
  });

  return validatedResponse;
}

/**
 * Register ga4.dataFilter.create tool
 */
function registerDataFilterCreateTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.dataFilter.create",
    description:
      "Create a new data filter for a GA4 property. Supports internal traffic filters, bot filters, and exclusion rules.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executeDataFilterCreate(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.dataFilter.create failed", error);
        } else {
          logger.error("ga4.dataFilter.create failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Build update mask from request
 */
function buildDataFilterUpdateMask(
  request: z.infer<typeof dataFilterUpdateRequestSchema>
): string {
  const fields: string[] = [];
  if (request.displayName !== undefined) {
    fields.push("displayName");
  }
  if (request.state !== undefined) {
    fields.push("state");
  }
  if (request.filterExpression !== undefined) {
    fields.push("filterExpression");
  }
  if (request.applyTo !== undefined) {
    fields.push("applyTo");
  }
  if (request.eventNames !== undefined) {
    fields.push("eventNames");
  }
  return fields.join(",");
}

/**
 * Build updates object from request
 */
function buildDataFilterUpdates(
  request: z.infer<typeof dataFilterUpdateRequestSchema>
): {
  displayName?: string;
  state?: string;
  filterExpression?: unknown;
  applyTo?: string;
  eventNames?: string[];
} {
  const updates: {
    displayName?: string;
    state?: string;
    filterExpression?: unknown;
    applyTo?: string;
    eventNames?: string[];
  } = {};

  if (request.displayName !== undefined) {
    updates.displayName = request.displayName;
  }
  if (request.state !== undefined) {
    updates.state = request.state;
  }
  if (request.filterExpression !== undefined) {
    updates.filterExpression = request.filterExpression;
  }
  if (request.applyTo !== undefined) {
    updates.applyTo = request.applyTo;
  }
  if (request.eventNames !== undefined) {
    updates.eventNames = request.eventNames;
  }

  return updates;
}

/**
 * Execute API request to update data filter
 */
async function executeDataFilterUpdateAPIRequest(
  property: string,
  filterId: string,
  updateMask: string,
  updates: {
    displayName?: string;
    state?: string;
    filterExpression?: unknown;
    applyTo?: string;
    eventNames?: string[];
  },
  ga4Client: GA4Client
): Promise<z.infer<typeof dataFilterUpdateResponseSchema>> {
  await ga4Client.checkRateLimit("ga4", "updateDataFilter");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const response = (await (adminClient.properties as { dataFilters?: { patch?: (params: { name: string; updateMask: string; dataFilter: unknown }) => Promise<{ data?: unknown }> } }).dataFilters?.patch?.({
    name: `${property}/${filterId}`,
    updateMask,
    dataFilter: updates as never,
  })) as { data?: unknown };
  
  if (!response || !response.data) {
    throw createPreconditionError("not_found", "Data filter not found", {
      property,
      filterId,
    });
  }

  return validateSchema(dataFilterUpdateResponseSchema, response.data);
}

/**
 * Execute data filter update operation
 */
async function executeDataFilterUpdate(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof dataFilterUpdateResponseSchema>> {
  const envelope = createOperationEnvelope({
    opName: "ga4.dataFilter.update",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { property: string }).property },
  });

  logger.info("Executing ga4.dataFilter.update", { opId: envelope.opId });

  const validatedRequest = validateSchema(dataFilterUpdateRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  const updateMask = buildDataFilterUpdateMask(validatedRequest);
  const updates = buildDataFilterUpdates(validatedRequest);

  const validatedResponse = await executeDataFilterUpdateAPIRequest(
    validatedRequest.property,
    validatedRequest.filterId,
    updateMask,
    updates,
    ga4Client
  );

  const cacheKey = `ga4:property:${validatedRequest.property}:dataFilter:${validatedRequest.filterId}`;
  await cache.delete(cacheKey);

  logger.info("ga4.dataFilter.update completed", {
    opId: envelope.opId,
    property: validatedRequest.property,
    filterId: validatedRequest.filterId,
  });

  return validatedResponse;
}

/**
 * Register ga4.dataFilter.update tool
 */
function registerDataFilterUpdateTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.dataFilter.update",
    description:
      "Update an existing data filter for a GA4 property.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executeDataFilterUpdate(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.dataFilter.update failed", error);
        } else {
          logger.error("ga4.dataFilter.update failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Execute API request to delete data filter
 */
async function executeDataFilterDeleteAPIRequest(
  property: string,
  filterId: string,
  ga4Client: GA4Client
): Promise<void> {
  await ga4Client.checkRateLimit("ga4", "deleteDataFilter");
  const adminClient = ga4Client.getAnalyticsAdminClient();
  await (adminClient.properties as { dataFilters?: { delete?: (params: { name: string }) => Promise<void> } }).dataFilters?.delete?.({
    name: `${property}/${filterId}`,
  });
}

/**
 * Execute data filter delete operation
 */
async function executeDataFilterDelete(
  args: unknown,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<void> {
  const envelope = createOperationEnvelope({
    opName: "ga4.dataFilter.delete",
    actor: "user",
    request: { args: args as Record<string, unknown> },
    target: { product: "ga4", propertyId: (args as { property: string }).property },
  });

  logger.info("Executing ga4.dataFilter.delete", { opId: envelope.opId });

  const validatedRequest = validateSchema(dataFilterDeleteRequestSchema, args);

  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  await executeDataFilterDeleteAPIRequest(
    validatedRequest.property,
    validatedRequest.filterId,
    ga4Client
  );

  const cacheKey = `ga4:property:${validatedRequest.property}:dataFilter:${validatedRequest.filterId}`;
  await cache.delete(cacheKey);

  logger.info("ga4.dataFilter.delete completed", {
    opId: envelope.opId,
    property: validatedRequest.property,
    filterId: validatedRequest.filterId,
  });
}

/**
 * Register ga4.dataFilter.delete tool
 */
function registerDataFilterDeleteTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "ga4.dataFilter.delete",
    description:
      "Delete a data filter from a GA4 property.",
    inputSchema: {} as Record<string, unknown>, // Schema validation happens in handler
    handler: async (args: unknown) => {
      try {
        return await executeDataFilterDelete(args, ga4Client, cache, capabilitiesRegistry, logger);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("ga4.dataFilter.delete failed", error);
        } else {
          logger.error("ga4.dataFilter.delete failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

