import { describe, it, expect } from "vitest";
import {
  runReportRequestSchema,
  runReportResponseSchema,
  batchRunReportsRequestSchema,
  batchRunReportsResponseSchema,
  runPivotReportRequestSchema,
  runPivotReportResponseSchema,
  runRealtimeReportRequestSchema,
  runRealtimeReportResponseSchema,
} from "../../../src/ga4/schemas.js";
import { validateSchema } from "../../../src/core/validation.js";

describe("GA4 Data API Schemas", () => {
  describe("runReportRequestSchema", () => {
    it("should validate valid runReport request", () => {
      const validRequest = {
        property: "properties/123456789",
        dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "sessions" }],
      };

      const result = validateSchema(runReportRequestSchema, validRequest);
      expect(result.property).toBe("properties/123456789");
      expect(result.dateRanges).toHaveLength(1);
      expect(result.dimensions).toHaveLength(1);
      expect(result.metrics).toHaveLength(1);
    });

    it("should validate request with optional fields", () => {
      const validRequest = {
        property: "properties/123456789",
        dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "sessions" }],
        dimensionFilter: {
          filter: {
            fieldName: "country",
            stringFilter: {
              matchType: "EXACT",
              value: "United States",
            },
          },
        },
        metricFilter: {
          filter: {
            fieldName: "sessions",
            numericFilter: {
              operation: "GREATER_THAN",
              value: { int64Value: "100" },
            },
          },
        },
        orderBys: [
          {
            dimension: { dimensionName: "country" },
            desc: false,
          },
        ],
        limit: 100,
        keepEmptyRows: true,
        offset: 0,
      };

      const result = validateSchema(runReportRequestSchema, validRequest);
      expect(result.limit).toBe(100);
      expect(result.keepEmptyRows).toBe(true);
      expect(result.offset).toBe(0);
    });

    it("should reject invalid property format", () => {
      const invalidRequest = {
        property: "invalid",
        dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "sessions" }],
      };

      expect(() => validateSchema(runReportRequestSchema, invalidRequest)).toThrow();
    });

    it("should reject missing required fields", () => {
      const invalidRequest = {
        property: "properties/123456789",
        // Missing dateRanges, dimensions, metrics
      };

      expect(() => validateSchema(runReportRequestSchema, invalidRequest)).toThrow();
    });
  });

  describe("runReportResponseSchema", () => {
    it("should validate valid runReport response", () => {
      const validResponse = {
        dimensionHeaders: [{ name: "country" }],
        metricHeaders: [{ name: "sessions", type: "TYPE_INTEGER" }],
        rows: [
          {
            dimensionValues: [{ value: "United States" }],
            metricValues: [{ value: "1000" }],
          },
        ],
        rowCount: 1,
        metadata: {
          currencyCode: "USD",
          dataLossFromOtherRow: false,
          emptyReason: undefined,
          subjectToThresholding: false,
          timeZone: "America/New_York",
        },
      };

      const result = validateSchema(runReportResponseSchema, validResponse);
      expect(result.rows).toHaveLength(1);
      expect(result.rowCount).toBe(1);
    });

    it("should validate response with empty rows", () => {
      const validResponse = {
        dimensionHeaders: [],
        metricHeaders: [{ name: "sessions", type: "TYPE_INTEGER" }],
        rows: [],
        rowCount: 0,
        metadata: {
          currencyCode: "USD",
          dataLossFromOtherRow: false,
          subjectToThresholding: false,
          timeZone: "America/New_York",
        },
      };

      const result = validateSchema(runReportResponseSchema, validResponse);
      expect(result.rows).toHaveLength(0);
      expect(result.rowCount).toBe(0);
    });
  });

  describe("batchRunReportsRequestSchema", () => {
    it("should validate valid batch request", () => {
      const validRequest = {
        property: "properties/123456789",
        requests: [
          {
            dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
            dimensions: [{ name: "country" }],
            metrics: [{ name: "sessions" }],
          },
        ],
      };

      const result = validateSchema(batchRunReportsRequestSchema, validRequest);
      expect(result.requests).toHaveLength(1);
    });

    it("should reject empty requests array", () => {
      const invalidRequest = {
        property: "properties/123456789",
        requests: [],
      };

      expect(() => validateSchema(batchRunReportsRequestSchema, invalidRequest)).toThrow();
    });
  });

  describe("batchRunReportsResponseSchema", () => {
    it("should validate valid batch response", () => {
      const validResponse = {
        reports: [
          {
            dimensionHeaders: [{ name: "country" }],
            metricHeaders: [{ name: "sessions", type: "TYPE_INTEGER" }],
            rows: [],
            rowCount: 0,
            metadata: {
              currencyCode: "USD",
              dataLossFromOtherRow: false,
              subjectToThresholding: false,
              timeZone: "America/New_York",
            },
          },
        ],
      };

      const result = validateSchema(batchRunReportsResponseSchema, validResponse);
      expect(result.reports).toHaveLength(1);
    });
  });

  describe("runPivotReportRequestSchema", () => {
    it("should validate valid pivot report request", () => {
      const validRequest = {
        property: "properties/123456789",
        dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "sessions" }],
        pivots: [
          {
            fieldNames: ["country"],
            limit: 10,
            orderBys: [
              {
                pivotOrderBy: {
                  pivotSelections: [{ dimensionName: "country", dimensionValue: "United States" }],
                  metricName: "sessions",
                },
              },
            ],
          },
        ],
      };

      const result = validateSchema(runPivotReportRequestSchema, validRequest);
      expect(result.pivots).toHaveLength(1);
    });
  });

  describe("runPivotReportResponseSchema", () => {
    it("should validate valid pivot report response", () => {
      const validResponse = {
        pivotHeaders: [
          {
            pivotHeaderEntries: [{ dimensionName: "country", dimensionValue: "United States" }],
          },
        ],
        dimensionHeaders: [{ name: "country" }],
        metricHeaders: [{ name: "sessions", type: "TYPE_INTEGER" }],
        rows: [],
        metadata: {
          currencyCode: "USD",
          dataLossFromOtherRow: false,
          subjectToThresholding: false,
          timeZone: "America/New_York",
        },
      };

      const result = validateSchema(runPivotReportResponseSchema, validResponse);
      expect(result.pivotHeaders).toHaveLength(1);
    });
  });

  describe("runRealtimeReportRequestSchema", () => {
    it("should validate valid realtime report request", () => {
      const validRequest = {
        property: "properties/123456789",
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        limit: 100,
      };

      const result = validateSchema(runRealtimeReportRequestSchema, validRequest);
      expect(result.property).toBe("properties/123456789");
      expect(result.dimensions).toHaveLength(1);
      expect(result.metrics).toHaveLength(1);
    });

    it("should validate request without dimensions and metrics", () => {
      const validRequest = {
        property: "properties/123456789",
      };

      const result = validateSchema(runRealtimeReportRequestSchema, validRequest);
      expect(result.property).toBe("properties/123456789");
    });
  });

  describe("runRealtimeReportResponseSchema", () => {
    it("should validate valid realtime report response", () => {
      const validResponse = {
        dimensionHeaders: [{ name: "country" }],
        metricHeaders: [{ name: "activeUsers", type: "TYPE_INTEGER" }],
        rows: [
          {
            dimensionValues: [{ value: "United States" }],
            metricValues: [{ value: "500" }],
          },
        ],
        rowCount: 1,
        totals: [
          {
            dimensionValues: [],
            metricValues: [{ value: "1000" }],
          },
        ],
        maximums: [
          {
            dimensionValues: [],
            metricValues: [{ value: "500" }],
          },
        ],
        minimums: [
          {
            dimensionValues: [],
            metricValues: [{ value: "100" }],
          },
        ],
      };

      const result = validateSchema(runRealtimeReportResponseSchema, validResponse);
      expect(result.rows).toHaveLength(1);
      expect(result.totals).toHaveLength(1);
    });
  });
});

