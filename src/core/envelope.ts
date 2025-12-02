/**
 * Operation envelope implementation
 * Provides structure for wrapping all operations with metadata
 */

import { createHash, randomBytes } from "crypto";
import type {
  OperationEnvelope,
  OperationTarget,
  Precheck,
  Attempt,
  OperationResultStatus,
  Postcheck,
  Rollback,
} from "./types.js";

/**
 * Generate UUID v7-like operation ID
 * Uses timestamp + random bytes for uniqueness
 * @returns UUID v7 format string
 */
export function generateOpId(): string {
  const timestamp = Date.now();
  const random = randomBytes(10);
  const randomHex = random.toString("hex");

  // Format as UUID v7: timestamp (48 bits) + version (4 bits) + random (62 bits)
  const timeHex = timestamp.toString(16).padStart(12, "0");
  const version = "7";
  const variant = (8 + Math.floor(Math.random() * 4)).toString(16); // 8, 9, a, or b

  return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-${version}${randomHex.slice(0, 3)}-${variant}${randomHex.slice(3, 6)}-${randomHex.slice(6, 18)}`;
}

/**
 * Compute idempotency key from request and target
 * Creates a deterministic hash for idempotency checking
 * @param request - Operation request data
 * @param target - Operation target information
 * @returns Idempotency key string
 */
export function computeIdempotencyKey(
  request: { args: Record<string, unknown> },
  target: OperationTarget
): string {
  // Normalize and stringify for consistent hashing
  const normalized = JSON.stringify({
    request: request.args,
    target: {
      product: target.product,
      accountId: target.accountId,
      propertyId: target.propertyId,
      containerId: target.containerId,
    },
  });

  // Create SHA-256 hash
  const hash = createHash("sha256").update(normalized).digest("hex");
  return hash.substring(0, 32); // Use first 32 chars for readability
}

/**
 * Options for creating an operation envelope
 */
export interface CreateEnvelopeOptions {
  opName: string;
  actor: string;
  target: OperationTarget;
  request: { args: Record<string, unknown> };
  opId?: string;
  idempotencyKey?: string;
}

/**
 * Create default precheck
 */
function createDefaultPrecheck(): Precheck {
  return {
    capability: false,
    exists: false,
    conflicts: [],
  };
}

/**
 * Create default attempt
 */
function createDefaultAttempt(): Attempt {
  return {
    n: 1,
    retryPolicy: "exp-jitter",
    rateLimitState: {
      tokens: 0,
    },
  };
}

/**
 * Create default result
 */
function createDefaultResult(): OperationResultStatus {
  return {
    status: "success",
  };
}

/**
 * Create default postcheck
 */
function createDefaultPostcheck(): Postcheck {
  return {
    readBack: false,
    stateMatch: false,
  };
}

/**
 * Create default rollback
 */
function createDefaultRollback(): Rollback {
  return {
    needed: false,
    action: null,
  };
}

/**
 * Create a new operation envelope with default values
 * @param options - Envelope creation options
 * @returns Complete operation envelope
 */
export function createOperationEnvelope(
  options: CreateEnvelopeOptions
): OperationEnvelope {
  const opId = options.opId || generateOpId();
  const idempotencyKey =
    options.idempotencyKey ||
    computeIdempotencyKey(options.request, options.target);
  const timestamp = new Date().toISOString();

  return {
    opId,
    opName: options.opName,
    idempotencyKey,
    timestamp,
    actor: options.actor,
    target: options.target,
    request: options.request,
    precheck: createDefaultPrecheck(),
    attempt: createDefaultAttempt(),
    result: createDefaultResult(),
    postcheck: createDefaultPostcheck(),
    rollback: createDefaultRollback(),
    latencyMs: 0,
    warnings: [],
    notes: "",
  };
}

/**
 * Builder class for operation envelopes
 * Allows incremental construction of envelope data
 */
export class OperationEnvelopeBuilder {
  private envelope: OperationEnvelope;

  constructor(options: CreateEnvelopeOptions) {
    this.envelope = createOperationEnvelope(options);
  }

  setPrecheck(precheck: Precheck): this {
    this.envelope.precheck = precheck;
    return this;
  }

  setAttempt(attempt: Attempt): this {
    this.envelope.attempt = attempt;
    return this;
  }

  setResult(result: OperationResultStatus): this {
    this.envelope.result = result;
    return this;
  }

  setPostcheck(postcheck: Postcheck): this {
    this.envelope.postcheck = postcheck;
    return this;
  }

  setRollback(rollback: Rollback): this {
    this.envelope.rollback = rollback;
    return this;
  }

  setLatencyMs(latencyMs: number): this {
    this.envelope.latencyMs = latencyMs;
    return this;
  }

  addWarning(warning: string): this {
    this.envelope.warnings.push(warning);
    return this;
  }

  setNotes(notes: string): this {
    this.envelope.notes = notes;
    return this;
  }

  build(): OperationEnvelope {
    return { ...this.envelope };
  }
}

