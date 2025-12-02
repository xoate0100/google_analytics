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

