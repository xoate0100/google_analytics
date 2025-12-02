import { describe, it, expect } from "vitest";
import {
  dataFilterListRequestSchema,
  dataFilterListResponseSchema,
  dataFilterGetRequestSchema,
  dataFilterGetResponseSchema,
  dataFilterCreateRequestSchema,
  dataFilterUpdateRequestSchema,
  dataFilterDeleteRequestSchema,
} from "../../../src/ga4/schemas.js";

describe("GA4 Data Filter Schemas", () => {
  describe("dataFilterListRequestSchema", () => {
    it("should validate valid property ID", () => {
      const valid = {
        property: "properties/123456789",
      };
      expect(() => dataFilterListRequestSchema.parse(valid)).not.toThrow();
    });

    it("should reject invalid property ID format", () => {
      const invalid = {
        property: "invalid",
      };
      expect(() => dataFilterListRequestSchema.parse(invalid)).toThrow();
    });
  });

  describe("dataFilterGetRequestSchema", () => {
    it("should validate valid property ID and filter ID", () => {
      const valid = {
        property: "properties/123456789",
        filterId: "dataFilters/987654321",
      };
      expect(() => dataFilterGetRequestSchema.parse(valid)).not.toThrow();
    });

    it("should reject invalid filter ID format", () => {
      const invalid = {
        property: "properties/123456789",
        filterId: "invalid",
      };
      expect(() => dataFilterGetRequestSchema.parse(invalid)).toThrow();
    });
  });

  describe("dataFilterCreateRequestSchema", () => {
    it("should validate valid create request with INTERNAL_TRAFFIC type", () => {
      const valid = {
        property: "properties/123456789",
        name: "Internal Traffic Filter",
        type: "INTERNAL_TRAFFIC",
        filterExpression: {
          filter: {
            fieldName: "ip_address",
            stringFilter: {
              matchType: "EXACT",
              value: "192.168.1.1",
            },
          },
        },
        applyTo: "ALL_EVENTS",
      };
      expect(() => dataFilterCreateRequestSchema.parse(valid)).not.toThrow();
    });

    it("should validate valid create request with BOT_FILTER type", () => {
      const valid = {
        property: "properties/123456789",
        name: "Bot Filter",
        type: "BOT_FILTER",
        applyTo: "ALL_EVENTS",
      };
      expect(() => dataFilterCreateRequestSchema.parse(valid)).not.toThrow();
    });

    it("should reject invalid filter type", () => {
      const invalid = {
        property: "properties/123456789",
        name: "Test Filter",
        type: "INVALID_TYPE",
        applyTo: "ALL_EVENTS",
      };
      expect(() => dataFilterCreateRequestSchema.parse(invalid)).toThrow();
    });

    it("should require name", () => {
      const invalid = {
        property: "properties/123456789",
        type: "INTERNAL_TRAFFIC",
        applyTo: "ALL_EVENTS",
      };
      expect(() => dataFilterCreateRequestSchema.parse(invalid)).toThrow();
    });
  });

  describe("dataFilterUpdateRequestSchema", () => {
    it("should validate valid update request", () => {
      const valid = {
        property: "properties/123456789",
        filterId: "dataFilters/987654321",
        name: "Updated Filter Name",
        state: "ACTIVE",
      };
      expect(() => dataFilterUpdateRequestSchema.parse(valid)).not.toThrow();
    });

    it("should allow partial updates", () => {
      const valid = {
        property: "properties/123456789",
        filterId: "dataFilters/987654321",
        name: "Updated Filter Name",
      };
      expect(() => dataFilterUpdateRequestSchema.parse(valid)).not.toThrow();
    });
  });

  describe("dataFilterDeleteRequestSchema", () => {
    it("should validate valid delete request", () => {
      const valid = {
        property: "properties/123456789",
        filterId: "dataFilters/987654321",
      };
      expect(() => dataFilterDeleteRequestSchema.parse(valid)).not.toThrow();
    });
  });

  describe("dataFilterGetResponseSchema", () => {
    it("should validate valid response", () => {
      const valid = {
        name: "properties/123456789/dataFilters/987654321",
        filterId: "987654321",
        displayName: "Internal Traffic Filter",
        type: "INTERNAL_TRAFFIC",
        state: "ACTIVE",
        filterExpression: {
          filter: {
            fieldName: "ip_address",
            stringFilter: {
              matchType: "EXACT",
              value: "192.168.1.1",
            },
          },
        },
        applyTo: "ALL_EVENTS",
        createTime: "2024-01-01T00:00:00Z",
        updateTime: "2024-01-01T00:00:00Z",
      };
      expect(() => dataFilterGetResponseSchema.parse(valid)).not.toThrow();
    });
  });

  describe("dataFilterListResponseSchema", () => {
    it("should validate valid list response", () => {
      const valid = {
        dataFilters: [
          {
            name: "properties/123456789/dataFilters/987654321",
            filterId: "987654321",
            displayName: "Internal Traffic Filter",
            type: "INTERNAL_TRAFFIC",
            state: "ACTIVE",
          },
        ],
        nextPageToken: "token123",
      };
      expect(() => dataFilterListResponseSchema.parse(valid)).not.toThrow();
    });

    it("should validate empty list", () => {
      const valid = {
        dataFilters: [],
      };
      expect(() => dataFilterListResponseSchema.parse(valid)).not.toThrow();
    });
  });
});

