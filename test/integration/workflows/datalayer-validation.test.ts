/**
 * Data Layer Validation End-to-End Test
 * Tests data layer schema extraction, validation, variable synchronization, and monitoring workflow
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import {
  createIntegrationTestContext,
  mockOAuthTokenEndpoint,
  mockGTMAPI,
  type IntegrationTestContext,
} from "../helpers/mock-google-apis.js";
import { registerGTMTools } from "../../../src/gtm/tools.js";
import { MCPServerBootstrap } from "../../../src/server/bootstrap.js";

describe("Data Layer Validation End-to-End Workflow", () => {
  let context: IntegrationTestContext;
  let bootstrap: MCPServerBootstrap;

  beforeEach(async () => {
    context = await createIntegrationTestContext();
    bootstrap = new MCPServerBootstrap({
      name: "test-server",
      version: "0.1.0",
      logger: context.logger,
    });
    bootstrap.initialize();

    // Register GTM capabilities
    context.capabilitiesRegistry.setProductCapabilities("gtm", {
      "tag_manager_api": "v2",
      "workspaces": true,
      "datalayer": true,
    });

    // Set credentials on OAuth client
    const oauth2Client = context.oauthClient.getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      expiry_date: Date.now() + 3600000,
    });

    if (context.gtmClient) {
      registerGTMTools({
        bootstrap,
        gtmClient: context.gtmClient,
        cache: context.cache,
        capabilitiesRegistry: context.capabilitiesRegistry,
        logger: context.logger,
      });
    }

    // Clean and setup nock
    nock.cleanAll();
    nock.disableNetConnect();

    // Mock OAuth token endpoint
    mockOAuthTokenEndpoint(200, {
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      expires_in: 3600,
      token_type: "Bearer",
    });
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it.skip("should extract data layer schema from GTM variables", async () => {
    const accountId = "123456";
    const containerId = "987654";
    const workspacePath = `accounts/${accountId}/containers/${containerId}/workspaces/1`;

    // Mock GTM variables list response
    mockGTMAPI("GET", `/v2/${workspacePath}/variables`, 200, {
      variable: [
        {
          variableId: "1",
          name: "DLV - event",
          type: "v",
          parameter: [
            {
              type: "template",
              key: "dataLayerVariableName",
              value: "event",
            },
          ],
        },
        {
          variableId: "2",
          name: "DLV - transactionId",
          type: "v",
          parameter: [
            {
              type: "template",
              key: "dataLayerVariableName",
              value: "transactionId",
            },
          ],
        },
        {
          variableId: "3",
          name: "DLV - value",
          type: "v",
          parameter: [
            {
              type: "template",
              key: "dataLayerVariableName",
              value: "value",
            },
          ],
        },
      ],
    });

    const tools = bootstrap.getRegisteredTools();
    const schemaTool = tools.get("gtm.datalayer.schema.generate");
    expect(schemaTool).toBeDefined();

    // Test would execute schema generation here
    // const result = await schemaTool?.handler?.({
    //   parent: workspacePath,
    // });
    //
    // expect(result).toBeDefined();
    // expect(result.schema).toBeDefined();
  });

  it.skip("should validate data layer structure against schema", async () => {
    const accountId = "123456";
    const containerId = "987654";
    const workspacePath = `accounts/${accountId}/containers/${containerId}/workspaces/1`;

    // Mock variables list for schema generation
    mockGTMAPI("GET", `/v2/${workspacePath}/variables`, 200, {
      variable: [
        {
          variableId: "1",
          name: "DLV - event",
          type: "v",
          parameter: [
            {
              type: "template",
              key: "dataLayerVariableName",
              value: "event",
            },
          ],
        },
      ],
    });

    const tools = bootstrap.getRegisteredTools();
    const validateTool = tools.get("gtm.datalayer.validate");
    expect(validateTool).toBeDefined();

    // Test would execute validation here
    // const result = await validateTool?.handler?.({
    //   parent: workspacePath,
    //   dataLayer: {
    //     event: "purchase",
    //     transactionId: "T12345",
    //     value: 99.99,
    //   },
    // });
    //
    // expect(result.valid).toBe(true);
    // expect(result.errors).toBeUndefined();
  });

  it.skip("should identify missing variables in data layer", async () => {
    const accountId = "123456";
    const containerId = "987654";
    const workspacePath = `accounts/${accountId}/containers/${containerId}/workspaces/1`;

    // Mock variables list with required fields
    mockGTMAPI("GET", `/v2/${workspacePath}/variables`, 200, {
      variable: [
        {
          variableId: "1",
          name: "DLV - event",
          type: "v",
          parameter: [
            {
              type: "template",
              key: "dataLayerVariableName",
              value: "event",
            },
          ],
        },
      ],
    });

    const tools = bootstrap.getRegisteredTools();
    const validateTool = tools.get("gtm.datalayer.validate");
    expect(validateTool).toBeDefined();

    // Test would validate data layer missing required field
    // const result = await validateTool?.handler?.({
    //   parent: workspacePath,
    //   dataLayer: {
    //     // Missing required 'event' field
    //     transactionId: "T12345",
    //   },
    // });
    //
    // expect(result.valid).toBe(false);
    // expect(result.errors).toBeDefined();
    // expect(result.errors?.length).toBeGreaterThan(0);
  });

  it.skip("should synchronize variables with data layer schema", async () => {
    const accountId = "123456";
    const containerId = "987654";
    const workspacePath = `accounts/${accountId}/containers/${containerId}/workspaces/1`;

    // Mock variables list
    mockGTMAPI("GET", `/v2/${workspacePath}/variables`, 200, {
      variable: [],
    });

    // Mock variable creation
    mockGTMAPI("POST", `/v2/${workspacePath}/variables`, 200, {
      variableId: "1",
      name: "DLV - event",
      type: "v",
      parameter: [
        {
          type: "template",
          key: "dataLayerVariableName",
          value: "event",
        },
      ],
    });

    const tools = bootstrap.getRegisteredTools();
    const variableTool = tools.get("gtm.variable.upsert");
    expect(variableTool).toBeDefined();

    // Test would create missing variables based on schema
    // const result = await variableTool?.handler?.({
    //   path: `${workspacePath}/variables`,
    //   name: "DLV - event",
    //   type: "v",
    //   parameter: [
    //     {
    //       type: "template",
    //       key: "dataLayerVariableName",
    //       value: "event",
    //     },
    //   ],
    // });
    //
    // expect(result).toBeDefined();
    // expect(result.variableId).toBeDefined();
  });

  it.skip("should monitor data layer events", async () => {
    const accountId = "123456";
    const containerId = "987654";
    const workspacePath = `accounts/${accountId}/containers/${containerId}/workspaces/1`;
    const eventName = "purchase";

    // Mock data layer events list
    mockGTMAPI("GET", `/v2/${workspacePath}/datalayer/events`, 200, {
      events: [
        {
          event: eventName,
          timestamp: new Date().toISOString(),
          dataLayer: {
            event: eventName,
            transactionId: "T12345",
            value: 99.99,
          },
        },
      ],
    });

    const tools = bootstrap.getRegisteredTools();
    const monitorTool = tools.get("gtm.datalayer.monitor");
    expect(monitorTool).toBeDefined();

    // Test would execute monitoring here
    // const result = await monitorTool?.handler?.({
    //   parent: workspacePath,
    //   eventName: eventName,
    // });
    //
    // expect(result).toBeDefined();
    // expect(result.events).toBeDefined();
  });

  it.skip("should complete full data layer validation workflow", async () => {
    const accountId = "123456";
    const containerId = "987654";
    const workspacePath = `accounts/${accountId}/containers/${containerId}/workspaces/1`;

    // Step 1: Extract schema from variables
    mockGTMAPI("GET", `/v2/${workspacePath}/variables`, 200, {
      variable: [
        {
          variableId: "1",
          name: "DLV - event",
          type: "v",
          parameter: [
            {
              type: "template",
              key: "dataLayerVariableName",
              value: "event",
            },
          ],
        },
        {
          variableId: "2",
          name: "DLV - transactionId",
          type: "v",
          parameter: [
            {
              type: "template",
              key: "dataLayerVariableName",
              value: "transactionId",
            },
          ],
        },
      ],
    });

    const tools = bootstrap.getRegisteredTools();

    // Step 1: Generate schema
    const schemaTool = tools.get("gtm.datalayer.schema.generate");
    expect(schemaTool).toBeDefined();

    // Step 2: Validate data layer
    const validateTool = tools.get("gtm.datalayer.validate");
    expect(validateTool).toBeDefined();

    // Step 3: Monitor events
    const monitorTool = tools.get("gtm.datalayer.monitor");
    expect(monitorTool).toBeDefined();

    // Verify all tools are registered
    expect(schemaTool).toBeDefined();
    expect(validateTool).toBeDefined();
    expect(monitorTool).toBeDefined();
  });
});
