/**
 * Workflows module
 * Registers cross-product workflow tools
 */

import type { MCPServerBootstrap } from "../server/bootstrap.js";
import type { GA4Client } from "../ga4/client.js";
import type { AdsClient } from "../ads/client.js";
import type { ILogger, ICache, ICapabilitiesRegistry } from "../core/types.js";
import { linkGA4ConversionToAds } from "./ga4-ads-linking.js";

/**
 * Workflow tools options
 */
export interface WorkflowToolsOptions {
  bootstrap: MCPServerBootstrap;
  ga4Client: GA4Client;
  adsClient: AdsClient;
  cache: ICache;
  capabilitiesRegistry: ICapabilitiesRegistry;
  logger: ILogger;
}

/**
 * Register GA4 ↔ Ads conversion linking workflow tool
 */
/**
 * Helper: Get GA4 Ads linking tool schema
 */
function getGA4AdsLinkingToolSchema(): {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
} {
  return {
    type: "object",
    properties: {
      propertyId: {
        type: "string",
        description: "GA4 property ID (numeric)",
      },
      eventName: {
        type: "string",
        description: "GA4 event name to mark as conversion",
      },
      customerId: {
        type: "string",
        description: "Google Ads customer ID (numeric or customers/1234567890 format)",
      },
      conversionName: {
        type: "string",
        description: "Name for the Google Ads conversion action",
      },
      conversionCategory: {
        type: "string",
        enum: ["PURCHASE", "SIGNUP", "LEAD", "VIEW_ITEM", "ADD_TO_CART", "BEGIN_CHECKOUT", "SUBSCRIBE_PAID", "PHONE_CALL_LEAD", "IMPORTED_LEAD", "SUBMIT_LEAD_FORM", "BOOK_APPOINTMENT", "REQUEST_QUOTE", "GET_DIRECTIONS", "OUTBOUND_CLICK", "CALL_TRACKING"],
        description: "Conversion category",
      },
      adsCustomerId: {
        type: "string",
        description: "Optional: Google Ads customer ID for linking (numeric or customers/1234567890 format)",
      },
      countingMethod: {
        type: "string",
        enum: ["CONVERSION_COUNTING_METHOD_UNSPECIFIED", "ONCE_PER_EVENT", "ONCE_PER_SESSION"],
        description: "GA4 conversion counting method",
      },
      attributionModel: {
        type: "string",
        enum: ["DATA_DRIVEN", "LAST_CLICK", "FIRST_CLICK", "LINEAR", "TIME_DECAY", "POSITION_BASED"],
        description: "Attribution model for Google Ads conversion",
      },
    },
    required: ["propertyId", "eventName", "customerId", "conversionName"],
  };
}

function registerGA4AdsLinkingTool(
  bootstrap: MCPServerBootstrap,
  ga4Client: GA4Client,
  adsClient: AdsClient,
  cache: ICache,
  capabilitiesRegistry: ICapabilitiesRegistry,
  logger: ILogger
): void {
  bootstrap.registerTool({
    name: "workflow.ga4-ads.conversionLink",
    description: "Link GA4 conversion event to Google Ads conversion action. Creates GA4 conversion, Google Ads link (optional), and Google Ads conversion action with type GOOGLE_ANALYTICS.",
    inputSchema: getGA4AdsLinkingToolSchema(),
    handler: async (args: unknown) => {
      try {
        return await linkGA4ConversionToAds(
          args,
          ga4Client,
          adsClient,
          cache,
          capabilitiesRegistry,
          logger
        );
      } catch (error) {
        if (error instanceof Error) {
          logger.error("workflow.ga4-ads.conversionLink failed", error);
        } else {
          logger.error("workflow.ga4-ads.conversionLink failed", new Error(String(error)));
        }
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  });
}

/**
 * Register all workflow tools
 */
export function registerWorkflowTools(options: WorkflowToolsOptions): void {
  const { bootstrap, ga4Client, adsClient, cache, capabilitiesRegistry, logger } = options;

  logger.info("Registering workflow tools");

  registerGA4AdsLinkingTool(bootstrap, ga4Client, adsClient, cache, capabilitiesRegistry, logger);

  logger.info("Workflow tools registered");
}
