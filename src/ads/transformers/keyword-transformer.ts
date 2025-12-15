/**
 * Keyword Response Transformers
 * Extracted transformation logic to follow SRP (Single Responsibility Principle)
 */

import type { z } from "zod";
import type {
  keywordListResponseSchema,
  keywordUpsertResponseSchema,
  keywordDeleteResponseSchema,
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
 * Transform keyword list response
 */
export function transformKeywordListResponse(
  response: {
    results?: Array<{
      adGroupCriterion?: {
        criterion?: {
          id?: string;
          keyword?: {
            text?: string;
            matchType?: string;
          };
        };
        cpcBid?: {
          micros?: string;
        };
        cpcBidMicros?: string;
        negative?: boolean;
      };
    }>;
  }
): z.infer<typeof keywordListResponseSchema> {
  const keywords = (response.results || []).map((r) => {
    const criterion = r.adGroupCriterion?.criterion;
    const cpcBidMicros = r.adGroupCriterion?.cpcBidMicros || r.adGroupCriterion?.cpcBid?.micros;
    const cpcBid = cpcBidMicros ? parseFloat(cpcBidMicros) / 1000000 : undefined;

    return {
      keywordId: criterion?.id,
      text: criterion?.keyword?.text,
      matchType: criterion?.keyword?.matchType as "EXACT" | "PHRASE" | "BROAD" | undefined,
      cpcBid,
      negative: r.adGroupCriterion?.negative || false,
    };
  });

  return { keywords };
}

/**
 * Transform keyword upsert response
 */
export function transformKeywordUpsertResponse(
  response: {
    results?: Array<{
      adGroupCriterion?: {
        resourceName?: string;
        criterion?: {
          id?: string;
          keyword?: {
            text?: string;
            matchType?: string;
          };
        };
      };
    }>;
  },
  validatedRequest: {
    text: string;
    matchType: "EXACT" | "PHRASE" | "BROAD";
    cpcBid?: number;
  }
): z.infer<typeof keywordUpsertResponseSchema> {
  const result = response.results?.[0]?.adGroupCriterion;
  if (!result) {
    throw new Error("Keyword upsert failed: No keyword in response");
  }

  const keywordId = result.criterion?.id || extractResourceId(result.resourceName);

  return {
    keywordId,
    text: result.criterion?.keyword?.text || validatedRequest.text,
    matchType: (result.criterion?.keyword?.matchType as "EXACT" | "PHRASE" | "BROAD" | undefined) || validatedRequest.matchType,
    cpcBid: validatedRequest.cpcBid,
  };
}

/**
 * Transform keyword delete response
 */
export function transformKeywordDeleteResponse(
  response: {
    results?: Array<{
      adGroupCriterion?: {
        resourceName?: string;
      };
    }>;
  },
  keywordId: string
): z.infer<typeof keywordDeleteResponseSchema> {
  const result = response.results?.[0]?.adGroupCriterion;
  if (!result) {
    throw new Error("Failed to delete keyword");
  }

  return {
    keywordId,
    deleted: true,
  };
}
