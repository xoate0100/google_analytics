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
 * Build GA4 property path from envelope
 */
function buildGA4PropertyPath(envelope: OperationEnvelope): string | null {
  if (envelope.target.propertyId) {
    return `properties/${envelope.target.propertyId}`;
  }
  if (envelope.result?.resourceId) {
    return `properties/${envelope.result.resourceId}`;
  }
  return null;
}

/**
 * Execute GA4 property delete rollback
 */
async function executeGA4PropertyDeleteRollback(
  propertyPath: string,
  prevState: { displayName?: string; timeZone?: string },
  accountId: string | undefined,
  adminClient: ReturnType<import("../ga4/client.js").GA4Client["getAnalyticsAdminClient"]>,
  logger: import("./types.js").ILogger,
  opId: string
): Promise<void> {
  if (prevState.displayName && prevState.timeZone && accountId) {
    await adminClient.properties.create({
      requestBody: {
        displayName: prevState.displayName,
        timeZone: prevState.timeZone,
        parent: `accounts/${accountId}`,
      },
    });
    logger.info("GA4 property rollback: recreated property", {
      opId,
      property: propertyPath,
    });
  }
}

/**
 * Execute GA4 property update rollback
 */
async function executeGA4PropertyUpdateRollback(
  propertyPath: string,
  prevState: { displayName?: string; timeZone?: string },
  adminClient: ReturnType<import("../ga4/client.js").GA4Client["getAnalyticsAdminClient"]>,
  logger: import("./types.js").ILogger,
  opId: string
): Promise<void> {
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
      opId,
      property: propertyPath,
    });
  }
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
  const propertyPath = buildGA4PropertyPath(envelope);

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
        const prevState = previousState as { displayName?: string; timeZone?: string };

        if (envelope.opName.includes("delete")) {
          await executeGA4PropertyDeleteRollback(
            propertyPath,
            prevState,
            envelope.target.accountId,
            adminClient,
            logger,
            envelope.opId
          );
        } else if (envelope.opName.includes("upsert") || envelope.opName.includes("update")) {
          await executeGA4PropertyUpdateRollback(propertyPath, prevState, adminClient, logger, envelope.opId);
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
 * Build GA4 data stream path from envelope
 */
function buildGA4DataStreamPath(envelope: OperationEnvelope): { propertyPath: string; dataStreamId: string } | null {
  const propertyPath = envelope.target.propertyId
    ? `properties/${envelope.target.propertyId}`
    : envelope.result?.resourceId
      ? `properties/${envelope.result.resourceId.split("/dataStreams/")[0]}`
      : null;

  const dataStreamId = envelope.result?.resourceId?.split("/dataStreams/")[1] || null;

  if (!propertyPath || !dataStreamId) {
    return null;
  }

  return { propertyPath, dataStreamId };
}

/**
 * Execute GA4 data stream delete rollback
 */
async function executeGA4DataStreamDeleteRollback(
  propertyPath: string,
  dataStreamId: string,
  prevState: { displayName?: string; type?: string },
  adminClient: ReturnType<import("../ga4/client.js").GA4Client["getAnalyticsAdminClient"]>,
  logger: import("./types.js").ILogger,
  opId: string
): Promise<void> {
  if (prevState.displayName && prevState.type) {
    await (adminClient.properties.dataStreams as unknown as { create?: (params: unknown) => Promise<unknown> }).create?.({
      parent: propertyPath,
      requestBody: {
        displayName: prevState.displayName,
        type: prevState.type,
      },
    });
    logger.info("GA4 data stream rollback: recreated data stream", {
      opId,
      dataStream: `${propertyPath}/dataStreams/${dataStreamId}`,
    });
  }
}

/**
 * Execute GA4 data stream update rollback
 */
async function executeGA4DataStreamUpdateRollback(
  propertyPath: string,
  dataStreamId: string,
  prevState: { displayName?: string },
  adminClient: ReturnType<import("../ga4/client.js").GA4Client["getAnalyticsAdminClient"]>,
  logger: import("./types.js").ILogger,
  opId: string
): Promise<void> {
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
      opId,
      dataStream: `${propertyPath}/dataStreams/${dataStreamId}`,
    });
  }
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
  const pathInfo = buildGA4DataStreamPath(envelope);

  if (!pathInfo) {
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
        const prevState = previousState as { displayName?: string; type?: string };

        if (envelope.opName.includes("delete")) {
          await executeGA4DataStreamDeleteRollback(
            pathInfo.propertyPath,
            pathInfo.dataStreamId,
            prevState,
            adminClient,
            logger,
            envelope.opId
          );
        } else if (envelope.opName.includes("upsert") || envelope.opName.includes("update")) {
          await executeGA4DataStreamUpdateRollback(
            pathInfo.propertyPath,
            pathInfo.dataStreamId,
            prevState,
            adminClient,
            logger,
            envelope.opId
          );
        }
      } catch (error) {
        logger.error("GA4 data stream rollback failed", error instanceof Error ? error : new Error(String(error)), {
          opId: envelope.opId,
          dataStream: `${pathInfo.propertyPath}/dataStreams/${pathInfo.dataStreamId}`,
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

/**
 * Build GTM workspace path from envelope
 */
function buildGTMWorkspacePath(envelope: OperationEnvelope): string | null {
  if (envelope.target.containerId && envelope.target.accountId) {
    const workspaceId = (envelope.target as { workspaceId?: string }).workspaceId || "default";
    return `accounts/${envelope.target.accountId}/containers/${envelope.target.containerId}/workspaces/${workspaceId}`;
  }
  return null;
}

/**
 * Build GTM resource data from previous state
 */
function buildGTMResourceData(prevState: { name?: string; type?: string; parameter?: unknown[] }): Record<string, unknown> {
  const data: Record<string, unknown> = {
    name: prevState.name,
    type: prevState.type,
  };
  if (prevState.parameter) {
    data.parameter = prevState.parameter;
  }
  return data;
}

/**
 * Execute GTM tag delete rollback
 */
async function executeGTMTagDeleteRollback(
  workspacePath: string,
  tagId: string,
  prevState: { name?: string; type?: string; parameter?: unknown[] },
  tagManagerClient: ReturnType<import("../gtm/client.js").GTMClient["getTagManagerClient"]>,
  logger: import("./types.js").ILogger,
  opId: string
): Promise<void> {
  if (prevState.name && prevState.type) {
    const tagData = buildGTMResourceData(prevState);
    await tagManagerClient.accounts.containers.workspaces.tags.create({
      parent: workspacePath,
      requestBody: tagData,
    });
    logger.info("GTM tag rollback: recreated tag", {
      opId,
      tag: `${workspacePath}/tags/${tagId}`,
    });
  }
}

/**
 * Execute GTM tag update rollback
 */
async function executeGTMTagUpdateRollback(
  workspacePath: string,
  tagId: string,
  prevState: { name?: string; type?: string; parameter?: unknown[] },
  tagManagerClient: ReturnType<import("../gtm/client.js").GTMClient["getTagManagerClient"]>,
  logger: import("./types.js").ILogger,
  opId: string
): Promise<void> {
  if (prevState.name && prevState.type) {
    const tagData = buildGTMResourceData(prevState);
    await tagManagerClient.accounts.containers.workspaces.tags.update({
      path: `${workspacePath}/tags/${tagId}`,
      requestBody: tagData,
    });
    logger.info("GTM tag rollback: restored previous state", {
      opId,
      tag: `${workspacePath}/tags/${tagId}`,
    });
  }
}

/**
 * Create GTM tag rollback action
 * Reverts tag to previous version if operation fails
 */
export function createGTMTagRollback(
  envelope: OperationEnvelope,
  previousState: unknown,
  gtmClient: import("../gtm/client.js").GTMClient,
  logger: import("./types.js").ILogger
): Rollback {
  const workspacePath = buildGTMWorkspacePath(envelope);
  const tagId = envelope.result?.resourceId || null;

  if (!workspacePath || !tagId) {
    return {
      needed: false,
      action: null,
    };
  }

  return {
    needed: true,
    action: async () => {
      try {
        await gtmClient.checkRateLimit("gtm", "rollback");
        const tagManagerClient = gtmClient.getTagManagerClient();
        const prevState = previousState as { name?: string; type?: string; parameter?: unknown[] };

        if (envelope.opName.includes("delete")) {
          await executeGTMTagDeleteRollback(workspacePath, tagId, prevState, tagManagerClient, logger, envelope.opId);
        } else if (envelope.opName.includes("upsert") || envelope.opName.includes("update")) {
          await executeGTMTagUpdateRollback(workspacePath, tagId, prevState, tagManagerClient, logger, envelope.opId);
        }
      } catch (error) {
        logger.error("GTM tag rollback failed", error instanceof Error ? error : new Error(String(error)), {
          opId: envelope.opId,
          tag: `${workspacePath}/tags/${tagId}`,
        });
        throw error;
      }
    },
    compensation: previousState,
  };
}

/**
 * Execute GTM trigger delete rollback
 */
async function executeGTMTriggerDeleteRollback(
  workspacePath: string,
  triggerId: string,
  prevState: { name?: string; type?: string; parameter?: unknown[] },
  tagManagerClient: ReturnType<import("../gtm/client.js").GTMClient["getTagManagerClient"]>,
  logger: import("./types.js").ILogger,
  opId: string
): Promise<void> {
  if (prevState.name && prevState.type) {
    const triggerData = buildGTMResourceData(prevState);
    await tagManagerClient.accounts.containers.workspaces.triggers.create({
      parent: workspacePath,
      requestBody: triggerData,
    });
    logger.info("GTM trigger rollback: recreated trigger", {
      opId,
      trigger: `${workspacePath}/triggers/${triggerId}`,
    });
  }
}

/**
 * Execute GTM trigger update rollback
 */
async function executeGTMTriggerUpdateRollback(
  workspacePath: string,
  triggerId: string,
  prevState: { name?: string; type?: string; parameter?: unknown[] },
  tagManagerClient: ReturnType<import("../gtm/client.js").GTMClient["getTagManagerClient"]>,
  logger: import("./types.js").ILogger,
  opId: string
): Promise<void> {
  if (prevState.name && prevState.type) {
    const triggerData = buildGTMResourceData(prevState);
    await tagManagerClient.accounts.containers.workspaces.triggers.update({
      path: `${workspacePath}/triggers/${triggerId}`,
      requestBody: triggerData,
    });
    logger.info("GTM trigger rollback: restored previous state", {
      opId,
      trigger: `${workspacePath}/triggers/${triggerId}`,
    });
  }
}

/**
 * Create GTM trigger rollback action
 * Reverts trigger to previous version if operation fails
 */
export function createGTMTriggerRollback(
  envelope: OperationEnvelope,
  previousState: unknown,
  gtmClient: import("../gtm/client.js").GTMClient,
  logger: import("./types.js").ILogger
): Rollback {
  const workspacePath = buildGTMWorkspacePath(envelope);
  const triggerId = envelope.result?.resourceId || null;

  if (!workspacePath || !triggerId) {
    return {
      needed: false,
      action: null,
    };
  }

  return {
    needed: true,
    action: async () => {
      try {
        await gtmClient.checkRateLimit("gtm", "rollback");
        const tagManagerClient = gtmClient.getTagManagerClient();
        const prevState = previousState as { name?: string; type?: string; parameter?: unknown[] };

        if (envelope.opName.includes("delete")) {
          await executeGTMTriggerDeleteRollback(workspacePath, triggerId, prevState, tagManagerClient, logger, envelope.opId);
        } else if (envelope.opName.includes("upsert") || envelope.opName.includes("update")) {
          await executeGTMTriggerUpdateRollback(workspacePath, triggerId, prevState, tagManagerClient, logger, envelope.opId);
        }
      } catch (error) {
        logger.error("GTM trigger rollback failed", error instanceof Error ? error : new Error(String(error)), {
          opId: envelope.opId,
          trigger: `${workspacePath}/triggers/${triggerId}`,
        });
        throw error;
      }
    },
    compensation: previousState,
  };
}

/**
 * Execute GTM variable delete rollback
 */
async function executeGTMVariableDeleteRollback(
  workspacePath: string,
  variableId: string,
  prevState: { name?: string; type?: string; parameter?: unknown[] },
  tagManagerClient: ReturnType<import("../gtm/client.js").GTMClient["getTagManagerClient"]>,
  logger: import("./types.js").ILogger,
  opId: string
): Promise<void> {
  if (prevState.name && prevState.type) {
    const variableData = buildGTMResourceData(prevState);
    await tagManagerClient.accounts.containers.workspaces.variables.create({
      parent: workspacePath,
      requestBody: variableData,
    });
    logger.info("GTM variable rollback: recreated variable", {
      opId,
      variable: `${workspacePath}/variables/${variableId}`,
    });
  }
}

/**
 * Execute GTM variable update rollback
 */
async function executeGTMVariableUpdateRollback(
  workspacePath: string,
  variableId: string,
  prevState: { name?: string; type?: string; parameter?: unknown[] },
  tagManagerClient: ReturnType<import("../gtm/client.js").GTMClient["getTagManagerClient"]>,
  logger: import("./types.js").ILogger,
  opId: string
): Promise<void> {
  if (prevState.name && prevState.type) {
    const variableData = buildGTMResourceData(prevState);
    await tagManagerClient.accounts.containers.workspaces.variables.update({
      path: `${workspacePath}/variables/${variableId}`,
      requestBody: variableData,
    });
    logger.info("GTM variable rollback: restored previous state", {
      opId,
      variable: `${workspacePath}/variables/${variableId}`,
    });
  }
}

/**
 * Create GTM variable rollback action
 * Reverts variable to previous version if operation fails
 */
export function createGTMVariableRollback(
  envelope: OperationEnvelope,
  previousState: unknown,
  gtmClient: import("../gtm/client.js").GTMClient,
  logger: import("./types.js").ILogger
): Rollback {
  const workspacePath = buildGTMWorkspacePath(envelope);
  const variableId = envelope.result?.resourceId || null;

  if (!workspacePath || !variableId) {
    return {
      needed: false,
      action: null,
    };
  }

  return {
    needed: true,
    action: async () => {
      try {
        await gtmClient.checkRateLimit("gtm", "rollback");
        const tagManagerClient = gtmClient.getTagManagerClient();
        const prevState = previousState as { name?: string; type?: string; parameter?: unknown[] };

        if (envelope.opName.includes("delete")) {
          await executeGTMVariableDeleteRollback(workspacePath, variableId, prevState, tagManagerClient, logger, envelope.opId);
        } else if (envelope.opName.includes("upsert") || envelope.opName.includes("update")) {
          await executeGTMVariableUpdateRollback(workspacePath, variableId, prevState, tagManagerClient, logger, envelope.opId);
        }
      } catch (error) {
        logger.error("GTM variable rollback failed", error instanceof Error ? error : new Error(String(error)), {
          opId: envelope.opId,
          variable: `${workspacePath}/variables/${variableId}`,
        });
        throw error;
      }
    },
    compensation: previousState,
  };
}
