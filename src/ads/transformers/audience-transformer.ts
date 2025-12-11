/**
 * Audience Response Transformers
 * Extracted transformation logic to follow SRP (Single Responsibility Principle)
 */

import type { z } from "zod";
import type {
  audienceListResponseSchema,
  audienceGetResponseSchema,
  audienceUpsertResponseSchema,
  audienceAttachResponseSchema,
} from "../schemas.js";

/**
 * Extract resource ID from resource name
 */
function extractResourceId(resourceName?: string): string | undefined {
  if (!resourceName) return undefined;
  const parts = resourceName.split("/");
  return parts[parts.length - 1];
}

/**
 * Transform audience list response
 */
export function transformAudienceListResponse(
  response: {
    results?: Array<{
      audience?: {
        id?: string;
        name?: string;
        type?: string;
        status?: string;
      };
      userList?: {
        id?: string;
        name?: string;
        type?: string;
        status?: string;
      };
    }>;
  }
): z.infer<typeof audienceListResponseSchema> {
  const audiences = (response.results || []).map((r) => {
    const audience = r.audience || r.userList;
    return {
      audienceId: audience?.id,
      name: audience?.name,
      type: audience?.type,
      status: audience?.status as "ENABLED" | "REMOVED" | "HIDDEN" | undefined,
    };
  });

  return { audiences };
}

/**
 * Transform single audience get response
 */
export function transformAudienceGetResponse(
  response: {
    results?: Array<{
      userList?: {
        id?: string;
        name?: string;
        type?: string;
        status?: string;
        membershipStatus?: string;
        membershipLifeSpan?: number;
        description?: string;
      };
    }>;
  }
): z.infer<typeof audienceGetResponseSchema> {
  const audience = response.results?.[0]?.userList;
  if (!audience) {
    return {
      audienceId: undefined,
      name: undefined,
      type: undefined,
      status: undefined,
      membershipStatus: undefined,
      membershipLifeSpan: undefined,
      description: undefined,
    };
  }

  return {
    audienceId: audience.id,
    name: audience.name,
    type: audience.type as "USER_LIST" | "CUSTOMER_MATCH_USER_LIST" | "BASIC_USER_LIST" | "LOGICAL_USER_LIST" | "SIMILAR_USER_LIST" | undefined,
    status: audience.status as "ENABLED" | "REMOVED" | "HIDDEN" | undefined,
    membershipStatus: audience.membershipStatus as "OPEN" | "CLOSED" | undefined,
    membershipLifeSpan: audience.membershipLifeSpan,
    description: audience.description,
  };
}

/**
 * Transform audience upsert response
 */
export function transformAudienceUpsertResponse(
  response: {
    results?: Array<{
      userList?: {
        resourceName?: string;
        id?: string;
        name?: string;
        status?: string;
      };
    }>;
  },
  validatedRequest: {
    type?: string;
    membershipStatus?: string;
    membershipLifeSpan?: number;
    description?: string;
  }
): z.infer<typeof audienceUpsertResponseSchema> {
  const result = response.results?.[0]?.userList;
  if (!result) {
    throw new Error("Failed to create/update audience");
  }

  const audienceId = result.id || extractResourceId(result.resourceName);

  return {
    audienceId,
    name: result.name,
    status: result.status as "ENABLED" | "REMOVED" | "HIDDEN" | undefined,
    type: validatedRequest.type as "USER_LIST" | "CUSTOMER_MATCH_USER_LIST" | "BASIC_USER_LIST" | "LOGICAL_USER_LIST" | "SIMILAR_USER_LIST" | undefined,
    membershipStatus: validatedRequest.membershipStatus as "OPEN" | "CLOSED" | undefined,
    membershipLifeSpan: validatedRequest.membershipLifeSpan,
    description: validatedRequest.description,
  };
}

/**
 * Transform audience attach response
 */
export function transformAudienceAttachResponse(
  response: {
    results?: Array<{
      campaignAudience?: {
        resourceName?: string;
        campaign?: string;
        audience?: string;
        bidModifier?: number;
      };
    }>;
  },
  validatedRequest: {
    campaignId: string;
    audienceId: string;
    bidModifier?: number;
  }
): z.infer<typeof audienceAttachResponseSchema> {
  const result = response.results?.[0]?.campaignAudience;
  if (!result) {
    throw new Error("Failed to attach audience to campaign");
  }

  return {
    campaignId: validatedRequest.campaignId,
    audienceId: validatedRequest.audienceId,
    attached: true,
    bidModifier: result.bidModifier ?? validatedRequest.bidModifier,
  };
}
