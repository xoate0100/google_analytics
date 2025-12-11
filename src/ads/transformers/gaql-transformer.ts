/**
 * GAQL Response Transformers
 * Extracted transformation logic to follow SRP (Single Responsibility Principle)
 */

import type { z } from "zod";
import type { gaqlQueryResponseSchema } from "../schemas.js";

/**
 * Transform a single GAQL query response
 */
export function transformGAQLQueryResponse(
  response: {
    results?: unknown[];
    fieldMask?: string;
    requestId?: string;
  }
): z.infer<typeof gaqlQueryResponseSchema> {
  return {
    results: (response.results || []) as z.infer<typeof gaqlQueryResponseSchema>["results"],
    fieldMask: response.fieldMask,
    requestId: response.requestId,
  };
}

/**
 * Execute a single GAQL query and transform the response
 */
export async function executeSingleGAQLQuery(
  googleAdsClient: {
    search?: (params: unknown) => Promise<{
      results?: unknown[];
      fieldMask?: string;
      requestId?: string;
    }>;
  },
  customerId: string,
  query: string
): Promise<z.infer<typeof gaqlQueryResponseSchema>> {
  const response = (await googleAdsClient.search?.({
    customerId,
    query,
  })) as {
    results?: unknown[];
    fieldMask?: string;
    requestId?: string;
  };

  return transformGAQLQueryResponse(response);
}

/**
 * Handle error in GAQL batch query execution
 */
export function handleGAQLBatchQueryError(
  query: string,
  error: unknown
): {
  query: string;
  result: z.infer<typeof gaqlQueryResponseSchema>;
  error: string;
} {
  return {
    query,
    result: {
      results: [] as z.infer<typeof gaqlQueryResponseSchema>["results"],
    },
    error: error instanceof Error ? error.message : String(error),
  };
}

/**
 * Transform successful GAQL batch query result
 */
export function transformGAQLBatchQueryResult(
  query: string,
  result: z.infer<typeof gaqlQueryResponseSchema>
): {
  query: string;
  result: z.infer<typeof gaqlQueryResponseSchema>;
} {
  return {
    query,
    result,
  };
}

/**
 * Process GAQL batch query result (success or failure)
 */
export async function processGAQLBatchQuery(
  googleAdsClient: {
    search?: (params: unknown) => Promise<{
      results?: unknown[];
      fieldMask?: string;
      requestId?: string;
    }>;
  },
  customerId: string,
  query: string
): Promise<{
  query: string;
  result: z.infer<typeof gaqlQueryResponseSchema>;
  error?: string;
}> {
  try {
    const result = await executeSingleGAQLQuery(googleAdsClient, customerId, query);
    return transformGAQLBatchQueryResult(query, result);
  } catch (error) {
    return handleGAQLBatchQueryError(query, error);
  }
}

/**
 * Transform Promise.allSettled results for GAQL batch
 */
export function transformGAQLBatchSettledResults(
  results: Array<PromiseSettledResult<{
    query: string;
    result: z.infer<typeof gaqlQueryResponseSchema>;
  } | {
    query: string;
    result: { results: Record<string, unknown>[] };
    error: string;
  }>>
): Array<{
  query: string;
  result: z.infer<typeof gaqlQueryResponseSchema>;
  error?: string;
}> {
  return results.map((r) => {
    if (r.status === "fulfilled") {
      return r.value;
    }
    // For rejected promises, return error result with proper type
    return {
      query: "",
      result: {
        results: [] as z.infer<typeof gaqlQueryResponseSchema>["results"],
      },
      error: String(r.reason),
    };
  });
}

/**
 * Build GAQL query with optional limit
 */
export function buildGAQLQueryWithLimit(
  query: string,
  limit?: number
): string {
  if (limit && !query.toUpperCase().includes("LIMIT")) {
    return `${query} LIMIT ${limit}`;
  }
  return query;
}
