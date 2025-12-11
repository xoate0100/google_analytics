/**
 * Conversion Response Transformers
 * Extracted transformation logic to follow SRP (Single Responsibility Principle)
 */

import type { z } from "zod";
import type {
  conversionListResponseSchema,
  conversionGetResponseSchema,
  conversionUpsertResponseSchema,
  conversionDeleteResponseSchema,
  conversionOfflineImportResponseSchema,
  conversionEnhancedResponseSchema,
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
 * Transform conversion list response
 */
export function transformConversionListResponse(
  response: {
    results?: Array<{
      conversionAction?: {
        id?: string;
        name?: string;
        type?: string;
        category?: string;
        status?: string;
      };
    }>;
  }
): z.infer<typeof conversionListResponseSchema> {
  const conversions = (response.results || []).map((r) => ({
    conversionId: r.conversionAction?.id,
    name: r.conversionAction?.name,
    type: r.conversionAction?.type,
    category: r.conversionAction?.category,
    status: r.conversionAction?.status as "ENABLED" | "REMOVED" | "HIDDEN" | undefined,
  }));

  return { conversions };
}

/**
 * Transform single conversion get response
 */
export function transformConversionGetResponse(
  response: {
    results?: Array<{
      conversionAction?: {
        id?: string;
        name?: string;
        type?: string;
        category?: string;
        status?: string;
        countingType?: string;
        attributionModel?: string;
        valueSettings?: {
          defaultValue?: number;
          alwaysUseDefaultValue?: boolean;
        };
      };
    }>;
  }
): z.infer<typeof conversionGetResponseSchema> {
  const conversion = response.results?.[0]?.conversionAction;
  if (!conversion) {
    return {
      conversionId: undefined,
      name: undefined,
      type: undefined,
      category: undefined,
      status: undefined,
      countingType: undefined,
      attributionModel: undefined,
      valueSettings: undefined,
    };
  }

  return {
    conversionId: conversion.id,
    name: conversion.name,
    type: conversion.type as "WEBPAGE" | "APP" | "PHONE_CALL" | "IMPORT" | "GOOGLE_ANALYTICS" | undefined,
    category: conversion.category as z.infer<typeof conversionGetResponseSchema>["category"],
    status: conversion.status as "ENABLED" | "REMOVED" | "HIDDEN" | undefined,
    countingType: conversion.countingType as "ONE_PER_CLICK" | "MANY_PER_CLICK" | undefined,
    attributionModel: conversion.attributionModel as "DATA_DRIVEN" | "LAST_CLICK" | "FIRST_CLICK" | "LINEAR" | "TIME_DECAY" | "POSITION_BASED" | undefined,
    valueSettings: conversion.valueSettings,
  };
}

/**
 * Transform conversion upsert response
 */
export function transformConversionUpsertResponse(
  response: {
    results?: Array<{
      conversionAction?: {
        resourceName?: string;
        id?: string;
        name?: string;
        status?: string;
      };
    }>;
  },
  validatedRequest: {
    type?: string;
    category?: string;
    countingType?: string;
    attributionModel?: string;
    valueSettings?: {
      defaultValue?: number;
      alwaysUseDefaultValue?: boolean;
    };
  }
): z.infer<typeof conversionUpsertResponseSchema> {
  const result = response.results?.[0]?.conversionAction;
  if (!result) {
    throw new Error("Failed to create/update conversion action");
  }

  const conversionId = result.id || extractResourceId(result.resourceName);

  return {
    conversionId,
    name: result.name,
    status: result.status as "ENABLED" | "REMOVED" | "HIDDEN" | undefined,
    type: validatedRequest.type as "WEBPAGE" | "APP" | "PHONE_CALL" | "IMPORT" | "GOOGLE_ANALYTICS" | undefined,
    category: validatedRequest.category as z.infer<typeof conversionGetResponseSchema>["category"],
    countingType: validatedRequest.countingType as "ONE_PER_CLICK" | "MANY_PER_CLICK" | undefined,
    attributionModel: validatedRequest.attributionModel as "DATA_DRIVEN" | "LAST_CLICK" | "FIRST_CLICK" | "LINEAR" | "TIME_DECAY" | "POSITION_BASED" | undefined,
    valueSettings: validatedRequest.valueSettings,
  };
}

/**
 * Transform conversion delete response
 */
export function transformConversionDeleteResponse(
  response: {
    results?: Array<{
      conversionAction?: {
        resourceName?: string;
      };
    }>;
  },
  conversionId: string
): z.infer<typeof conversionDeleteResponseSchema> {
  const result = response.results?.[0]?.conversionAction;
  if (!result) {
    throw new Error("Failed to delete conversion action");
  }

  return {
    conversionId,
    deleted: true,
  };
}

/**
 * Transform conversion offline import response
 */
export function transformConversionOfflineImportResponse(
  response: {
    results?: Array<{
      gclid?: string;
      conversionDateTime?: string;
    }>;
    partialFailureError?: {
      errors?: Array<{
        message?: string;
      }>;
      message?: string;
    };
  }
): z.infer<typeof conversionOfflineImportResponseSchema> {
  const imported = response.results?.length || 0;
  const errors: string[] = [];

  if (response.partialFailureError?.errors) {
    errors.push(...response.partialFailureError.errors.map((e) => e.message || "Unknown error"));
  } else if (response.partialFailureError?.message) {
    errors.push(response.partialFailureError.message);
  }

  return {
    imported,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Transform conversion enhanced response
 */
export function transformConversionEnhancedResponse(
  response: {
    results?: Array<{
      conversionAction?: {
        resourceName?: string;
        id?: string;
      };
    }>;
  },
  conversionId: string,
  enabled: boolean
): z.infer<typeof conversionEnhancedResponseSchema> {
  const result = response.results?.[0]?.conversionAction;
  if (!result) {
    throw new Error("Failed to update enhanced conversion settings");
  }

  return {
    conversionId: result.id || conversionId,
    enabled,
  };
}
