/**
 * Ad Group Response Transformers
 * Extracted transformation logic to follow SRP (Single Responsibility Principle)
 */

import type { z } from "zod";
import type {
  adGroupListResponseSchema,
  adGroupGetResponseSchema,
  adGroupUpsertResponseSchema,
} from "../schemas.js";

/**
 * Extract campaign ID from resource name
 */
function extractCampaignIdFromResourceName(resourceName?: string): string | undefined {
  if (!resourceName) return undefined;
  return resourceName.split("/").pop();
}

/**
 * Transform ad group list response
 */
export function transformAdGroupListResponse(
  response: {
    results?: Array<{
      adGroup?: {
        id?: string;
        name?: string;
        status?: string;
        type?: string;
        campaign?: string;
      };
    }>;
  }
): z.infer<typeof adGroupListResponseSchema> {
  const adGroups = (response.results || []).map((r) => {
    const campaignId = extractCampaignIdFromResourceName(r.adGroup?.campaign);
    return {
      adGroupId: r.adGroup?.id,
      name: r.adGroup?.name,
      status: r.adGroup?.status as "ENABLED" | "PAUSED" | "REMOVED" | undefined,
      type: r.adGroup?.type,
      campaignId,
    };
  });

  return { adGroups };
}

/**
 * Extract ad group data from API response
 */
function extractAdGroupData(
  adGroup: {
    id?: string;
    resourceName?: string;
    name?: string;
    status?: string;
    type?: string;
    campaign?: string;
    targeting?: Record<string, unknown>;
    [key: string]: unknown;
  }
): z.infer<typeof adGroupGetResponseSchema> {
  const campaignId = extractCampaignIdFromResourceName(adGroup.campaign);

  return {
    adGroupId: adGroup.id,
    name: adGroup.name,
    status: adGroup.status as "ENABLED" | "PAUSED" | "REMOVED" | undefined,
    type: adGroup.type,
    campaignId,
    targeting: adGroup.targeting,
  };
}

/**
 * Transform single ad group get response
 */
export function transformAdGroupGetResponse(
  response: {
    results?: Array<{
      adGroup?: {
        id?: string;
        resourceName?: string;
        name?: string;
        status?: string;
        type?: string;
        campaign?: string;
        targeting?: Record<string, unknown>;
        [key: string]: unknown;
      };
    }>;
  }
): z.infer<typeof adGroupGetResponseSchema> {
  const adGroup = response.results?.[0]?.adGroup;
  if (!adGroup) {
    return {
      adGroupId: undefined,
      name: undefined,
      status: undefined,
      type: undefined,
      campaignId: undefined,
      targeting: undefined,
    };
  }

  return extractAdGroupData(adGroup);
}

/**
 * Extract resource ID from resource name
 */
function extractResourceId(resourceName?: string): string | undefined {
  if (!resourceName) return undefined;
  const parts = resourceName.split("/");
  return parts[parts.length - 1];
}

/**
 * Transform ad group upsert response
 */
export function transformAdGroupUpsertResponse(
  response: {
    results?: Array<{
      adGroup?: {
        resourceName?: string;
        id?: string;
        name?: string;
        status?: string;
        type?: string;
        campaign?: string;
        targeting?: Record<string, unknown>;
        [key: string]: unknown;
      };
    }>;
  },
  validatedRequest?: {
    campaignId?: string | undefined;
    type?: string | undefined;
    targeting?: Record<string, unknown> | undefined;
  }
): z.infer<typeof adGroupUpsertResponseSchema> {
  const result = response.results?.[0]?.adGroup;
  if (!result) {
    throw new Error("Ad group upsert failed: No ad group in response");
  }

  const adGroupId = result.id || extractResourceId(result.resourceName);
  const data = extractAdGroupData(result);

  return {
    adGroupId: adGroupId || data.adGroupId,
    name: data.name,
    status: data.status,
    type: validatedRequest?.type ?? data.type,
    campaignId: validatedRequest?.campaignId ?? data.campaignId,
    targeting: validatedRequest?.targeting ?? data.targeting,
  };
}
