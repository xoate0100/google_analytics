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

