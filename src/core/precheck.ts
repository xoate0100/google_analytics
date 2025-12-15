/**
 * Pre-check validation implementation
 * Validates capabilities, existence, conflicts, and idempotency before operations
 */

import type {
  OperationEnvelope,
  Precheck,
  ICapabilitiesRegistry,
} from "./types.js";
import { createPreconditionError } from "./errors.js";

/**
 * Options for pre-check validation
 */
export interface PrecheckOptions {
  envelope: OperationEnvelope;
  capabilitiesRegistry: ICapabilitiesRegistry;
  requiredCapability: string;
  existenceChecker?: () => Promise<boolean>;
  conflictChecker?: () => Promise<string[]>;
  idempotencyChecker?: () => Promise<boolean>;
}

/**
 * Perform pre-check validation
 * Checks capability, existence, conflicts, and idempotency
 * @param options - Pre-check options
 * @returns Precheck result
 * @throws PreconditionError if capability is missing
 */
export async function performPrecheck(
  options: PrecheckOptions
): Promise<Precheck> {
  const { envelope, capabilitiesRegistry, requiredCapability } = options;

  // Check capability
  const product = envelope.target.product;
  const hasCapability = capabilitiesRegistry.hasCapability(
    product,
    requiredCapability
  );

  if (!hasCapability) {
    throw createPreconditionError(
      "precheck_failed",
      `Capability '${requiredCapability}' not available for product '${product}'`,
      {
        product,
        requiredCapability,
        operation: envelope.opName,
      }
    );
  }

  // Check existence (if checker provided)
  let exists = false;
  if (options.existenceChecker) {
    exists = await options.existenceChecker();
  }

  // Check idempotency (if checker provided and not already exists)
  if (options.idempotencyChecker && !exists) {
    const isIdempotent = await options.idempotencyChecker();
    if (isIdempotent) {
      exists = true; // Short-circuit: current state matches request
    }
  }

  // Check conflicts (if checker provided)
  let conflicts: string[] = [];
  if (options.conflictChecker) {
    conflicts = await options.conflictChecker();
  }

  return {
    capability: true,
    exists,
    conflicts,
  };
}
