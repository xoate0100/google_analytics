/**
 * Campaign Response Transformers
 * Extracted transformation logic to follow SRP (Single Responsibility Principle)
 */

import type { z } from "zod";
import type {
  campaignListResponseSchema,
  campaignGetResponseSchema,
  campaignUpsertResponseSchema,
  campaignPauseResponseSchema,
} from "../schemas.js";

/**
 * Transform campaign list response
 */
export function transformCampaignListResponse(
  response: {
    results?: Array<{
      campaign?: {
        id?: string;
        name?: string;
        status?: string;
        advertisingChannelType?: string;
      };
    }>;
  }
): z.infer<typeof campaignListResponseSchema> {
  const campaigns = (response.results || []).map((r) => ({
    campaignId: r.campaign?.id,
    name: r.campaign?.name,
    status: r.campaign?.status as "ENABLED" | "PAUSED" | "REMOVED" | undefined,
    advertisingChannelType: r.campaign?.advertisingChannelType,
  }));

  return { campaigns };
}

/**
 * Extract core campaign fields
 */
function extractCoreCampaignFields(campaign: {
  id?: string;
  resourceName?: string;
  name?: string;
  status?: string;
  advertisingChannelType?: string;
  campaignBudget?: string;
  budget?: string;
  biddingStrategy?: string;
  startDate?: string;
  endDate?: string;
}): {
  campaignId?: string;
  resourceName?: string;
  name?: string;
  status?: string;
  advertisingChannelType?: string;
  budget?: string;
  biddingStrategy?: string;
  startDate?: string;
  endDate?: string;
} {
  return {
    ...(campaign.id !== undefined && { campaignId: campaign.id }),
    ...(campaign.resourceName !== undefined && { resourceName: campaign.resourceName }),
    ...(campaign.name !== undefined && { name: campaign.name }),
    ...(campaign.status !== undefined && { status: campaign.status }),
    ...(campaign.advertisingChannelType !== undefined && { advertisingChannelType: campaign.advertisingChannelType }),
    ...((campaign.campaignBudget || campaign.budget) !== undefined && { budget: campaign.campaignBudget || campaign.budget }),
    ...(campaign.biddingStrategy !== undefined && { biddingStrategy: campaign.biddingStrategy }),
    ...(campaign.startDate !== undefined && { startDate: campaign.startDate }),
    ...(campaign.endDate !== undefined && { endDate: campaign.endDate }),
  };
}

/**
 * Extract additional campaign fields not in core set
 */
function extractAdditionalCampaignFields(
  campaign: { [key: string]: unknown },
  coreFields: string[]
): Record<string, unknown> {
  const additional: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(campaign)) {
    if (!coreFields.includes(key)) {
      additional[key] = value;
    }
  }
  return additional;
}

/**
 * Extract campaign data from API response
 */
function extractCampaignData(
  campaign: {
    id?: string;
    resourceName?: string;
    name?: string;
    status?: string;
    advertisingChannelType?: string;
    campaignBudget?: string;
    budget?: string;
    biddingStrategy?: string;
    startDate?: string;
    endDate?: string;
    [key: string]: unknown;
  }
): {
  campaignId?: string | undefined;
  resourceName?: string | undefined;
  name?: string | undefined;
  status?: string | undefined;
  advertisingChannelType?: string | undefined;
  budget?: string | undefined;
  biddingStrategy?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  [key: string]: unknown;
} {
  const coreFields = ["id", "resourceName", "name", "status", "advertisingChannelType", "campaignBudget", "budget", "biddingStrategy", "startDate", "endDate"];
  const core = extractCoreCampaignFields(campaign);
  const additional = extractAdditionalCampaignFields(campaign, coreFields);
  return { ...core, ...additional };
}

/**
 * Transform single campaign get response
 */
export function transformCampaignGetResponse(
  response: {
    results?: Array<{
      campaign?: {
        id?: string;
        resourceName?: string;
        name?: string;
        status?: string;
        advertisingChannelType?: string;
        budget?: string;
        biddingStrategy?: string;
        [key: string]: unknown;
      };
    }>;
  }
): z.infer<typeof campaignGetResponseSchema> {
  const campaign = response.results?.[0]?.campaign;
  if (!campaign) {
    return {
      campaignId: undefined,
      name: undefined,
      status: undefined,
      advertisingChannelType: undefined,
      budget: undefined,
      biddingStrategy: undefined,
    };
  }

  const data = extractCampaignData(campaign);
  return {
    campaignId: data.campaignId,
    name: data.name,
    status: data.status as "ENABLED" | "PAUSED" | "REMOVED" | undefined,
    advertisingChannelType: data.advertisingChannelType,
    budget: data.budget,
    biddingStrategy: data.biddingStrategy,
  };
}

/**
 * Transform campaign upsert response
 */
export function transformCampaignUpsertResponse(
  response: {
    results?: Array<{
      campaign?: {
        resourceName?: string;
        id?: string;
        name?: string;
        status?: string;
        advertisingChannelType?: string;
        campaignBudget?: string;
        [key: string]: unknown;
      };
    }>;
  },
  validatedRequest?: {
    advertisingChannelType?: string | undefined;
    budget?: string | undefined;
    biddingStrategy?: string | undefined;
  }
): z.infer<typeof campaignUpsertResponseSchema> {
  const result = response.results?.[0]?.campaign;
  if (!result) {
    throw new Error("Campaign upsert failed: No campaign in response");
  }

  const campaignId = result.id || extractResourceId(result.resourceName);
  const data = extractCampaignData(result);

  return {
    campaignId,
    name: data.name,
    status: data.status as "ENABLED" | "PAUSED" | "REMOVED" | undefined,
    advertisingChannelType: validatedRequest?.advertisingChannelType ?? data.advertisingChannelType,
    budget: validatedRequest?.budget ?? data.budget,
    biddingStrategy: validatedRequest?.biddingStrategy ?? data.biddingStrategy,
  };
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
 * Transform campaign pause response
 */
export function transformCampaignPauseResponse(
  response: {
    results?: Array<{
      campaign?: {
        id?: string;
        status?: string;
      };
    }>;
  },
  campaignId?: string
): z.infer<typeof campaignPauseResponseSchema> {
  const result = response.results?.[0]?.campaign;
  if (!result) {
    throw new Error("Campaign pause failed: No campaign in response");
  }

  return {
    campaignId: result.id || campaignId,
    status: "PAUSED" as const,
  };
}
