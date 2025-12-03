/**
 * Bidding Strategy Response Transformers
 * Extracted transformation logic to follow SRP (Single Responsibility Principle)
 */

import type { z } from "zod";
import type {
  biddingStrategyListResponseSchema,
  biddingStrategyGetResponseSchema,
  biddingStrategyUpsertResponseSchema,
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
 * Convert micros to amount
 */
function convertMicrosToAmount(micros?: string): number | undefined {
  if (!micros) return undefined;
  const parsed = parseInt(micros, 10);
  return parsed / 1000000;
}

/**
 * Transform bidding strategy list response
 */
export function transformBiddingStrategyListResponse(
  response: {
    results?: Array<{
      biddingStrategy?: {
        id?: string;
        name?: string;
        type?: string;
        status?: string;
      };
    }>;
  }
): z.infer<typeof biddingStrategyListResponseSchema> {
  const strategies = (response.results || []).map((r) => {
    const strategy = r.biddingStrategy;
    return {
      strategyId: strategy?.id,
      name: strategy?.name,
      type: strategy?.type,
      status: strategy?.status as "ENABLED" | "REMOVED" | "UNKNOWN" | undefined,
    };
  });

  return { strategies };
}

/**
 * Transform single bidding strategy get response
 */
export function transformBiddingStrategyGetResponse(
  response: {
    results?: Array<{
      biddingStrategy?: {
        id?: string;
        name?: string;
        type?: string;
        status?: string;
        targetCpa?: {
          targetCpaMicros?: string;
        };
        targetRoas?: {
          targetRoas?: number;
        };
        targetSpend?: {
          targetSpendMicros?: string;
        };
      };
    }>;
  }
): z.infer<typeof biddingStrategyGetResponseSchema> {
  const strategy = response.results?.[0]?.biddingStrategy;
  if (!strategy) {
    return {
      strategyId: undefined,
      name: undefined,
      type: undefined,
      status: undefined,
      targetCpa: undefined,
      targetRoas: undefined,
      targetSpend: undefined,
    };
  }

  const targetCpa = convertMicrosToAmount(strategy.targetCpa?.targetCpaMicros);
  const targetSpend = convertMicrosToAmount(strategy.targetSpend?.targetSpendMicros);

  return {
    strategyId: strategy.id,
    name: strategy.name,
    type: strategy.type as "MAXIMIZE_CONVERSIONS" | "MAXIMIZE_CONVERSION_VALUE" | "TARGET_CPA" | "TARGET_ROAS" | "TARGET_SPEND" | "TARGET_IMPRESSION_SHARE" | "MANUAL_CPC" | "ENHANCED_CPC" | undefined,
    status: strategy.status as "ENABLED" | "REMOVED" | "UNKNOWN" | undefined,
    targetCpa: targetCpa ? { targetCpaMicros: strategy.targetCpa?.targetCpaMicros } : undefined,
    targetRoas: strategy.targetRoas,
    targetSpend: targetSpend ? { targetSpendMicros: strategy.targetSpend?.targetSpendMicros } : undefined,
  };
}

/**
 * Transform bidding strategy search response (for finding existing strategy)
 */
export function transformBiddingStrategySearchResponse(
  response: {
    results?: Array<{
      biddingStrategy?: {
        id?: string;
        resourceName?: string;
      };
    }>;
  }
): { id?: string; resourceName?: string } | undefined {
  return response.results?.[0]?.biddingStrategy;
}

/**
 * Transform bidding strategy upsert response
 */
export function transformBiddingStrategyUpsertResponse(
  response: {
    results?: Array<{
      biddingStrategy?: {
        resourceName?: string;
        id?: string;
        name?: string;
        status?: string;
      };
    }>;
  },
  validatedRequest: {
    type?: string;
    targetCpa?: number;
    targetRoas?: number;
    targetSpend?: number;
  }
): z.infer<typeof biddingStrategyUpsertResponseSchema> {
  const result = response.results?.[0]?.biddingStrategy;
  if (!result) {
    throw new Error("Failed to create/update bidding strategy");
  }

  const strategyId = result.id || extractResourceId(result.resourceName);

  return {
    strategyId,
    name: result.name,
    type: validatedRequest.type as "MAXIMIZE_CONVERSIONS" | "MAXIMIZE_CONVERSION_VALUE" | "TARGET_CPA" | "TARGET_ROAS" | "TARGET_SPEND" | "TARGET_IMPRESSION_SHARE" | "MANUAL_CPC" | "ENHANCED_CPC" | undefined,
    status: result.status as "ENABLED" | "REMOVED" | "UNKNOWN" | undefined,
    targetCpa: validatedRequest.targetCpa !== undefined ? { targetCpaMicros: Math.round(validatedRequest.targetCpa * 1000000).toString() } : undefined,
    targetRoas: validatedRequest.targetRoas !== undefined ? { targetRoas: validatedRequest.targetRoas } : undefined,
    targetSpend: validatedRequest.targetSpend !== undefined ? { targetSpendMicros: Math.round(validatedRequest.targetSpend * 1000000).toString() } : undefined,
  };
}
