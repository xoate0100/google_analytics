/**
 * GA4 ↔ Ads Conversion Linking Workflow
 * Orchestrates the linking of GA4 conversion events to Google Ads conversion actions
 */

import { z } from "zod";
import type { GA4Client } from "../ga4/client.js";
import type { AdsClient } from "../ads/client.js";
import type { ILogger, ICache, ICapabilitiesRegistry } from "../core/types.js";
import { executeConversionUpsert as executeGA4ConversionUpsert } from "../ga4/tools.js";
import { executeGoogleAdsIntegrationCreate } from "../ga4/tools.js";
import { executeConversionUpsert as executeAdsConversionUpsert } from "../ads/tools.js";
import { validateSchema } from "../core/validation.js";

/**
 * GA4 ↔ Ads Conversion Linking Request Schema
 */
export const ga4AdsLinkingRequestSchema = z.object({
  propertyId: z.string().regex(/^\d+$/, "Property ID must be numeric"),
  eventName: z.string().min(1, "Event name is required"),
  customerId: z.string().regex(/^(\d+|customers\/\d+)$/, "Customer ID must be numeric or in format customers/1234567890"),
  conversionName: z.string().min(1, "Conversion name is required"),
  conversionCategory: z.enum(["PURCHASE", "SIGNUP", "LEAD", "VIEW_ITEM", "ADD_TO_CART", "BEGIN_CHECKOUT", "SUBSCRIBE_PAID", "PHONE_CALL_LEAD", "IMPORTED_LEAD", "SUBMIT_LEAD_FORM", "BOOK_APPOINTMENT", "REQUEST_QUOTE", "GET_DIRECTIONS", "OUTBOUND_CLICK", "CALL_TRACKING"]).optional(),
  adsCustomerId: z.string().regex(/^(\d+|customers\/\d+)$/, "Ads Customer ID must be numeric or in format customers/1234567890").optional(),
  countingMethod: z.enum(["CONVERSION_COUNTING_METHOD_UNSPECIFIED", "ONCE_PER_EVENT", "ONCE_PER_SESSION"]).optional(),
  attributionModel: z.enum(["DATA_DRIVEN", "LAST_CLICK", "FIRST_CLICK", "LINEAR", "TIME_DECAY", "POSITION_BASED"]).optional(),
});

/**
 * GA4 ↔ Ads Conversion Linking Response Schema
 */
export const ga4AdsLinkingResponseSchema = z.object({
  ga4ConversionName: z.string(),
  ga4LinkName: z.string().optional(),
  adsConversionActionId: z.string(),
  adsConversionActionResourceName: z.string(),
  linked: z.boolean(),
});

/**
 * Link GA4 conversion to Google Ads conversion action
 * 
 * This workflow:
 * 1. Creates or verifies GA4 conversion event
 * 2. Creates or verifies Google Ads link in GA4
 * 3. Creates Google Ads conversion action with type "GOOGLE_ANALYTICS"
 * 4. Returns the complete linking configuration
 */
export async function linkGA4ConversionToAds(
  args: unknown,
  ga4Client: GA4Client,
  adsClient: AdsClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): Promise<z.infer<typeof ga4AdsLinkingResponseSchema>> {
  logger.info("Starting GA4 ↔ Ads conversion linking workflow");

  const validatedRequest = validateSchema(ga4AdsLinkingRequestSchema, args);

  try {
    // Step 1: Create or verify GA4 conversion event
    logger.debug("Step 1: Creating/verifying GA4 conversion event", {
      propertyId: validatedRequest.propertyId,
      eventName: validatedRequest.eventName,
    });

    const ga4ConversionArgs = {
      parent: `properties/${validatedRequest.propertyId}`,
      eventName: validatedRequest.eventName,
      ...(validatedRequest.countingMethod && { countingMethod: validatedRequest.countingMethod }),
    };

    const ga4Conversion = await executeGA4ConversionUpsert(
      ga4ConversionArgs,
      ga4Client,
      cache,
      capabilitiesRegistry,
      logger
    );

    const ga4ConversionName = ga4Conversion.name || `properties/${validatedRequest.propertyId}/conversionEvents/${validatedRequest.eventName}`;

    logger.info("GA4 conversion event created/verified", { ga4ConversionName });

    // Step 2: Create or verify Google Ads link in GA4 (if adsCustomerId provided)
    let ga4LinkName: string | undefined;
    if (validatedRequest.adsCustomerId) {
      logger.debug("Step 2: Creating/verifying Google Ads link in GA4", {
        propertyId: validatedRequest.propertyId,
        adsCustomerId: validatedRequest.adsCustomerId,
      });

      const adsCustomerId = validatedRequest.adsCustomerId.replace(/^customers\//, "");

      const ga4LinkArgs = {
        parent: `properties/${validatedRequest.propertyId}`,
        customerId: adsCustomerId,
      };

      try {
        const ga4Link = await executeGoogleAdsIntegrationCreate(
          ga4LinkArgs,
          ga4Client,
          cache,
          capabilitiesRegistry,
          logger
        );

        ga4LinkName = ga4Link.name;
        logger.info("Google Ads link created/verified in GA4", { ga4LinkName });
      } catch (error) {
        // Link might already exist, log and continue
        logger.warn("Google Ads link creation failed (may already exist)", error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Step 3: Create Google Ads conversion action with type "GOOGLE_ANALYTICS"
    logger.debug("Step 3: Creating Google Ads conversion action", {
      customerId: validatedRequest.customerId,
      conversionName: validatedRequest.conversionName,
    });

    const customerId = validatedRequest.customerId.replace(/^customers\//, "");

    const adsConversionArgs = {
      customerId: validatedRequest.customerId,
      name: validatedRequest.conversionName,
      type: "GOOGLE_ANALYTICS" as const,
      ...(validatedRequest.conversionCategory && { category: validatedRequest.conversionCategory }),
      ...(validatedRequest.attributionModel && { attributionModel: validatedRequest.attributionModel }),
    };

    const adsConversion = await executeAdsConversionUpsert(
      adsConversionArgs,
      adsClient,
      capabilitiesRegistry,
      logger
    );

    const adsConversionActionId = adsConversion.conversionId || "";
    const adsConversionActionResourceName = adsConversion.resourceName || `customers/${customerId}/conversionActions/${adsConversionActionId}`;

    logger.info("Google Ads conversion action created", {
      adsConversionActionId,
      adsConversionActionResourceName,
    });

    // Step 4: Return complete linking configuration
    const result: z.infer<typeof ga4AdsLinkingResponseSchema> = {
      ga4ConversionName,
      ga4LinkName,
      adsConversionActionId,
      adsConversionActionResourceName,
      linked: true,
    };

    logger.info("GA4 ↔ Ads conversion linking workflow completed", result);

    return result;
  } catch (error) {
    logger.error("GA4 ↔ Ads conversion linking workflow failed", error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

