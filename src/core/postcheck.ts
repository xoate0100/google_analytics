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

/**
 * Create GA4 property rollback action
 * Restores property to previous state if operation fails
 */
export function createGA4PropertyRollback(
  envelope: OperationEnvelope,
  previousState: unknown,
  ga4Client: import("../ga4/client.js").GA4Client,
  logger: import("./types.js").ILogger
): Rollback {
  const propertyPath = envelope.target.propertyId
    ? `properties/${envelope.target.propertyId}`
    : envelope.result?.resourceId
      ? `properties/${envelope.result.resourceId}`
      : null;

  if (!propertyPath) {
    return {
      needed: false,
      action: null,
    };
  }

  return {
    needed: true,
    action: async () => {
      try {
        await ga4Client.checkRateLimit("ga4", "rollback");
        const adminClient = ga4Client.getAnalyticsAdminClient();

        const prevState = previousState as { name?: string; displayName?: string; timeZone?: string };

        // Determine rollback type based on operation
        if (envelope.opName.includes("delete")) {
          // Rollback delete: recreate property
          if (prevState.displayName && prevState.timeZone && envelope.target.accountId) {
            await adminClient.properties.create({
              requestBody: {
                displayName: prevState.displayName,
                timeZone: prevState.timeZone,
                parent: `accounts/${envelope.target.accountId}`,
              },
            });
            logger.info("GA4 property rollback: recreated property", {
              opId: envelope.opId,
              property: propertyPath,
            });
          }
        } else if (envelope.opName.includes("upsert") || envelope.opName.includes("update")) {
          // Rollback update: restore previous state
          const updateMask: string[] = [];
          if (prevState.displayName) updateMask.push("display_name");
          if (prevState.timeZone) updateMask.push("time_zone");

          if (updateMask.length > 0 && prevState.displayName && prevState.timeZone) {
            await adminClient.properties.patch({
              name: propertyPath,
              updateMask: updateMask.join(","),
              requestBody: {
                displayName: prevState.displayName,
                timeZone: prevState.timeZone,
              },
            });
            logger.info("GA4 property rollback: restored previous state", {
              opId: envelope.opId,
              property: propertyPath,
            });
          }
        }
      } catch (error) {
        logger.error("GA4 property rollback failed", error instanceof Error ? error : new Error(String(error)), {
          opId: envelope.opId,
          property: propertyPath,
        });
        throw error;
      }
    },
    compensation: previousState,
  };
}

/**
 * Create GA4 data stream rollback action
 * Restores data stream to previous state if operation fails
 */
export function createGA4DataStreamRollback(
  envelope: OperationEnvelope,
  previousState: unknown,
  ga4Client: import("../ga4/client.js").GA4Client,
  logger: import("./types.js").ILogger
): Rollback {
  const propertyPath = envelope.target.propertyId
    ? `properties/${envelope.target.propertyId}`
    : envelope.result?.resourceId
      ? `properties/${envelope.result.resourceId.split("/dataStreams/")[0]}`
      : null;

  const dataStreamId = envelope.result?.resourceId?.split("/dataStreams/")[1] || null;

  if (!propertyPath || !dataStreamId) {
    return {
      needed: false,
      action: null,
    };
  }

  return {
    needed: true,
    action: async () => {
      try {
        await ga4Client.checkRateLimit("ga4", "rollback");
        const adminClient = ga4Client.getAnalyticsAdminClient();

        const prevState = previousState as { name?: string; displayName?: string; type?: string };

        // Determine rollback type based on operation
        if (envelope.opName.includes("delete")) {
          // Rollback delete: recreate data stream
          if (prevState.displayName && prevState.type) {
            await (adminClient.properties.dataStreams as unknown as { create?: (params: unknown) => Promise<unknown> }).create?.({
              parent: propertyPath,
              requestBody: {
                displayName: prevState.displayName,
                type: prevState.type,
              },
            });
            logger.info("GA4 data stream rollback: recreated data stream", {
              opId: envelope.opId,
              dataStream: `${propertyPath}/dataStreams/${dataStreamId}`,
            });
          }
        } else if (envelope.opName.includes("upsert") || envelope.opName.includes("update")) {
          // Rollback update: restore previous state
          const updateMask: string[] = [];
          if (prevState.displayName) updateMask.push("display_name");

          if (updateMask.length > 0) {
            await (adminClient.properties.dataStreams as unknown as { patch?: (params: unknown) => Promise<unknown> }).patch?.({
              name: `${propertyPath}/dataStreams/${dataStreamId}`,
              updateMask: updateMask.join(","),
              requestBody: {
                displayName: prevState.displayName,
              },
            });
            logger.info("GA4 data stream rollback: restored previous state", {
              opId: envelope.opId,
              dataStream: `${propertyPath}/dataStreams/${dataStreamId}`,
            });
          }
        }
      } catch (error) {
        logger.error("GA4 data stream rollback failed", error instanceof Error ? error : new Error(String(error)), {
          opId: envelope.opId,
          dataStream: `${propertyPath}/dataStreams/${dataStreamId}`,
        });
        throw error;
      }
    },
    compensation: previousState,
  };
}

/**
 * Create GA4 conversion rollback action
 * Restores conversion to previous state if operation fails
 */
export function createGA4ConversionRollback(
  envelope: OperationEnvelope,
  previousState: unknown,
  ga4Client: import("../ga4/client.js").GA4Client,
  logger: import("./types.js").ILogger
): Rollback {
  const propertyPath = envelope.target.propertyId
    ? `properties/${envelope.target.propertyId}`
    : envelope.result?.resourceId
      ? `properties/${envelope.result.resourceId.split("/conversions/")[0]}`
      : null;

  const conversionId = envelope.result?.resourceId?.split("/conversions/")[1] || null;

  if (!propertyPath) {
    return {
      needed: false,
      action: null,
    };
  }

  return {
    needed: true,
    action: async () => {
      try {
        await ga4Client.checkRateLimit("ga4", "rollback");
        const adminClient = ga4Client.getAnalyticsAdminClient();

        const prevState = previousState as { name?: string; eventName?: string; countingMethod?: string };

        // Determine rollback type based on operation
        if (envelope.opName.includes("delete")) {
          // Rollback delete: recreate conversion
          if (prevState.eventName && prevState.countingMethod) {
            const conversions = (adminClient.properties as unknown as { eventCreateRules?: { create?: (params: unknown) => Promise<unknown> } }).eventCreateRules;
            if (conversions?.create) {
              await conversions.create({
                parent: propertyPath,
                requestBody: {
                  eventName: prevState.eventName,
                  countingMethod: prevState.countingMethod,
                },
              });
              logger.info("GA4 conversion rollback: recreated conversion", {
                opId: envelope.opId,
                conversion: conversionId ? `${propertyPath}/conversions/${conversionId}` : propertyPath,
              });
            }
          }
        } else if (envelope.opName.includes("upsert") || envelope.opName.includes("update")) {
          // Rollback update: restore previous state
          if (conversionId && prevState.countingMethod) {
            const updateMask: string[] = [];
            if (prevState.countingMethod) updateMask.push("counting_method");

            if (updateMask.length > 0) {
              const conversions = (adminClient.properties as unknown as { eventCreateRules?: { patch?: (params: unknown) => Promise<unknown> } }).eventCreateRules;
              if (conversions?.patch) {
                await conversions.patch({
                  name: `${propertyPath}/conversions/${conversionId}`,
                  updateMask: updateMask.join(","),
                  requestBody: {
                    countingMethod: prevState.countingMethod,
                  },
                });
                logger.info("GA4 conversion rollback: restored previous state", {
                  opId: envelope.opId,
                  conversion: `${propertyPath}/conversions/${conversionId}`,
                });
              }
            }
          }
        }
      } catch (error) {
        logger.error("GA4 conversion rollback failed", error instanceof Error ? error : new Error(String(error)), {
          opId: envelope.opId,
          conversion: conversionId ? `${propertyPath}/conversions/${conversionId}` : propertyPath,
        });
        throw error;
      }
    },
    compensation: previousState,
  };
}

