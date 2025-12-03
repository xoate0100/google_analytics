/**
 * Budget Response Transformers
 * Extracted transformation logic to follow SRP (Single Responsibility Principle)
 */

import type { z } from "zod";
import type {
  budgetListResponseSchema,
  budgetGetResponseSchema,
  budgetUpsertResponseSchema,
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
 * Convert amount micros to amount
 */
function convertAmountMicrosToAmount(amountMicros?: string): number | undefined {
  if (!amountMicros) return undefined;
  const micros = parseInt(amountMicros, 10);
  return micros / 1000000;
}

/**
 * Transform budget list response
 */
export function transformBudgetListResponse(
  response: {
    results?: Array<{
      campaignBudget?: {
        id?: string;
        name?: string;
        amountMicros?: string;
        deliveryMethod?: string;
        status?: string;
      };
    }>;
  }
): z.infer<typeof budgetListResponseSchema> {
  const budgets = (response.results || []).map((r) => {
    const budget = r.campaignBudget;
    const amount = convertAmountMicrosToAmount(budget?.amountMicros);

    return {
      budgetId: budget?.id,
      name: budget?.name,
      amount,
      deliveryMethod: budget?.deliveryMethod as "STANDARD" | "ACCELERATED" | undefined,
      status: budget?.status as "ENABLED" | "REMOVED" | "UNKNOWN" | undefined,
    };
  });

  return { budgets };
}

/**
 * Transform single budget get response
 */
export function transformBudgetGetResponse(
  response: {
    results?: Array<{
      campaignBudget?: {
        id?: string;
        name?: string;
        amountMicros?: string;
        deliveryMethod?: string;
        status?: string;
      };
    }>;
  }
): z.infer<typeof budgetGetResponseSchema> {
  const budget = response.results?.[0]?.campaignBudget;
  if (!budget) {
    return {
      budgetId: undefined,
      name: undefined,
      amount: undefined,
      deliveryMethod: undefined,
      status: undefined,
    };
  }

  const amount = convertAmountMicrosToAmount(budget.amountMicros);

  return {
    budgetId: budget.id,
    name: budget.name,
    amount,
    deliveryMethod: budget.deliveryMethod as "STANDARD" | "ACCELERATED" | undefined,
    status: budget.status as "ENABLED" | "REMOVED" | "UNKNOWN" | undefined,
  };
}

/**
 * Transform budget upsert response
 */
export function transformBudgetUpsertResponse(
  response: {
    results?: Array<{
      campaignBudget?: {
        resourceName?: string;
        id?: string;
        name?: string;
        amountMicros?: string;
        status?: string;
      };
    }>;
  },
  validatedRequest: {
    deliveryMethod?: string;
  }
): z.infer<typeof budgetUpsertResponseSchema> {
  const result = response.results?.[0]?.campaignBudget;
  if (!result) {
    throw new Error("Failed to create/update budget");
  }

  const budgetId = result.id || extractResourceId(result.resourceName);
  const amount = convertAmountMicrosToAmount(result.amountMicros);

  return {
    budgetId,
    name: result.name,
    amount,
    deliveryMethod: (validatedRequest.deliveryMethod as "STANDARD" | "ACCELERATED" | undefined) || "STANDARD",
    status: result.status as "ENABLED" | "REMOVED" | "UNKNOWN" | undefined,
  };
}
