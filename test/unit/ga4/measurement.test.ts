import { describe, it, expect, vi, beforeEach } from "vitest";
import { MeasurementProtocolClient } from "../../../src/ga4/measurement.js";
import type { ILogger, IRateLimiter } from "../../../src/core/types.js";

describe("MeasurementProtocolClient", () => {
  let mockLogger: ILogger;
  let mockRateLimiter: IRateLimiter;
  let client: MeasurementProtocolClient;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    };

    mockRateLimiter = {
      checkLimit: vi.fn().mockResolvedValue({ allowed: true, tokensRemaining: 10 }),
      waitForToken: vi.fn().mockResolvedValue(undefined),
      getState: vi.fn().mockResolvedValue(undefined),
      reset: vi.fn(),
    };

    client = new MeasurementProtocolClient({
      logger: mockLogger,
      rateLimiter: mockRateLimiter,
      measurementId: "G-XXXXXXXXXX",
      apiSecret: "test-secret",
    });
  });

  describe("constructor", () => {
    it("should initialize with required options", () => {
      expect(client).toBeDefined();
    });

    it("should throw error if logger is missing", () => {
      expect(() => {
        new MeasurementProtocolClient({
          logger: undefined as unknown as ILogger,
          rateLimiter: mockRateLimiter,
          measurementId: "G-XXXXXXXXXX",
          apiSecret: "test-secret",
        });
      }).toThrow("Logger is required");
    });

    it("should throw error if rate limiter is missing", () => {
      expect(() => {
        new MeasurementProtocolClient({
          logger: mockLogger,
          rateLimiter: undefined as unknown as IRateLimiter,
          measurementId: "G-XXXXXXXXXX",
          apiSecret: "test-secret",
        });
      }).toThrow("Rate limiter is required");
    });

    it("should throw error if measurement ID is missing", () => {
      expect(() => {
        new MeasurementProtocolClient({
          logger: mockLogger,
          rateLimiter: mockRateLimiter,
          measurementId: "",
          apiSecret: "test-secret",
        });
      }).toThrow("Measurement ID is required");
    });

    it("should throw error if API secret is missing", () => {
      expect(() => {
        new MeasurementProtocolClient({
          logger: mockLogger,
          rateLimiter: mockRateLimiter,
          measurementId: "G-XXXXXXXXXX",
          apiSecret: "",
        });
      }).toThrow("API secret is required");
    });
  });

  describe("sendEvent", () => {
    it("should check rate limit before sending", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        text: async () => "",
      });

      await client.sendEvent({
        client_id: "test-client-id",
        events: [{ name: "test_event" }],
      });

      expect(mockRateLimiter.checkLimit).toHaveBeenCalledWith("ga4", "measurement.send");
    });

    it("should send event to correct endpoint", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        text: async () => "",
      });

      await client.sendEvent({
        client_id: "test-client-id",
        events: [{ name: "test_event" }],
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("www.google-analytics.com/mp/collect"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should include measurement ID and API secret in URL", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        text: async () => "",
      });

      await client.sendEvent({
        client_id: "test-client-id",
        events: [{ name: "test_event" }],
      });

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      expect(fetchCall).toBeDefined();
      const url = fetchCall?.[0] as string;
      expect(url).toContain("measurement_id=G-XXXXXXXXXX");
      expect(url).toContain("api_secret=test-secret");
    });

    it("should throw error on non-2xx response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: async () => "Invalid request",
      });

      await expect(
        client.sendEvent({
          client_id: "test-client-id",
          events: [{ name: "test_event" }],
        })
      ).rejects.toThrow();
    });
  });

  describe("validateEvent", () => {
    it("should check rate limit before validating", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ validationMessages: [] }),
      });

      await client.validateEvent({
        client_id: "test-client-id",
        events: [{ name: "test_event" }],
      });

      expect(mockRateLimiter.checkLimit).toHaveBeenCalledWith("ga4", "measurement.validate");
    });

    it("should send validation request to debug endpoint", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ validationMessages: [] }),
      });

      await client.validateEvent({
        client_id: "test-client-id",
        events: [{ name: "test_event" }],
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("www.google-analytics.com/debug/mp/collect"),
        expect.any(Object)
      );
    });

    it("should return validation result with messages", async () => {
      const validationMessages = [
        { fieldPath: "events[0].name", description: "Event name is valid" },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ validationMessages }),
      });

      const result = await client.validateEvent({
        client_id: "test-client-id",
        events: [{ name: "test_event" }],
      });

      expect(result.validationMessages).toEqual(validationMessages);
    });
  });
});
