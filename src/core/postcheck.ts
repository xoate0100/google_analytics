/**
 * Post-check validation and rollback implementation
 * Verifies operation results with read-back and state matching
 */

import type {
  OperationEnvelope,
  Postcheck,
  Rollback,
} from "./types.js";

/**
 * State matcher result
 */
export interface StateMatchResult {
  match: boolean;
  discrepancies?: string[];
}

/**
 * State matcher function type
 * Can return boolean or detailed result
 */
export type StateMatcher = (
  expected: unknown,
  actual: unknown
) => Promise<boolean | StateMatchResult>;

/**
 * Options for post-check validation
 */
export interface PostcheckOptions {
  envelope: OperationEnvelope;
  readBackChecker: () => Promise<unknown>;
  stateMatcher: StateMatcher;
  expectedState: unknown;
}

/**
 * Perform post-check validation
 * Reads back authoritative state and verifies it matches expected
 * @param options - Post-check options
 * @returns Postcheck result
 */
export async function performPostcheck(
  options: PostcheckOptions
): Promise<Postcheck> {
  const { readBackChecker, stateMatcher, expectedState } = options;

  let readBack = false;
  let stateMatch = false;
  let discrepancies: string[] | undefined;

  try {
    // Perform read-back
    const actualState = await readBackChecker();
    readBack = true;

    // Match state
    const matchResult = await stateMatcher(expectedState, actualState);

    if (typeof matchResult === "boolean") {
      stateMatch = matchResult;
    } else {
      stateMatch = matchResult.match;
      discrepancies = matchResult.discrepancies;
    }
  } catch {
    // Read-back failed
    readBack = false;
    stateMatch = false;
  }

  const result: Postcheck = {
    readBack,
    stateMatch,
  };
  if (discrepancies !== undefined) {
    result.discrepancies = discrepancies;
  }
  return result;
}

/**
 * Execute rollback action if needed
 * @param rollback - Rollback information
 */
export async function executeRollback(rollback: Rollback): Promise<void> {
  if (!rollback.needed || !rollback.action) {
    return Promise.resolve();
  }

  await rollback.action();
}

