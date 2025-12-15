/**
 * GTM rollback and conflict test matrix
 * Tests workspace merge conflicts, rollback on publish failure, version restore scenarios, and concurrent modification handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import nock from "nock";
import {
  createIntegrationTestContext,
  mockOAuthTokenEndpoint,
  mockGTMAPI,
  GTM_API_BASE,
  type IntegrationTestContext,
} from "../helpers/mock-google-apis.js";
import { registerGTMTools } from "../../../src/gtm/tools.js";
import { MCPServerBootstrap } from "../../../src/server/bootstrap.js";

describe("GTM Rollback and Conflict Test Matrix", () => {
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
      "versions": true,
      "publish": true,
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

    // Clean and setup nock AFTER everything is initialized
    nock.cleanAll();
    nock.disableNetConnect();

    // Mock OAuth token endpoint for refresh scenarios
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

  describe("Workspace merge conflicts", () => {
    it.skip("should handle workspace merge conflicts gracefully", async () => {
      const accountId = "123456";
      const containerId = "987654";
      const workspacePath = `accounts/${accountId}/containers/${containerId}/workspaces/1`;
      const sourceWorkspacePath = `accounts/${accountId}/containers/${containerId}/workspaces/2`;

      // Mock conflict error
      mockGTMAPI("POST", `/v2/${workspacePath}:merge`, 409, {
        error: {
          code: 409,
          message: "Workspace has been modified by another user",
          status: "CONFLICT",
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.ErrorInfo",
              reason: "CONFLICT",
              domain: "tagmanager.googleapis.com",
              metadata: {
                conflictType: "WORKSPACE_MODIFIED",
              },
            },
          ],
        },
      });

      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("gtm.workspace.merge");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      await expect(
        handler?.({
          path: workspacePath,
          sourceWorkspacePath: sourceWorkspacePath,
        })
      ).rejects.toThrow();
    });

    it.skip("should retry merge after conflict resolution", async () => {
      const accountId = "123456";
      const containerId = "987654";
      const workspacePath = `accounts/${accountId}/containers/${containerId}/workspaces/1`;
      const sourceWorkspacePath = `accounts/${accountId}/containers/${containerId}/workspaces/2`;
      let attemptCount = 0;

      // Mock conflict then success
      nock(GTM_API_BASE)
        .post(`/v2/${workspacePath}:merge`)
        .reply(() => {
          attemptCount++;
          if (attemptCount === 1) {
            return [
              409,
              {
                error: {
                  code: 409,
                  message: "Workspace has been modified",
                  status: "CONFLICT",
                },
              },
            ];
          }
          return [
            200,
            {
              name: workspacePath,
              workspaceId: "1",
              accountId: accountId,
              containerId: containerId,
            },
          ];
        });

      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("gtm.workspace.merge");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      // Use fake timers for retry
      vi.useFakeTimers();

      const requestPromise = handler?.({
        path: workspacePath,
        sourceWorkspacePath: sourceWorkspacePath,
      });

      // Advance time to allow retry
      await vi.advanceTimersByTimeAsync(2000);

      const result = await requestPromise;
      expect(result).toBeDefined();
      expect(attemptCount).toBeGreaterThan(1);

      vi.useRealTimers();
    });
  });

  describe("Rollback on publish failure", () => {
    it.skip("should rollback on publish failure", async () => {
      const accountId = "123456";
      const containerId = "987654";
      const workspacePath = `accounts/${accountId}/containers/${containerId}/workspaces/1`;

      // Mock publish failure
      mockGTMAPI("POST", `/v2/${workspacePath}:publish`, 400, {
        error: {
          code: 400,
          message: "Invalid workspace state",
          status: "INVALID_ARGUMENT",
        },
      });

      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("gtm.workspace.publish");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      await expect(
        handler?.({
          path: workspacePath,
        })
      ).rejects.toThrow();
    });

    it.skip("should restore workspace state after failed publish", async () => {
      const accountId = "123456";
      const containerId = "987654";
      const workspacePath = `accounts/${accountId}/containers/${containerId}/workspaces/1`;
      const versionId = "10";

      // Mock publish failure
      mockGTMAPI("POST", `/v2/${workspacePath}:publish`, 400, {
        error: {
          code: 400,
          message: "Invalid workspace state",
          status: "INVALID_ARGUMENT",
        },
      });

      // Mock version restore (rollback)
      mockGTMAPI("POST", `/v2/accounts/${accountId}/containers/${containerId}/versions/${versionId}:restore`, 200, {
        containerVersionId: versionId,
        name: `accounts/${accountId}/containers/${containerId}/versions/${versionId}`,
      });

      const tools = bootstrap.getRegisteredTools();
      const publishTool = tools.get("gtm.workspace.publish");
      const restoreTool = tools.get("gtm.version.restore");

      expect(publishTool).toBeDefined();
      expect(restoreTool).toBeDefined();

      // Attempt publish (should fail)
      await expect(
        publishTool?.handler?.({
          path: workspacePath,
        })
      ).rejects.toThrow();

      // Restore previous version (rollback)
      const restoreResult = await restoreTool?.handler?.({
        path: `accounts/${accountId}/containers/${containerId}/versions/${versionId}`,
      });

      expect(restoreResult).toBeDefined();
    });
  });

  describe("Version restore scenarios", () => {
    it.skip("should restore version successfully", async () => {
      const accountId = "123456";
      const containerId = "987654";
      const versionId = "10";
      const versionPath = `accounts/${accountId}/containers/${containerId}/versions/${versionId}`;

      mockGTMAPI("POST", `/v2/${versionPath}:restore`, 200, {
        containerVersionId: versionId,
        name: versionPath,
        accountId: accountId,
        containerId: containerId,
      });

      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("gtm.version.restore");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      const result = await handler?.({
        path: versionPath,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("containerVersionId", versionId);
    });

    it.skip("should handle version not found error", async () => {
      const accountId = "123456";
      const containerId = "987654";
      const versionId = "999";
      const versionPath = `accounts/${accountId}/containers/${containerId}/versions/${versionId}`;

      mockGTMAPI("POST", `/v2/${versionPath}:restore`, 404, {
        error: {
          code: 404,
          message: "Version not found",
          status: "NOT_FOUND",
        },
      });

      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("gtm.version.restore");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      await expect(
        handler?.({
          path: versionPath,
        })
      ).rejects.toThrow();
    });
  });

  describe("Concurrent modification handling", () => {
    it.skip("should detect concurrent modifications", async () => {
      const accountId = "123456";
      const containerId = "987654";
      const workspacePath = `accounts/${accountId}/containers/${containerId}/workspaces/1`;

      // Mock fingerprint mismatch (concurrent modification)
      mockGTMAPI("POST", `/v2/${workspacePath}:publish`, 412, {
        error: {
          code: 412,
          message: "Fingerprint mismatch",
          status: "FAILED_PRECONDITION",
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.ErrorInfo",
              reason: "FINGERPRINT_MISMATCH",
              domain: "tagmanager.googleapis.com",
            },
          ],
        },
      });

      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("gtm.workspace.publish");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      await expect(
        handler?.({
          path: workspacePath,
        })
      ).rejects.toThrow();
    });

    it.skip("should handle concurrent tag modifications", async () => {
      const accountId = "123456";
      const containerId = "987654";
      const workspacePath = `accounts/${accountId}/containers/${containerId}/workspaces/1`;
      const tagPath = `${workspacePath}/tags/123`;

      // Mock tag update with fingerprint mismatch
      mockGTMAPI("PATCH", `/v2/${tagPath}`, 412, {
        error: {
          code: 412,
          message: "Tag has been modified by another user",
          status: "FAILED_PRECONDITION",
        },
      });

      const tools = bootstrap.getRegisteredTools();
      const tool = tools.get("gtm.tag.upsert");
      expect(tool).toBeDefined();
      const handler = tool?.handler;
      expect(handler).toBeDefined();

      await expect(
        handler?.({
          path: tagPath,
          name: "Test Tag",
          type: "html",
        })
      ).rejects.toThrow();
    });
  });
});
