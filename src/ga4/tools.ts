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
  propertySettingsGetRequestSchema,
  propertySettingsResponseSchema,
  propertySettingsUpdateRequestSchema,
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

  // Admin API tools - Property Settings
  registerPropertySettingsGetTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);
  registerPropertySettingsUpdateTool(bootstrap, ga4Client, cache, capabilitiesRegistry, logger);

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

  // Validate input
  const validatedRequest = validateSchema(propertySettingsGetRequestSchema, args);

  // Pre-check: verify capability
  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  // Check cache
  const cacheKey = `ga4:property:${validatedRequest.property}:settings`;
  const cached = await cache.get<unknown>(cacheKey);
  if (cached) {
    logger.debug("Cache hit for property settings", { cacheKey });
    return validateSchema(propertySettingsResponseSchema, cached);
  }

  // Check rate limit
  await ga4Client.checkRateLimit("ga4", "getProperty");

  // Get property settings
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const response = await adminClient.properties.get({
    name: validatedRequest.property,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Property not found", {
      property: validatedRequest.property,
    });
  }

  const validatedResponse = validateSchema(propertySettingsResponseSchema, responseData.data);

  // Cache response (TTL: 5 minutes)
  await cache.set(cacheKey, validatedResponse, 300000);

  logger.info("ga4.property.settings.get completed", {
    opId: envelope.opId,
    property: validatedRequest.property,
  });

  return validatedResponse;
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

  // Validate input
  const validatedRequest = validateSchema(propertySettingsUpdateRequestSchema, args);

  // Pre-check: verify capability
  const hasCapability = capabilitiesRegistry.hasCapability("ga4", "admin_api");
  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      "GA4 Admin API capability not available",
      { product: "ga4" }
    );
  }

  // Check rate limit
  await ga4Client.checkRateLimit("ga4", "updateProperty");

  // Update property settings
  const adminClient = ga4Client.getAnalyticsAdminClient();
  const updateMask = Object.keys(validatedRequest)
    .filter((key) => key !== "property" && validatedRequest[key as keyof typeof validatedRequest] !== undefined)
    .join(",");

  const response = await adminClient.properties.patch({
    name: validatedRequest.property,
    updateMask,
    requestBody: {
      displayName: validatedRequest.displayName,
      currencyCode: validatedRequest.currencyCode,
      timeZone: validatedRequest.timeZone,
      industryCategory: validatedRequest.industryCategory,
    } as never,
  });

  const responseData = response as { data?: unknown };
  if (!responseData.data) {
    throw createPreconditionError("not_found", "Property not found", {
      property: validatedRequest.property,
    });
  }

  const validatedResponse = validateSchema(propertySettingsResponseSchema, responseData.data);

  // Invalidate cache
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

