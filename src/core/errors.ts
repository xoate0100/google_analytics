/**
 * Typed error model for MCP Google Marketing server
 * All errors follow discriminated union pattern with remediation hints
 */

export type ErrorType =
  | "AuthError"
  | "QuotaError"
  | "PreconditionError"
  | "ValidationError"
  | "TransportError"
  | "ServerError";

export type AuthErrorReason = "invalid_grant" | "insufficient_scope";
export type QuotaErrorReason = "rate_limited" | "resource_exhausted";
export type PreconditionErrorReason = "conflict" | "not_found" | "precheck_failed";
export type ValidationErrorReason = "schema_mismatch";
export type TransportErrorReason = "network" | "tls";
export type ServerErrorReason = "5xx";

/**
 * Base MCP error class
 * All specific error types extend this class
 */
export class MCPError extends Error {
  public readonly type: ErrorType;
  public readonly reason: string;
  public readonly remediation: string;
  public readonly context: Record<string, unknown> | undefined;

  constructor(
    message: string,
    type: ErrorType,
    reason: string,
    remediation?: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "MCPError";
    this.type = type;
    this.reason = reason;
    this.remediation = remediation || this.getDefaultRemediation(type, reason);
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }

  private getDefaultRemediation(type: ErrorType, reason: string): string {
    const remediationMap: Record<string, string> = {
      AuthError_invalid_grant: "Run auth.login() to refresh tokens",
      AuthError_insufficient_scope: "Check scope requirements for the operation",
      QuotaError_rate_limited: "Reduce QPS or wait per Retry-After header",
      QuotaError_resource_exhausted: "Wait for quota reset or check quota limits",
      PreconditionError_conflict: "Resolve resource conflicts before retrying",
      PreconditionError_not_found: "Check resource existence before operation",
      PreconditionError_precheck_failed: "Verify preconditions are met",
      ValidationError_schema_mismatch: "Check request format and required fields. Review schema documentation.",
      TransportError_network: "Check network connectivity and retry",
      TransportError_tls: "Verify SSL certificates and configuration",
      ServerError_5xx: "retry with exponential backoff or check service status",
    };
    return remediationMap[`${type}_${reason}`] || "Review error details and retry";
  }
}

/**
 * Authentication error
 * Occurs when OAuth token is invalid or missing required scopes
 */
export class AuthError extends MCPError {
  constructor(reason: AuthErrorReason, message: string, context?: Record<string, unknown>) {
    super(message, "AuthError", reason, undefined, context);
    this.name = "AuthError";
  }
}

/**
 * Quota error
 * Occurs when rate limits or resource quotas are exceeded
 */
export class QuotaError extends MCPError {
  public readonly httpStatus: number | undefined;
  public readonly retryAfter: number | undefined;

  constructor(
    reason: QuotaErrorReason,
    message: string,
    httpStatus?: number,
    retryAfter?: number,
    context?: Record<string, unknown>
  ) {
    super(message, "QuotaError", reason, undefined, context);
    this.name = "QuotaError";
    this.httpStatus = httpStatus;
    this.retryAfter = retryAfter;
  }
}

/**
 * Precondition error
 * Occurs when pre-conditions for an operation are not met
 */
export class PreconditionError extends MCPError {
  constructor(
    reason: PreconditionErrorReason,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message, "PreconditionError", reason, undefined, context);
    this.name = "PreconditionError";
  }
}

/**
 * Validation error
 * Occurs when request validation fails
 */
export class ValidationError extends MCPError {
  public readonly validationDetails?: unknown;

  constructor(
    reason: ValidationErrorReason,
    message: string,
    validationDetails?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, "ValidationError", reason, undefined, context);
    this.name = "ValidationError";
    this.validationDetails = validationDetails;
  }
}

/**
 * Transport error
 * Occurs when network or TLS errors happen
 */
export class TransportError extends MCPError {
  constructor(
    reason: TransportErrorReason,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message, "TransportError", reason, undefined, context);
    this.name = "TransportError";
  }
}

/**
 * Server error
 * Occurs when server returns 5xx status codes
 */
export class ServerError extends MCPError {
  public readonly httpStatus: number;

  constructor(
    httpStatus: number,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message, "ServerError", "5xx", undefined, context);
    this.name = "ServerError";
    this.httpStatus = httpStatus;
  }
}

/**
 * Discriminated union of all error types
 */
export type MCPErrorType =
  | AuthError
  | QuotaError
  | PreconditionError
  | ValidationError
  | TransportError
  | ServerError;

/**
 * Factory functions for creating typed errors
 */
export function createAuthError(
  reason: AuthErrorReason,
  message: string,
  context?: Record<string, unknown>
): AuthError {
  return new AuthError(reason, message, context);
}

export function createQuotaError(
  reason: QuotaErrorReason,
  message: string,
  httpStatus?: number,
  retryAfter?: number,
  context?: Record<string, unknown>
): QuotaError {
  return new QuotaError(reason, message, httpStatus, retryAfter, context);
}

export function createPreconditionError(
  reason: PreconditionErrorReason,
  message: string,
  context?: Record<string, unknown>
): PreconditionError {
  return new PreconditionError(reason, message, context);
}

export function createValidationError(
  reason: ValidationErrorReason,
  message: string,
  validationDetails?: unknown,
  context?: Record<string, unknown>
): ValidationError {
  return new ValidationError(reason, message, validationDetails, context);
}

export function createTransportError(
  reason: TransportErrorReason,
  message: string,
  context?: Record<string, unknown>
): TransportError {
  return new TransportError(reason, message, context);
}

export function createServerError(
  httpStatus: number,
  message: string,
  context?: Record<string, unknown>
): ServerError {
  return new ServerError(httpStatus, message, context);
}

/**
 * Type guard to check if error is an MCPError
 */
export function isMCPError(error: unknown): error is MCPError {
  return error instanceof MCPError;
}

/**
 * Get error type from any error
 */
export function getErrorType(error: unknown): ErrorType | "unknown" {
  if (isMCPError(error)) {
    return error.type;
  }
  return "unknown";
}
