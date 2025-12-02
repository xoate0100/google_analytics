/**
 * GA4 Data API Zod schemas
 * Validates request and response structures for GA4 Data API v1
 */

import { z } from "zod";

/**
 * Property ID schema (format: properties/123456789)
 */
const propertyIdSchema = z
  .string()
  .regex(/^properties\/\d+$/, "Property ID must be in format properties/123456789");

/**
 * Date range schema
 */
const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  name: z.string().optional(),
});

/**
 * Dimension schema
 */
const dimensionSchema = z.object({
  name: z.string().min(1),
});

/**
 * Metric schema
 */
const metricSchema = z.object({
  name: z.string().min(1),
  expression: z.string().optional(),
  invisible: z.boolean().optional(),
});

/**
 * String filter schema
 */
const stringFilterSchema = z.object({
  matchType: z.enum([
    "EXACT",
    "BEGINS_WITH",
    "ENDS_WITH",
    "CONTAINS",
    "FULL_REGEXP",
    "PARTIAL_REGEXP",
  ]),
  value: z.string(),
  caseSensitive: z.boolean().optional(),
});

/**
 * In-list filter schema
 */
const inListFilterSchema = z.object({
  values: z.array(z.string()),
  caseSensitive: z.boolean().optional(),
});

/**
 * Numeric value schema
 */
const numericValueSchema = z.union([
  z.object({ int64Value: z.string() }),
  z.object({ doubleValue: z.number() }),
]);

/**
 * Numeric filter schema
 */
const numericFilterSchema = z.object({
  operation: z.enum([
    "EQUAL",
    "LESS_THAN",
    "LESS_THAN_OR_EQUAL",
    "GREATER_THAN",
    "GREATER_THAN_OR_EQUAL",
    "BETWEEN",
  ]),
  value: numericValueSchema,
});

/**
 * Between filter schema
 */
const betweenFilterSchema = z.object({
  fromValue: numericValueSchema,
  toValue: numericValueSchema,
});

/**
 * Filter schema
 */
const filterSchema = z.object({
  fieldName: z.string(),
  stringFilter: stringFilterSchema.optional(),
  inListFilter: inListFilterSchema.optional(),
  numericFilter: numericFilterSchema.optional(),
  betweenFilter: betweenFilterSchema.optional(),
});

/**
 * Filter expression schema
 */
const filterExpressionSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.object({
      andGroup: z.object({
        expressions: z.array(filterExpressionSchema),
      }),
    }),
    z.object({
      orGroup: z.object({
        expressions: z.array(filterExpressionSchema),
      }),
    }),
    z.object({
      notExpression: filterExpressionSchema,
    }),
    z.object({
      filter: filterSchema,
    }),
  ])
);

/**
 * Dimension filter schema
 */
const dimensionFilterSchema = filterExpressionSchema;

/**
 * Metric filter schema
 */
const metricFilterSchema = filterExpressionSchema;

/**
 * Order by schema
 */
const orderBySchema = z.union([
  z.object({
    dimension: z.object({
      dimensionName: z.string(),
      orderType: z.enum(["ALPHANUMERIC", "CASE_INSENSITIVE_ALPHANUMERIC", "NUMERIC"]).optional(),
    }),
    desc: z.boolean().optional(),
  }),
  z.object({
    metric: z.object({
      metricName: z.string(),
    }),
    desc: z.boolean().optional(),
  }),
  z.object({
    pivotOrderBy: z.object({
      pivotSelections: z.array(
        z.object({
          dimensionName: z.string(),
          dimensionValue: z.string(),
        })
      ),
      metricName: z.string().optional(),
    }),
  }),
]);

/**
 * Run Report Request Schema
 */
export const runReportRequestSchema = z.object({
  property: propertyIdSchema,
  dateRanges: z.array(dateRangeSchema).min(1),
  dimensions: z.array(dimensionSchema).optional(),
  metrics: z.array(metricSchema).min(1),
  dimensionFilter: dimensionFilterSchema.optional(),
  metricFilter: metricFilterSchema.optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100000).optional(),
  metricAggregations: z
    .array(z.enum(["TOTAL", "MINIMUM", "MAXIMUM", "COUNT"]))
    .optional(),
  orderBys: z.array(orderBySchema).optional(),
  keepEmptyRows: z.boolean().optional(),
  returnPropertyQuota: z.boolean().optional(),
});

/**
 * Dimension header schema
 */
const dimensionHeaderSchema = z.object({
  name: z.string(),
});

/**
 * Metric header schema
 */
const metricHeaderSchema = z.object({
  name: z.string(),
  type: z.enum([
    "TYPE_UNSPECIFIED",
    "TYPE_INTEGER",
    "TYPE_FLOAT",
    "TYPE_SECONDS",
    "TYPE_MILLISECONDS",
    "TYPE_MINUTES",
    "TYPE_HOURS",
    "TYPE_STANDARD",
    "TYPE_CURRENCY",
    "TYPE_FEET",
    "TYPE_MILES",
    "TYPE_METERS",
    "TYPE_KILOMETERS",
  ]),
});

/**
 * Dimension value schema
 */
const dimensionValueSchema = z.object({
  value: z.string(),
  oneValue: z.string().optional(),
});

/**
 * Metric value schema
 */
const metricValueSchema = z.object({
  value: z.string(),
  oneValue: z.string().optional(),
});

/**
 * Row schema
 */
const rowSchema = z.object({
  dimensionValues: z.array(dimensionValueSchema),
  metricValues: z.array(metricValueSchema),
});

/**
 * Metadata schema
 */
const metadataSchema = z.object({
  currencyCode: z.string().optional(),
  timeZone: z.string(),
  emptyReason: z.string().optional(),
  subjectToThresholding: z.boolean().optional(),
  dataLossFromOtherRow: z.boolean().optional(),
});

/**
 * Run Report Response Schema
 */
export const runReportResponseSchema = z.object({
  dimensionHeaders: z.array(dimensionHeaderSchema),
  metricHeaders: z.array(metricHeaderSchema),
  rows: z.array(rowSchema),
  totals: z.array(rowSchema).optional(),
  maximums: z.array(rowSchema).optional(),
  minimums: z.array(rowSchema).optional(),
  rowCount: z.number().int().min(0),
  metadata: metadataSchema.optional(),
  propertyQuota: z
    .object({
      tokensPerDay: z
        .object({
          consumed: z.number().int(),
          remaining: z.number().int(),
        })
        .optional(),
      tokensPerHour: z
        .object({
          consumed: z.number().int(),
          remaining: z.number().int(),
        })
        .optional(),
      concurrentRequests: z
        .object({
          consumed: z.number().int(),
          remaining: z.number().int(),
        })
        .optional(),
      serverErrorsPerProjectPerHour: z
        .object({
          consumed: z.number().int(),
          remaining: z.number().int(),
        })
        .optional(),
      potentiallyThresholdedRequestsPerHour: z
        .object({
          consumed: z.number().int(),
          remaining: z.number().int(),
        })
        .optional(),
    })
    .optional(),
  kind: z.string().optional(),
});

/**
 * Batch Run Reports Request Schema
 */
export const batchRunReportsRequestSchema = z.object({
  property: propertyIdSchema,
  requests: z
    .array(
      z.object({
        dateRanges: z.array(dateRangeSchema).min(1),
        dimensions: z.array(dimensionSchema).optional(),
        metrics: z.array(metricSchema).min(1),
        dimensionFilter: dimensionFilterSchema.optional(),
        metricFilter: metricFilterSchema.optional(),
        offset: z.number().int().min(0).optional(),
        limit: z.number().int().min(1).max(100000).optional(),
        metricAggregations: z
          .array(z.enum(["TOTAL", "MINIMUM", "MAXIMUM", "COUNT"]))
          .optional(),
        orderBys: z.array(orderBySchema).optional(),
        keepEmptyRows: z.boolean().optional(),
      })
    )
    .min(1),
});

/**
 * Batch Run Reports Response Schema
 */
export const batchRunReportsResponseSchema = z.object({
  reports: z.array(runReportResponseSchema),
  kind: z.string().optional(),
});

/**
 * Pivot schema
 */
const pivotSchema = z.object({
  fieldNames: z.array(z.string()).min(1),
  limit: z.number().int().min(1).optional(),
  orderBys: z.array(orderBySchema).optional(),
  offset: z.number().int().min(0).optional(),
});

/**
 * Run Pivot Report Request Schema
 */
export const runPivotReportRequestSchema = z.object({
  property: propertyIdSchema,
  dateRanges: z.array(dateRangeSchema).min(1),
  dimensions: z.array(dimensionSchema).optional(),
  metrics: z.array(metricSchema).min(1),
  pivots: z.array(pivotSchema).min(1),
  dimensionFilter: dimensionFilterSchema.optional(),
  metricFilter: metricFilterSchema.optional(),
  keepEmptyRows: z.boolean().optional(),
  returnPropertyQuota: z.boolean().optional(),
});

/**
 * Pivot header entry schema
 */
const pivotHeaderEntrySchema = z.object({
  dimensionName: z.string(),
  dimensionValue: z.string(),
  metricValues: z.array(metricValueSchema).optional(),
});

/**
 * Pivot header schema
 */
const pivotHeaderSchema = z.object({
  pivotHeaderEntries: z.array(pivotHeaderEntrySchema),
  totalPivotRowsCount: z.number().int().min(0).optional(),
});

/**
 * Run Pivot Report Response Schema
 */
export const runPivotReportResponseSchema = z.object({
  pivotHeaders: z.array(pivotHeaderSchema),
  dimensionHeaders: z.array(dimensionHeaderSchema),
  metricHeaders: z.array(metricHeaderSchema),
  rows: z.array(rowSchema),
  aggregates: z.array(rowSchema).optional(),
  metadata: metadataSchema.optional(),
  propertyQuota: runReportResponseSchema.shape.propertyQuota.optional(),
  kind: z.string().optional(),
});

/**
 * Run Realtime Report Request Schema
 */
export const runRealtimeReportRequestSchema = z.object({
  property: propertyIdSchema,
  dimensions: z.array(dimensionSchema).optional(),
  metrics: z.array(metricSchema).optional(),
  dimensionFilter: dimensionFilterSchema.optional(),
  metricFilter: metricFilterSchema.optional(),
  limit: z.number().int().min(1).max(100000).optional(),
  metricAggregations: z
    .array(z.enum(["TOTAL", "MINIMUM", "MAXIMUM", "COUNT"]))
    .optional(),
  orderBys: z.array(orderBySchema).optional(),
  returnPropertyQuota: z.boolean().optional(),
  minuteRanges: z
    .array(
      z.object({
        startMinutesAgo: z.number().int().min(0),
        endMinutesAgo: z.number().int().min(0).optional(),
      })
    )
    .optional(),
});

/**
 * Run Realtime Report Response Schema
 */
export const runRealtimeReportResponseSchema = z.object({
  dimensionHeaders: z.array(dimensionHeaderSchema),
  metricHeaders: z.array(metricHeaderSchema),
  rows: z.array(rowSchema),
  totals: z.array(rowSchema).optional(),
  maximums: z.array(rowSchema).optional(),
  minimums: z.array(rowSchema).optional(),
  rowCount: z.number().int().min(0),
  propertyQuota: runReportResponseSchema.shape.propertyQuota.optional(),
  kind: z.string().optional(),
});

/**
 * Measurement Protocol Event Schema
 */
const measurementEventSchema = z.object({
  name: z.string().min(1),
  params: z.record(z.unknown()).optional(),
});

/**
 * Measurement Protocol Request Schema
 */
export const measurementRequestSchema = z.object({
  client_id: z.string().optional(),
  user_id: z.string().optional(),
  events: z.array(measurementEventSchema).min(1),
  user_properties: z.record(z.object({ value: z.string().optional(), set_once: z.boolean().optional() })).optional(),
  timestamp_micros: z.string().optional(),
  non_personalized_ads: z.boolean().optional(),
});

/**
 * Measurement Protocol Validation Response Schema
 */
export const measurementValidationResponseSchema = z.object({
  validationMessages: z.array(
    z.object({
      fieldPath: z.string().optional(),
      description: z.string(),
      validationCode: z.string().optional(),
    })
  ),
});

/**
 * Account ID schema (format: accounts/123456789)
 */
const accountIdSchema = z
  .string()
  .regex(/^accounts\/\d+$/, "Account ID must be in format accounts/123456789");

/**
 * Property List Request Schema
 */
export const propertyListRequestSchema = z.object({
  parent: accountIdSchema.optional(),
  pageSize: z.number().int().positive().max(200).optional(),
  pageToken: z.string().optional(),
  filter: z.string().optional(),
  showDeleted: z.boolean().optional(),
});

/**
 * Property List Response Schema
 */
export const propertyListResponseSchema = z.object({
  properties: z.array(
    z.object({
      name: z.string(),
      displayName: z.string().optional(),
      propertyType: z
        .enum(["PROPERTY_TYPE_ORDINARY", "PROPERTY_TYPE_SUBPROPERTY", "PROPERTY_TYPE_ROLLUP"])
        .optional(),
      parent: z.string().optional(),
      createTime: z.string().optional(),
      updateTime: z.string().optional(),
      deleteTime: z.string().optional(),
      expireTime: z.string().optional(),
      account: z.string().optional(),
      industryCategory: z.string().optional(),
      timeZone: z.string().optional(),
      currencyCode: z.string().optional(),
      serviceLevel: z.enum(["ANALYTICS_360", "GOOGLE_ANALYTICS"]).optional(),
    })
  ),
  nextPageToken: z.string().optional(),
});

/**
 * Property Get Request Schema
 */
export const propertyGetRequestSchema = z.object({
  name: propertyIdSchema,
});

/**
 * Property Get Response Schema
 */
export const propertyGetResponseSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
  propertyType: z
    .enum(["PROPERTY_TYPE_ORDINARY", "PROPERTY_TYPE_SUBPROPERTY", "PROPERTY_TYPE_ROLLUP"])
    .optional(),
  parent: z.string().optional(),
  createTime: z.string().optional(),
  updateTime: z.string().optional(),
  deleteTime: z.string().optional(),
  expireTime: z.string().optional(),
  account: z.string().optional(),
  industryCategory: z.string().optional(),
  timeZone: z.string().optional(),
  currencyCode: z.string().optional(),
  serviceLevel: z.enum(["ANALYTICS_360", "GOOGLE_ANALYTICS"]).optional(),
});

/**
 * Property Upsert Request Schema
 */
export const propertyUpsertRequestSchema = z.object({
  parent: accountIdSchema,
  name: propertyIdSchema.optional(),
  displayName: z.string().min(1, "Display name is required"),
  timeZone: z.string().optional(),
  currencyCode: z.string().optional(),
  industryCategory: z.string().optional(),
  propertyType: z
    .enum(["PROPERTY_TYPE_ORDINARY", "PROPERTY_TYPE_SUBPROPERTY", "PROPERTY_TYPE_ROLLUP"])
    .optional(),
});

/**
 * Property Upsert Response Schema
 */
export const propertyUpsertResponseSchema = propertyGetResponseSchema;

/**
 * Property Delete Request Schema
 */
export const propertyDeleteRequestSchema = z.object({
  name: propertyIdSchema,
});

/**
 * Property Delete Response Schema
 */
export const propertyDeleteResponseSchema = z.object({
  success: z.boolean(),
  name: z.string(),
});

/**
 * Data Stream ID schema (format: properties/123456789/dataStreams/987654321)
 */
const dataStreamIdSchema = z
  .string()
  .regex(
    /^properties\/\d+\/dataStreams\/\d+$/,
    "Data stream ID must be in format properties/123456789/dataStreams/987654321"
  );

/**
 * Data Stream List Request Schema
 */
export const dataStreamListRequestSchema = z.object({
  parent: propertyIdSchema,
  pageSize: z.number().int().positive().max(200).optional(),
  pageToken: z.string().optional(),
});

/**
 * Data Stream List Response Schema
 */
export const dataStreamListResponseSchema = z.object({
  dataStreams: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["WEB_DATA_STREAM", "IOS_APP_DATA_STREAM", "ANDROID_APP_DATA_STREAM"]),
      displayName: z.string().optional(),
      createTime: z.string().optional(),
      updateTime: z.string().optional(),
      webStreamData: z
        .object({
          measurementId: z.string().optional(),
          firebaseAppId: z.string().optional(),
          defaultUri: z.string().optional(),
        })
        .optional(),
      iosAppStreamData: z
        .object({
          firebaseAppId: z.string().optional(),
          bundleId: z.string().optional(),
        })
        .optional(),
      androidAppStreamData: z
        .object({
          firebaseAppId: z.string().optional(),
          packageName: z.string().optional(),
        })
        .optional(),
    })
  ),
  nextPageToken: z.string().optional(),
});

/**
 * Data Stream Get Request Schema
 */
export const dataStreamGetRequestSchema = z.object({
  name: dataStreamIdSchema,
});

/**
 * Data Stream Get Response Schema
 */
export const dataStreamGetResponseSchema = z.object({
  name: z.string(),
  type: z.enum(["WEB_DATA_STREAM", "IOS_APP_DATA_STREAM", "ANDROID_APP_DATA_STREAM"]),
  displayName: z.string().optional(),
  createTime: z.string().optional(),
  updateTime: z.string().optional(),
  webStreamData: z
    .object({
      measurementId: z.string().optional(),
      firebaseAppId: z.string().optional(),
      defaultUri: z.string().optional(),
    })
    .optional(),
  iosAppStreamData: z
    .object({
      firebaseAppId: z.string().optional(),
      bundleId: z.string().optional(),
    })
    .optional(),
  androidAppStreamData: z
    .object({
      firebaseAppId: z.string().optional(),
      packageName: z.string().optional(),
    })
    .optional(),
});

/**
 * Data Stream Upsert Request Schema
 */
export const dataStreamUpsertRequestSchema = z.object({
  parent: propertyIdSchema,
  name: dataStreamIdSchema.optional(),
  displayName: z.string().min(1, "Display name is required"),
  type: z.enum(["WEB_DATA_STREAM", "IOS_APP_DATA_STREAM", "ANDROID_APP_DATA_STREAM"]),
  webStreamData: z
    .object({
      defaultUri: z.string().url().optional(),
    })
    .optional(),
  iosAppStreamData: z
    .object({
      bundleId: z.string().optional(),
    })
    .optional(),
  androidAppStreamData: z
    .object({
      packageName: z.string().optional(),
    })
    .optional(),
});

/**
 * Data Stream Upsert Response Schema
 */
export const dataStreamUpsertResponseSchema = dataStreamGetResponseSchema;

/**
 * Data Stream Delete Request Schema
 */
export const dataStreamDeleteRequestSchema = z.object({
  name: dataStreamIdSchema,
});

/**
 * Data Stream Delete Response Schema
 */
export const dataStreamDeleteResponseSchema = z.object({
  success: z.boolean(),
  name: z.string(),
});

/**
 * Enhanced Measurement Get Request Schema
 */
export const enhancedMeasurementGetRequestSchema = z.object({
  name: z
    .string()
    .regex(
      /^properties\/\d+\/dataStreams\/\d+$/,
      "Data stream name must be in format properties/123456789/dataStreams/987654321"
    ),
});

/**
 * Enhanced Measurement Response Schema
 */
export const enhancedMeasurementResponseSchema = z.object({
  name: z.string(),
  streamEnabled: z.boolean().optional(),
  scrollsEnabled: z.boolean().optional(),
  scrollsThresholdPercent: z.number().int().min(0).max(100).optional(),
  outboundClicksEnabled: z.boolean().optional(),
  siteSearchEnabled: z.boolean().optional(),
  videoEngagementEnabled: z.boolean().optional(),
  fileDownloadsEnabled: z.boolean().optional(),
  pageChangesEnabled: z.boolean().optional(),
  pageViewsEnabled: z.boolean().optional(),
});

/**
 * Enhanced Measurement Update Request Schema
 */
export const enhancedMeasurementUpdateRequestSchema = z.object({
  name: z
    .string()
    .regex(
      /^properties\/\d+\/dataStreams\/\d+$/,
      "Data stream name must be in format properties/123456789/dataStreams/987654321"
    ),
  streamEnabled: z.boolean().optional(),
  scrollsEnabled: z.boolean().optional(),
  scrollsThresholdPercent: z.number().int().min(0).max(100).optional(),
  outboundClicksEnabled: z.boolean().optional(),
  siteSearchEnabled: z.boolean().optional(),
  videoEngagementEnabled: z.boolean().optional(),
  fileDownloadsEnabled: z.boolean().optional(),
  pageChangesEnabled: z.boolean().optional(),
  pageViewsEnabled: z.boolean().optional(),
});

/**
 * Enhanced Measurement Update Response Schema
 */
export const enhancedMeasurementUpdateResponseSchema = enhancedMeasurementResponseSchema;

/**
 * Custom Dimension ID schema (format: properties/123456789/customDimensions/dimension_name)
 */
const customDimensionIdSchema = z
  .string()
  .regex(
    /^properties\/\d+\/customDimensions\/[a-zA-Z0-9_]+$/,
    "Custom dimension ID must be in format properties/123456789/customDimensions/dimension_name"
  );

/**
 * Custom Dimension List Request Schema
 */
export const customDimensionListRequestSchema = z.object({
  parent: propertyIdSchema,
  pageSize: z.number().int().positive().max(200).optional(),
  pageToken: z.string().optional(),
});

/**
 * Custom Dimension List Response Schema
 */
export const customDimensionListResponseSchema = z.object({
  customDimensions: z.array(
    z.object({
      name: z.string(),
      parameterName: z.string().optional(),
      displayName: z.string().optional(),
      description: z.string().optional(),
      scope: z.enum(["USER", "EVENT", "ITEM"]).optional(),
      disallowAdsPersonalization: z.boolean().optional(),
    })
  ),
  nextPageToken: z.string().optional(),
});

/**
 * Custom Dimension Get Request Schema
 */
export const customDimensionGetRequestSchema = z.object({
  name: customDimensionIdSchema,
});

/**
 * Custom Dimension Get Response Schema
 */
export const customDimensionGetResponseSchema = z.object({
  name: z.string(),
  parameterName: z.string().optional(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  scope: z.enum(["USER", "EVENT", "ITEM"]).optional(),
  disallowAdsPersonalization: z.boolean().optional(),
});

/**
 * Custom Dimension Upsert Request Schema
 */
export const customDimensionUpsertRequestSchema = z.object({
  parent: propertyIdSchema,
  parameterName: z.string().min(1, "Parameter name is required"),
  displayName: z.string().min(1, "Display name is required").optional(),
  description: z.string().optional(),
  scope: z.enum(["USER", "EVENT", "ITEM"]),
  disallowAdsPersonalization: z.boolean().optional(),
});

/**
 * Custom Dimension Upsert Response Schema
 */
export const customDimensionUpsertResponseSchema = customDimensionGetResponseSchema;

/**
 * Custom Dimension Delete Request Schema
 */
export const customDimensionDeleteRequestSchema = z.object({
  name: customDimensionIdSchema,
});

/**
 * Custom Dimension Delete Response Schema
 */
export const customDimensionDeleteResponseSchema = z.object({
  success: z.boolean(),
  name: z.string(),
});

/**
 * Custom Metric ID schema (format: properties/123456789/customMetrics/metric_name)
 */
const customMetricIdSchema = z
  .string()
  .regex(
    /^properties\/\d+\/customMetrics\/[a-zA-Z0-9_]+$/,
    "Custom metric ID must be in format properties/123456789/customMetrics/metric_name"
  );

/**
 * Custom Metric List Request Schema
 */
export const customMetricListRequestSchema = z.object({
  parent: propertyIdSchema,
  pageSize: z.number().int().positive().max(200).optional(),
  pageToken: z.string().optional(),
});

/**
 * Custom Metric List Response Schema
 */
export const customMetricListResponseSchema = z.object({
  customMetrics: z.array(
    z.object({
      name: z.string(),
      parameterName: z.string().optional(),
      displayName: z.string().optional(),
      description: z.string().optional(),
      measurementUnit: z
        .enum([
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
        ])
        .optional(),
      scope: z.enum(["USER", "EVENT", "ITEM"]).optional(),
      type: z.enum(["INTEGER", "FLOAT", "SECONDS", "MILLISECONDS", "CURRENCY", "FEET", "METERS"]).optional(),
    })
  ),
  nextPageToken: z.string().optional(),
});

/**
 * Custom Metric Get Request Schema
 */
export const customMetricGetRequestSchema = z.object({
  name: customMetricIdSchema,
});

/**
 * Custom Metric Get Response Schema
 */
export const customMetricGetResponseSchema = z.object({
  name: z.string(),
  parameterName: z.string().optional(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  measurementUnit: z
    .enum([
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
    ])
    .optional(),
  scope: z.enum(["USER", "EVENT", "ITEM"]).optional(),
  type: z.enum(["INTEGER", "FLOAT", "SECONDS", "MILLISECONDS", "CURRENCY", "FEET", "METERS"]).optional(),
});

/**
 * Custom Metric Upsert Request Schema
 */
export const customMetricUpsertRequestSchema = z.object({
  parent: propertyIdSchema,
  parameterName: z.string().min(1, "Parameter name is required"),
  displayName: z.string().min(1, "Display name is required").optional(),
  description: z.string().optional(),
  measurementUnit: z
    .enum([
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
    ])
    .optional(),
  scope: z.enum(["USER", "EVENT", "ITEM"]),
  type: z.enum(["INTEGER", "FLOAT", "SECONDS", "MILLISECONDS", "CURRENCY", "FEET", "METERS"]),
});

/**
 * Custom Metric Upsert Response Schema
 */
export const customMetricUpsertResponseSchema = customMetricGetResponseSchema;

/**
 * Custom Metric Delete Request Schema
 */
export const customMetricDeleteRequestSchema = z.object({
  name: customMetricIdSchema,
});

/**
 * Custom Metric Delete Response Schema
 */
export const customMetricDeleteResponseSchema = z.object({
  success: z.boolean(),
  name: z.string(),
});

/**
 * Event Create Rule ID schema (format: properties/123456789/eventCreateRules/event_name)
 */
const eventCreateRuleIdSchema = z
  .string()
  .regex(
    /^properties\/\d+\/eventCreateRules\/[a-zA-Z0-9_]+$/,
    "Event create rule ID must be in format properties/123456789/eventCreateRules/event_name"
  );

/**
 * Event List Request Schema
 */
export const eventListRequestSchema = z.object({
  parent: propertyIdSchema,
  pageSize: z.number().int().positive().max(200).optional(),
  pageToken: z.string().optional(),
});

/**
 * Event List Response Schema
 */
export const eventListResponseSchema = z.object({
  events: z.array(
    z.object({
      name: z.string(),
      eventName: z.string().optional(),
      createEvent: z.boolean().optional(),
      matchingCondition: z
        .object({
          field: z.string().optional(),
          comparisonType: z.string().optional(),
          value: z.string().optional(),
        })
        .optional(),
    })
  ),
  nextPageToken: z.string().optional(),
});

/**
 * Event Get Request Schema
 */
export const eventGetRequestSchema = z.object({
  name: eventCreateRuleIdSchema,
});

/**
 * Event Get Response Schema
 */
export const eventGetResponseSchema = z.object({
  name: z.string(),
  eventName: z.string().optional(),
  createEvent: z.boolean().optional(),
  matchingCondition: z
    .object({
      field: z.string().optional(),
      comparisonType: z.string().optional(),
      value: z.string().optional(),
    })
    .optional(),
});

/**
 * Event Upsert Request Schema
 */
export const eventUpsertRequestSchema = z.object({
  parent: propertyIdSchema,
  eventName: z.string().min(1, "Event name is required"),
  createEvent: z.boolean().optional(),
  matchingCondition: z
    .object({
      field: z.string().optional(),
      comparisonType: z.string().optional(),
      value: z.string().optional(),
    })
    .optional(),
});

/**
 * Event Upsert Response Schema
 */
export const eventUpsertResponseSchema = eventGetResponseSchema;

/**
 * Event Parameter List Request Schema
 * Note: Event parameters are dynamic and not directly supported via API.
 * Use custom dimensions instead for event parameter tracking.
 */
export const eventParameterListRequestSchema = z.object({
  parent: propertyIdSchema,
  eventName: z.string().min(1, "Event name is required"),
});

/**
 * Event Parameter List Response Schema
 */
export const eventParameterListResponseSchema = z.object({
  parameters: z.array(
    z.object({
      parameterName: z.string(),
      parameterType: z.string().optional(),
      required: z.boolean().optional(),
      description: z.string().optional(),
    })
  ),
  note: z.string().optional(),
});

/**
 * Event Parameter Upsert Request Schema
 */
export const eventParameterUpsertRequestSchema = z.object({
  parent: propertyIdSchema,
  eventName: z.string().min(1, "Event name is required"),
  parameterName: z.string().min(1, "Parameter name is required"),
  parameterType: z.string().optional(),
  required: z.boolean().optional(),
  description: z.string().optional(),
});

/**
 * Event Parameter Upsert Response Schema
 */
export const eventParameterUpsertResponseSchema = z.object({
  success: z.boolean(),
  note: z.string(),
  suggestion: z.string(),
});

/**
 * Event Parameter Delete Request Schema
 */
export const eventParameterDeleteRequestSchema = z.object({
  parent: propertyIdSchema,
  eventName: z.string().min(1, "Event name is required"),
  parameterName: z.string().min(1, "Parameter name is required"),
});

/**
 * Event Parameter Delete Response Schema
 */
export const eventParameterDeleteResponseSchema = z.object({
  success: z.boolean(),
  note: z.string(),
});

/**
 * Conversion Event ID schema (format: properties/123456789/conversionEvents/event_name)
 */
const conversionEventIdSchema = z
  .string()
  .regex(
    /^properties\/\d+\/conversionEvents\/[a-zA-Z0-9_]+$/,
    "Conversion event ID must be in format properties/123456789/conversionEvents/event_name"
  );

/**
 * Conversion List Request Schema
 */
export const conversionListRequestSchema = z.object({
  parent: propertyIdSchema,
  pageSize: z.number().int().positive().max(200).optional(),
  pageToken: z.string().optional(),
});

/**
 * Conversion List Response Schema
 */
export const conversionListResponseSchema = z.object({
  conversions: z.array(
    z.object({
      name: z.string(),
      eventName: z.string().optional(),
      createTime: z.string().optional(),
      deletable: z.boolean().optional(),
      custom: z.boolean().optional(),
      countingMethod: z.enum(["CONVERSION_COUNTING_METHOD_UNSPECIFIED", "ONCE_PER_EVENT", "ONCE_PER_SESSION"]).optional(),
    })
  ),
  nextPageToken: z.string().optional(),
});

/**
 * Conversion Get Request Schema
 */
export const conversionGetRequestSchema = z.object({
  name: conversionEventIdSchema,
});

/**
 * Conversion Get Response Schema
 */
export const conversionGetResponseSchema = z.object({
  name: z.string(),
  eventName: z.string().optional(),
  createTime: z.string().optional(),
  deletable: z.boolean().optional(),
  custom: z.boolean().optional(),
  countingMethod: z.enum(["CONVERSION_COUNTING_METHOD_UNSPECIFIED", "ONCE_PER_EVENT", "ONCE_PER_SESSION"]).optional(),
});

/**
 * Conversion Upsert Request Schema
 */
export const conversionUpsertRequestSchema = z.object({
  parent: propertyIdSchema,
  eventName: z.string().min(1, "Event name is required"),
  countingMethod: z.enum(["CONVERSION_COUNTING_METHOD_UNSPECIFIED", "ONCE_PER_EVENT", "ONCE_PER_SESSION"]).optional(),
});

/**
 * Conversion Upsert Response Schema
 */
export const conversionUpsertResponseSchema = conversionGetResponseSchema;

/**
 * Conversion Delete Request Schema
 */
export const conversionDeleteRequestSchema = z.object({
  name: conversionEventIdSchema,
});

/**
 * Conversion Delete Response Schema
 */
export const conversionDeleteResponseSchema = z.object({
  success: z.boolean(),
  name: z.string(),
});

/**
 * Audience ID schema (format: properties/123456789/audiences/987654321)
 */
const audienceIdSchema = z
  .string()
  .regex(
    /^properties\/\d+\/audiences\/\d+$/,
    "Audience ID must be in format properties/123456789/audiences/987654321"
  );

/**
 * Audience List Request Schema
 */
export const audienceListRequestSchema = z.object({
  parent: propertyIdSchema,
  pageSize: z.number().int().positive().max(200).optional(),
  pageToken: z.string().optional(),
});

/**
 * Audience List Response Schema
 */
export const audienceListResponseSchema = z.object({
  audiences: z.array(
    z.object({
      name: z.string(),
      displayName: z.string().optional(),
      description: z.string().optional(),
      membershipDurationDays: z.number().int().min(1).max(540).optional(),
      audienceType: z.string().optional(),
    })
  ),
  nextPageToken: z.string().optional(),
});

/**
 * Audience Get Request Schema
 */
export const audienceGetRequestSchema = z.object({
  name: audienceIdSchema,
});

/**
 * Audience Get Response Schema
 */
export const audienceGetResponseSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  membershipDurationDays: z.number().int().min(1).max(540).optional(),
  audienceType: z.string().optional(),
  filterClauses: z.array(z.unknown()).optional(),
});

/**
 * Audience Upsert Request Schema
 */
export const audienceUpsertRequestSchema = z.object({
  parent: propertyIdSchema,
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().optional(),
  membershipDurationDays: z.number().int().min(1).max(540).optional(),
  filterClauses: z.array(z.unknown()).optional(),
});

/**
 * Audience Upsert Response Schema
 */
export const audienceUpsertResponseSchema = audienceGetResponseSchema;

/**
 * Audience Delete Request Schema
 */
export const audienceDeleteRequestSchema = z.object({
  name: audienceIdSchema,
});

/**
 * Audience Delete Response Schema
 */
export const audienceDeleteResponseSchema = z.object({
  success: z.boolean(),
  name: z.string(),
});

/**
 * Attribution Settings ID schema (format: properties/123456789/attributionSettings)
 */
const attributionSettingsIdSchema = z
  .string()
  .regex(
    /^properties\/\d+\/attributionSettings$/,
    "Attribution settings ID must be in format properties/123456789/attributionSettings"
  );

/**
 * Attribution Get Request Schema
 */
export const attributionGetRequestSchema = z.object({
  name: attributionSettingsIdSchema,
});

/**
 * Attribution Get Response Schema
 */
export const attributionGetResponseSchema = z.object({
  name: z.string(),
  acquisitionConversionEventLookbackWindow: z
    .enum([
      "ACQUISITION_CONVERSION_EVENT_LOOKBACK_WINDOW_UNSPECIFIED",
      "ACQUISITION_CONVERSION_EVENT_LOOKBACK_WINDOW_7_DAYS",
      "ACQUISITION_CONVERSION_EVENT_LOOKBACK_WINDOW_30_DAYS",
      "ACQUISITION_CONVERSION_EVENT_LOOKBACK_WINDOW_60_DAYS",
      "ACQUISITION_CONVERSION_EVENT_LOOKBACK_WINDOW_90_DAYS",
    ])
    .optional(),
  attributionLookbackWindow: z
    .enum([
      "ATTRIBUTION_LOOKBACK_WINDOW_UNSPECIFIED",
      "ATTRIBUTION_LOOKBACK_WINDOW_7_DAYS",
      "ATTRIBUTION_LOOKBACK_WINDOW_30_DAYS",
      "ATTRIBUTION_LOOKBACK_WINDOW_60_DAYS",
      "ATTRIBUTION_LOOKBACK_WINDOW_90_DAYS",
    ])
    .optional(),
  attributionModel: z
    .enum([
      "ATTRIBUTION_MODEL_UNSPECIFIED",
      "CROSS_CHANNEL_LAST_CLICK",
      "CROSS_CHANNEL_DATA_DRIVEN",
      "CROSS_CHANNEL_FIRST_CLICK",
      "CROSS_CHANNEL_LINEAR",
      "CROSS_CHANNEL_POSITION_BASED",
      "CROSS_CHANNEL_TIME_DECAY",
      "ADS_PREFERRED_LAST_CLICK",
    ])
    .optional(),
});

/**
 * Attribution Update Request Schema
 */
export const attributionUpdateRequestSchema = z.object({
  name: attributionSettingsIdSchema,
  acquisitionConversionEventLookbackWindow: z
    .enum([
      "ACQUISITION_CONVERSION_EVENT_LOOKBACK_WINDOW_UNSPECIFIED",
      "ACQUISITION_CONVERSION_EVENT_LOOKBACK_WINDOW_7_DAYS",
      "ACQUISITION_CONVERSION_EVENT_LOOKBACK_WINDOW_30_DAYS",
      "ACQUISITION_CONVERSION_EVENT_LOOKBACK_WINDOW_60_DAYS",
      "ACQUISITION_CONVERSION_EVENT_LOOKBACK_WINDOW_90_DAYS",
    ])
    .optional(),
  attributionLookbackWindow: z
    .enum([
      "ATTRIBUTION_LOOKBACK_WINDOW_UNSPECIFIED",
      "ATTRIBUTION_LOOKBACK_WINDOW_7_DAYS",
      "ATTRIBUTION_LOOKBACK_WINDOW_30_DAYS",
      "ATTRIBUTION_LOOKBACK_WINDOW_60_DAYS",
      "ATTRIBUTION_LOOKBACK_WINDOW_90_DAYS",
    ])
    .optional(),
  attributionModel: z
    .enum([
      "ATTRIBUTION_MODEL_UNSPECIFIED",
      "CROSS_CHANNEL_LAST_CLICK",
      "CROSS_CHANNEL_DATA_DRIVEN",
      "CROSS_CHANNEL_FIRST_CLICK",
      "CROSS_CHANNEL_LINEAR",
      "CROSS_CHANNEL_POSITION_BASED",
      "CROSS_CHANNEL_TIME_DECAY",
      "ADS_PREFERRED_LAST_CLICK",
    ])
    .optional(),
});

/**
 * Attribution Update Response Schema
 */
export const attributionUpdateResponseSchema = attributionGetResponseSchema;

/**
 * Google Ads Link ID schema (format: properties/123456789/googleAdsLinks/987654321)
 */
const googleAdsLinkIdSchema = z
  .string()
  .regex(
    /^properties\/\d+\/googleAdsLinks\/\d+$/,
    "Google Ads link ID must be in format properties/123456789/googleAdsLinks/987654321"
  );

/**
 * Google Ads Integration List Request Schema
 */
export const googleAdsIntegrationListRequestSchema = z.object({
  parent: propertyIdSchema,
  pageSize: z.number().int().positive().max(200).optional(),
  pageToken: z.string().optional(),
});

/**
 * Google Ads Integration List Response Schema
 */
export const googleAdsIntegrationListResponseSchema = z.object({
  googleAdsLinks: z.array(
    z.object({
      name: z.string(),
      customerId: z.string().optional(),
      canManageClients: z.boolean().optional(),
      adsPersonalizationEnabled: z.boolean().optional(),
    })
  ),
  nextPageToken: z.string().optional(),
});

/**
 * Google Ads Integration Get Request Schema
 */
export const googleAdsIntegrationGetRequestSchema = z.object({
  name: googleAdsLinkIdSchema,
});

/**
 * Google Ads Integration Get Response Schema
 */
export const googleAdsIntegrationGetResponseSchema = z.object({
  name: z.string(),
  customerId: z.string().optional(),
  canManageClients: z.boolean().optional(),
  adsPersonalizationEnabled: z.boolean().optional(),
});

/**
 * Google Ads Integration Create Request Schema
 */
export const googleAdsIntegrationCreateRequestSchema = z.object({
  parent: propertyIdSchema,
  customerId: z.string().min(1, "Customer ID is required"),
  adsPersonalizationEnabled: z.boolean().optional(),
});

/**
 * Google Ads Integration Create Response Schema
 */
export const googleAdsIntegrationCreateResponseSchema = googleAdsIntegrationGetResponseSchema;

/**
 * Google Ads Integration Update Request Schema
 */
export const googleAdsIntegrationUpdateRequestSchema = z.object({
  name: googleAdsLinkIdSchema,
  adsPersonalizationEnabled: z.boolean().optional(),
});

/**
 * Google Ads Integration Update Response Schema
 */
export const googleAdsIntegrationUpdateResponseSchema = googleAdsIntegrationGetResponseSchema;

/**
 * Google Ads Integration Delete Request Schema
 */
export const googleAdsIntegrationDeleteRequestSchema = z.object({
  name: googleAdsLinkIdSchema,
});

/**
 * Google Ads Integration Delete Response Schema
 */
export const googleAdsIntegrationDeleteResponseSchema = z.object({
  success: z.boolean(),
  name: z.string(),
});

/**
 * BigQuery Link ID schema (format: properties/123456789/bigQueryLinks/987654321)
 */
const bigQueryLinkIdSchema = z
  .string()
  .regex(
    /^properties\/\d+\/bigQueryLinks\/\d+$/,
    "BigQuery link ID must be in format properties/123456789/bigQueryLinks/987654321"
  );

/**
 * BigQuery Integration List Request Schema
 */
export const bigQueryIntegrationListRequestSchema = z.object({
  parent: propertyIdSchema,
  pageSize: z.number().int().positive().max(200).optional(),
  pageToken: z.string().optional(),
});

/**
 * BigQuery Integration List Response Schema
 */
export const bigQueryIntegrationListResponseSchema = z.object({
  bigQueryLinks: z.array(
    z.object({
      name: z.string(),
      project: z.string().optional(),
      dataset: z.string().optional(),
      createTime: z.string().optional(),
    })
  ),
  nextPageToken: z.string().optional(),
});

/**
 * BigQuery Integration Get Request Schema
 */
export const bigQueryIntegrationGetRequestSchema = z.object({
  name: bigQueryLinkIdSchema,
});

/**
 * BigQuery Integration Get Response Schema
 */
export const bigQueryIntegrationGetResponseSchema = z.object({
  name: z.string(),
  project: z.string().optional(),
  dataset: z.string().optional(),
  createTime: z.string().optional(),
});

/**
 * BigQuery Integration Create Request Schema
 */
export const bigQueryIntegrationCreateRequestSchema = z.object({
  parent: propertyIdSchema,
  project: z.string().min(1, "Project ID is required"),
  dataset: z.string().optional(),
});

/**
 * BigQuery Integration Create Response Schema
 */
export const bigQueryIntegrationCreateResponseSchema = bigQueryIntegrationGetResponseSchema;

/**
 * BigQuery Integration Delete Request Schema
 */
export const bigQueryIntegrationDeleteRequestSchema = z.object({
  name: bigQueryLinkIdSchema,
});

/**
 * BigQuery Integration Delete Response Schema
 */
export const bigQueryIntegrationDeleteResponseSchema = z.object({
  success: z.boolean(),
  name: z.string(),
});

/**
 * Property Settings Get Request Schema
 */
export const propertySettingsGetRequestSchema = z.object({
  property: propertyIdSchema,
});

/**
 * Property Settings Response Schema
 */
export const propertySettingsResponseSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
  currencyCode: z.string().optional(),
  timeZone: z.string().optional(),
  industryCategory: z.string().optional(),
  serviceLevel: z.enum(["ANALYTICS_360", "GOOGLE_ANALYTICS"]).optional(),
  account: z.string().optional(),
  createTime: z.string().optional(),
  updateTime: z.string().optional(),
});

/**
 * Property Settings Update Request Schema
 */
export const propertySettingsUpdateRequestSchema = z.object({
  property: propertyIdSchema,
  displayName: z.string().optional(),
  currencyCode: z.string().optional(),
  timeZone: z.string().optional(),
  industryCategory: z.string().optional(),
});

/**
 * Google Signals Get Request Schema
 */
export const googleSignalsGetRequestSchema = z.object({
  property: propertyIdSchema,
});

/**
 * Google Signals Response Schema
 */
export const googleSignalsResponseSchema = z.object({
  name: z.string(),
  state: z.enum(["GOOGLE_SIGNALS_STATE_UNSPECIFIED", "GOOGLE_SIGNALS_ENABLED", "GOOGLE_SIGNALS_DISABLED"]),
  consent: z.enum(["GOOGLE_SIGNALS_CONSENT_UNSPECIFIED", "GOOGLE_SIGNALS_CONSENT_CONSENTED", "GOOGLE_SIGNALS_CONSENT_NOT_CONSENTED"]).optional(),
});

/**
 * Google Signals Update Request Schema
 */
export const googleSignalsUpdateRequestSchema = z.object({
  property: propertyIdSchema,
  state: z.enum(["GOOGLE_SIGNALS_ENABLED", "GOOGLE_SIGNALS_DISABLED"]),
});

/**
 * Data Retention Get Request Schema
 */
export const dataRetentionGetRequestSchema = z.object({
  property: propertyIdSchema,
});

/**
 * Data Retention Response Schema
 */
export const dataRetentionResponseSchema = z.object({
  name: z.string(),
  retentionDays: z.enum(["RETENTION_DURATION_UNSPECIFIED", "RETENTION_14_MONTHS", "RETENTION_26_MONTHS", "RETENTION_38_MONTHS", "RETENTION_50_MONTHS"]),
  eventDataRetention: z.enum(["EVENT_DATA_RETENTION_UNSPECIFIED", "EVENT_DATA_RETENTION_2_MONTHS", "EVENT_DATA_RETENTION_14_MONTHS", "EVENT_DATA_RETENTION_26_MONTHS", "EVENT_DATA_RETENTION_38_MONTHS", "EVENT_DATA_RETENTION_50_MONTHS"]).optional(),
});

/**
 * Data Retention Update Request Schema
 */
export const dataRetentionUpdateRequestSchema = z.object({
  property: propertyIdSchema,
  retentionDays: z.enum(["RETENTION_14_MONTHS", "RETENTION_26_MONTHS", "RETENTION_38_MONTHS", "RETENTION_50_MONTHS"]),
  eventDataRetention: z.enum(["EVENT_DATA_RETENTION_2_MONTHS", "EVENT_DATA_RETENTION_14_MONTHS", "EVENT_DATA_RETENTION_26_MONTHS", "EVENT_DATA_RETENTION_38_MONTHS", "EVENT_DATA_RETENTION_50_MONTHS"]).optional(),
});

/**
 * Data Filter ID schema (format: dataFilters/123456789)
 */
const dataFilterIdSchema = z
  .string()
  .regex(/^dataFilters\/\d+$/, "Filter ID must be in format dataFilters/123456789");

/**
 * Data Filter List Request Schema
 */
export const dataFilterListRequestSchema = z.object({
  property: propertyIdSchema,
  pageSize: z.number().int().min(1).max(1000).optional(),
  pageToken: z.string().optional(),
});

/**
 * Data Filter Get Request Schema
 */
export const dataFilterGetRequestSchema = z.object({
  property: propertyIdSchema,
  filterId: dataFilterIdSchema,
});

/**
 * Data Filter Type enum
 */
const dataFilterTypeSchema = z.enum([
  "DATA_FILTER_TYPE_UNSPECIFIED",
  "INTERNAL_TRAFFIC",
  "BOT_FILTER",
  "EXCLUDE_EVENTS",
]);

/**
 * Data Filter State enum
 */
const dataFilterStateSchema = z.enum([
  "DATA_FILTER_STATE_UNSPECIFIED",
  "ACTIVE",
  "INACTIVE",
]);

/**
 * Data Filter Apply To enum
 */
const dataFilterApplyToSchema = z.enum([
  "APPLY_TO_UNSPECIFIED",
  "ALL_EVENTS",
  "SPECIFIC_EVENTS",
]);

/**
 * Data Filter Response Schema
 */
export const dataFilterGetResponseSchema = z.object({
  name: z.string(),
  filterId: z.string().optional(),
  displayName: z.string().optional(),
  type: dataFilterTypeSchema,
  state: dataFilterStateSchema.optional(),
  filterExpression: filterExpressionSchema.optional(),
  applyTo: dataFilterApplyToSchema.optional(),
  eventNames: z.array(z.string()).optional(),
  createTime: z.string().optional(),
  updateTime: z.string().optional(),
});

/**
 * Data Filter List Response Schema
 */
export const dataFilterListResponseSchema = z.object({
  dataFilters: z.array(
    z.object({
      name: z.string(),
      filterId: z.string().optional(),
      displayName: z.string().optional(),
      type: dataFilterTypeSchema,
      state: dataFilterStateSchema.optional(),
    })
  ),
  nextPageToken: z.string().optional(),
});

/**
 * Data Filter Create Request Schema
 */
export const dataFilterCreateRequestSchema = z.object({
  property: propertyIdSchema,
  name: z.string().min(1, "Filter name is required"),
  type: dataFilterTypeSchema,
  filterExpression: filterExpressionSchema.optional(),
  applyTo: dataFilterApplyToSchema.optional(),
  eventNames: z.array(z.string()).optional(),
});

/**
 * Data Filter Create Response Schema
 */
export const dataFilterCreateResponseSchema = dataFilterGetResponseSchema;

/**
 * Data Filter Update Request Schema
 */
export const dataFilterUpdateRequestSchema = z.object({
  property: propertyIdSchema,
  filterId: dataFilterIdSchema,
  displayName: z.string().optional(),
  state: dataFilterStateSchema.optional(),
  filterExpression: filterExpressionSchema.optional(),
  applyTo: dataFilterApplyToSchema.optional(),
  eventNames: z.array(z.string()).optional(),
});

/**
 * Data Filter Update Response Schema
 */
export const dataFilterUpdateResponseSchema = dataFilterGetResponseSchema;

/**
 * Data Filter Delete Request Schema
 */
export const dataFilterDeleteRequestSchema = z.object({
  property: propertyIdSchema,
  filterId: dataFilterIdSchema,
});

