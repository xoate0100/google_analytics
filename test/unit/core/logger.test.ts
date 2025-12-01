import { describe, it, expect, beforeEach } from "vitest";
import { PinoLogger } from "../../../src/core/logger.js";
import type { ILogger } from "../../../src/core/types.js";

describe("PinoLogger", () => {
  let logger: ILogger;
  let logOutput: string[];

  beforeEach((): void => {
    logOutput = [];
    logger = new PinoLogger({
      level: "debug",
      // Capture logs for testing
      write: (chunk: string): void => {
        logOutput.push(chunk.toString());
      },
    });
  });

  describe("Logger initialization", () => {
    it("should create a logger instance", () => {
      expect(logger).toBeDefined();
      expect(logger).toHaveProperty("debug");
      expect(logger).toHaveProperty("info");
      expect(logger).toHaveProperty("warn");
      expect(logger).toHaveProperty("error");
      expect(logger).toHaveProperty("child");
    });

    it("should implement ILogger interface", () => {
      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.child).toBe("function");
    });
  });

  describe("Log levels", () => {
    it("should log debug messages", () => {
      logger.debug("Debug message", { key: "value" });
      expect(logOutput.length).toBeGreaterThan(0);
      const logEntry = JSON.parse(logOutput[logOutput.length - 1] || "{}");
      expect(logEntry.level).toBe(20); // pino debug level
      expect(logEntry.msg).toBe("Debug message");
    });

    it("should log info messages", () => {
      logger.info("Info message", { key: "value" });
      expect(logOutput.length).toBeGreaterThan(0);
      const logEntry = JSON.parse(logOutput[logOutput.length - 1] || "{}");
      expect(logEntry.level).toBe(30); // pino info level
      expect(logEntry.msg).toBe("Info message");
    });

    it("should log warn messages", () => {
      logger.warn("Warning message", { key: "value" });
      expect(logOutput.length).toBeGreaterThan(0);
      const logEntry = JSON.parse(logOutput[logOutput.length - 1] || "{}");
      expect(logEntry.level).toBe(40); // pino warn level
      expect(logEntry.msg).toBe("Warning message");
    });

    it("should log error messages", () => {
      const testError = new Error("Test error");
      logger.error("Error message", testError, { key: "value" });
      expect(logOutput.length).toBeGreaterThan(0);
      const logEntry = JSON.parse(logOutput[logOutput.length - 1] || "{}");
      expect(logEntry.level).toBe(50); // pino error level
      expect(logEntry.msg).toBe("Error message");
      expect(logEntry.err).toBeDefined();
    });

    it("should log error messages without error object", () => {
      logger.error("Error message", undefined, { key: "value" });
      expect(logOutput.length).toBeGreaterThan(0);
      const logEntry = JSON.parse(logOutput[logOutput.length - 1] || "{}");
      expect(logEntry.level).toBe(50);
      expect(logEntry.msg).toBe("Error message");
    });
  });

  describe("Structured JSON output", () => {
    it("should output JSON format", () => {
      logger.info("Test message", { testKey: "testValue" });
      expect(logOutput.length).toBeGreaterThan(0);
      const logLine = logOutput[logOutput.length - 1];
      expect(() => JSON.parse(logLine || "{}")).not.toThrow();
    });

    it("should include context in log output", () => {
      const context = { userId: "123", action: "test" };
      logger.info("Test message", context);
      const logEntry = JSON.parse(logOutput[logOutput.length - 1] || "{}");
      expect(logEntry.userId).toBe("123");
      expect(logEntry.action).toBe("test");
    });

    it("should include timestamp", () => {
      logger.info("Test message");
      const logEntry = JSON.parse(logOutput[logOutput.length - 1] || "{}");
      expect(logEntry.time).toBeDefined();
      expect(typeof logEntry.time).toBe("number");
    });
  });

  describe("Correlation IDs", () => {
    it("should include op_id in logs when provided", () => {
      logger.info("Test message", { op_id: "test-op-id" });
      const logEntry = JSON.parse(logOutput[logOutput.length - 1] || "{}");
      expect(logEntry.op_id).toBe("test-op-id");
    });

    it("should include idempotency_key in logs when provided", () => {
      logger.info("Test message", { idempotency_key: "test-key" });
      const logEntry = JSON.parse(logOutput[logOutput.length - 1] || "{}");
      expect(logEntry.idempotency_key).toBe("test-key");
    });

    it("should include trace_id in logs when provided", () => {
      logger.info("Test message", { trace_id: "test-trace-id" });
      const logEntry = JSON.parse(logOutput[logOutput.length - 1] || "{}");
      expect(logEntry.trace_id).toBe("test-trace-id");
    });

    it("should include all correlation IDs together", () => {
      logger.info("Test message", {
        op_id: "op-123",
        idempotency_key: "key-456",
        trace_id: "trace-789",
      });
      const logEntry = JSON.parse(logOutput[logOutput.length - 1] || "{}");
      expect(logEntry.op_id).toBe("op-123");
      expect(logEntry.idempotency_key).toBe("key-456");
      expect(logEntry.trace_id).toBe("trace-789");
    });
  });

  describe("Child context support", () => {
    it("should create child logger with context", () => {
      const childLogger = logger.child({ op_id: "child-op-id" });
      expect(childLogger).toBeDefined();
      expect(childLogger).toHaveProperty("debug");
      expect(childLogger).toHaveProperty("info");
    });

    it("should propagate child context to logs", () => {
      const childLogger = logger.child({ op_id: "child-op-id" });
      childLogger.info("Child message");
      const logEntry = JSON.parse(logOutput[logOutput.length - 1] || "{}");
      expect(logEntry.op_id).toBe("child-op-id");
      expect(logEntry.msg).toBe("Child message");
    });

    it("should merge child context with log context", () => {
      const childLogger = logger.child({ op_id: "child-op-id" });
      childLogger.info("Child message", { additional: "value" });
      const logEntry = JSON.parse(logOutput[logOutput.length - 1] || "{}");
      expect(logEntry.op_id).toBe("child-op-id");
      expect(logEntry.additional).toBe("value");
    });

    it("should allow nested child loggers", () => {
      const child1 = logger.child({ level1: "value1" });
      const child2 = child1.child({ level2: "value2" });
      child2.info("Nested message");
      const logEntry = JSON.parse(logOutput[logOutput.length - 1] || "{}");
      expect(logEntry.level1).toBe("value1");
      expect(logEntry.level2).toBe("value2");
    });
  });
});

