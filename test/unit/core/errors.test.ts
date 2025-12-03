import { describe, it, expect } from "vitest";
import {
  MCPError,
  AuthError,
  QuotaError,
  PreconditionError,
  ValidationError,
  TransportError,
  ServerError,
  createAuthError,
  createQuotaError,
  createPreconditionError,
  createValidationError,
  createTransportError,
  createServerError,
  isMCPError,
  getErrorType,
} from "../../../src/core/errors.js";

describe("MCPError", () => {
  describe("Base MCPError class", () => {
    it("should create a base MCPError", () => {
      const error = new MCPError("Test error", "AuthError", "invalid_grant");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(MCPError);
      expect(error.message).toBe("Test error");
      expect(error.type).toBe("AuthError");
      expect(error.reason).toBe("invalid_grant");
      expect(error.remediation).toBeDefined();
    });

    it("should have a name property", () => {
      const error = new MCPError("Test", "AuthError", "invalid_grant");
      expect(error.name).toBe("MCPError");
    });

    it("should be identifiable with isMCPError", () => {
      const error = new MCPError("Test", "AuthError", "invalid_grant");
      expect(isMCPError(error)).toBe(true);
      expect(isMCPError(new Error("Not MCP"))).toBe(false);
    });

    it("should return error type with getErrorType", () => {
      const error = new MCPError("Test", "AuthError", "invalid_grant");
      expect(getErrorType(error)).toBe("AuthError");
      expect(getErrorType(new Error("Not MCP"))).toBe("unknown");
    });
  });

  describe("AuthError", () => {
    it("should create AuthError with invalid_grant reason", () => {
      const error = createAuthError("invalid_grant", "Token expired");
      expect(error).toBeInstanceOf(AuthError);
      expect(error.type).toBe("AuthError");
      expect(error.reason).toBe("invalid_grant");
      expect(error.message).toBe("Token expired");
      expect(error.remediation).toContain("auth.login");
    });

    it("should create AuthError with insufficient_scope reason", () => {
      const error = createAuthError("insufficient_scope", "Missing permissions");
      expect(error).toBeInstanceOf(AuthError);
      expect(error.type).toBe("AuthError");
      expect(error.reason).toBe("insufficient_scope");
      expect(error.message).toBe("Missing permissions");
      expect(error.remediation).toContain("scope");
    });

    it("should be identifiable with isMCPError", () => {
      const error = createAuthError("invalid_grant", "Test");
      expect(isMCPError(error)).toBe(true);
      expect(getErrorType(error)).toBe("AuthError");
    });
  });

  describe("QuotaError", () => {
    it("should create QuotaError with rate_limited reason", () => {
      const error = createQuotaError("rate_limited", "Too many requests", 429);
      expect(error).toBeInstanceOf(QuotaError);
      expect(error.type).toBe("QuotaError");
      expect(error.reason).toBe("rate_limited");
      expect(error.message).toBe("Too many requests");
      expect(error.httpStatus).toBe(429);
      expect(error.remediation).toContain("Retry-After");
    });

    it("should create QuotaError with resource_exhausted reason", () => {
      const error = createQuotaError("resource_exhausted", "Quota exceeded");
      expect(error).toBeInstanceOf(QuotaError);
      expect(error.type).toBe("QuotaError");
      expect(error.reason).toBe("resource_exhausted");
      expect(error.message).toBe("Quota exceeded");
      expect(error.remediation).toContain("quota");
    });

    it("should be identifiable with isMCPError", () => {
      const error = createQuotaError("rate_limited", "Test");
      expect(isMCPError(error)).toBe(true);
      expect(getErrorType(error)).toBe("QuotaError");
    });
  });

  describe("PreconditionError", () => {
    it("should create PreconditionError with conflict reason", () => {
      const error = createPreconditionError("conflict", "Resource conflict");
      expect(error).toBeInstanceOf(PreconditionError);
      expect(error.type).toBe("PreconditionError");
      expect(error.reason).toBe("conflict");
      expect(error.message).toBe("Resource conflict");
      expect(error.remediation).toContain("conflict");
    });

    it("should create PreconditionError with not_found reason", () => {
      const error = createPreconditionError("not_found", "Resource not found");
      expect(error).toBeInstanceOf(PreconditionError);
      expect(error.type).toBe("PreconditionError");
      expect(error.reason).toBe("not_found");
      expect(error.message).toBe("Resource not found");
      expect(error.remediation).toContain("existence");
    });

    it("should create PreconditionError with precheck_failed reason", () => {
      const error = createPreconditionError("precheck_failed", "Pre-validation failed");
      expect(error).toBeInstanceOf(PreconditionError);
      expect(error.type).toBe("PreconditionError");
      expect(error.reason).toBe("precheck_failed");
      expect(error.message).toBe("Pre-validation failed");
      expect(error.remediation).toContain("precondition");
    });

    it("should be identifiable with isMCPError", () => {
      const error = createPreconditionError("conflict", "Test");
      expect(isMCPError(error)).toBe(true);
      expect(getErrorType(error)).toBe("PreconditionError");
    });
  });

  describe("ValidationError", () => {
    it("should create ValidationError with schema_mismatch reason", () => {
      const error = createValidationError("schema_mismatch", "Request doesn't match schema");
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.type).toBe("ValidationError");
      expect(error.reason).toBe("schema_mismatch");
      expect(error.message).toBe("Request doesn't match schema");
      expect(error.remediation).toContain("schema");
    });

    it("should be identifiable with isMCPError", () => {
      const error = createValidationError("schema_mismatch", "Test");
      expect(isMCPError(error)).toBe(true);
      expect(getErrorType(error)).toBe("ValidationError");
    });
  });

  describe("TransportError", () => {
    it("should create TransportError with network reason", () => {
      const error = createTransportError("network", "Network error");
      expect(error).toBeInstanceOf(TransportError);
      expect(error.type).toBe("TransportError");
      expect(error.reason).toBe("network");
      expect(error.message).toBe("Network error");
      expect(error.remediation).toContain("network");
    });

    it("should create TransportError with tls reason", () => {
      const error = createTransportError("tls", "TLS/SSL error");
      expect(error).toBeInstanceOf(TransportError);
      expect(error.type).toBe("TransportError");
      expect(error.reason).toBe("tls");
      expect(error.message).toBe("TLS/SSL error");
      expect(error.remediation).toContain("SSL");
    });

    it("should be identifiable with isMCPError", () => {
      const error = createTransportError("network", "Test");
      expect(isMCPError(error)).toBe(true);
      expect(getErrorType(error)).toBe("TransportError");
    });
  });

  describe("ServerError", () => {
    it("should create ServerError with 5xx status", () => {
      const error = createServerError(500, "Internal server error");
      expect(error).toBeInstanceOf(ServerError);
      expect(error.type).toBe("ServerError");
      expect(error.reason).toBe("5xx");
      expect(error.message).toBe("Internal server error");
      expect(error.httpStatus).toBe(500);
      expect(error.remediation).toContain("retry");
    });

    it("should create ServerError with 503 status", () => {
      const error = createServerError(503, "Service unavailable");
      expect(error).toBeInstanceOf(ServerError);
      expect(error.type).toBe("ServerError");
      expect(error.reason).toBe("5xx");
      expect(error.httpStatus).toBe(503);
      expect(error.remediation).toContain("backoff");
    });

    it("should be identifiable with isMCPError", () => {
      const error = createServerError(500, "Test");
      expect(isMCPError(error)).toBe(true);
      expect(getErrorType(error)).toBe("ServerError");
    });
  });

  describe("Error discrimination", () => {
    it("should discriminate between error types", () => {
      const authError = createAuthError("invalid_grant", "Test");
      const quotaError = createQuotaError("rate_limited", "Test");
      const validationError = createValidationError("schema_mismatch", "Test");

      expect(authError.type).toBe("AuthError");
      expect(quotaError.type).toBe("QuotaError");
      expect(validationError.type).toBe("ValidationError");
    });

    it("should provide appropriate remediation hints", () => {
      const authError = createAuthError("invalid_grant", "Token expired");
      const quotaError = createQuotaError("rate_limited", "Too many requests");
      const validationError = createValidationError("schema_mismatch", "Invalid request");

      expect(authError.remediation).toContain("auth.login");
      expect(quotaError.remediation).toContain("Retry-After");
      expect(validationError.remediation).toContain("schema");
    });
  });
});
