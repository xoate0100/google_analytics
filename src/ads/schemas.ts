/**
 * Google Ads API Zod schemas
 * Validates request and response structures for Google Ads API GAQL queries
 */

import { z } from "zod";

/**
 * Customer ID schema (format: 1234567890 or customers/1234567890)
 */
export const customerIdSchema = z
  .string()
  .regex(/^(\d+|customers\/\d+)$/, "Customer ID must be numeric or in format customers/1234567890");

/**
 * GAQL Query Request Schema
 */
export const gaqlQueryRequestSchema = z.object({
  customerId: customerIdSchema,
  query: z.string().min(1, "GAQL query is required"),
  limit: z.number().int().positive().optional(),
  validateOnly: z.boolean().optional(),
});

/**
 * GAQL Query Response Schema
 */
export const gaqlQueryResponseSchema = z.object({
  results: z.array(z.record(z.unknown())),
  fieldMask: z.string().optional(),
  requestId: z.string().optional(),
});

/**
 * GAQL Batch Request Schema
 */
export const gaqlBatchRequestSchema = z.object({
  customerId: customerIdSchema,
  queries: z.array(z.string().min(1, "GAQL query is required")).min(1, "At least one query is required"),
});

/**
 * GAQL Batch Response Schema
 */
export const gaqlBatchResponseSchema = z.object({
  results: z.array(
    z.object({
      query: z.string(),
      result: gaqlQueryResponseSchema,
      error: z.string().optional(),
    })
  ),
});

/**
 * GAQL Stream Request Schema
 */
export const gaqlStreamRequestSchema = z.object({
  customerId: customerIdSchema,
  query: z.string().min(1, "GAQL query is required"),
});

/**
 * GAQL Stream Response Schema
 */
export const gaqlStreamResponseSchema = z.object({
  results: z.array(z.record(z.unknown())),
  totalResults: z.number().optional(),
});

/**
 * Campaign List Request Schema
 */
export const campaignListRequestSchema = z.object({
  customerId: customerIdSchema,
  filter: z.string().optional(),
});

/**
 * Campaign List Response Schema
 */
export const campaignListResponseSchema = z.object({
  campaigns: z.array(
    z.object({
      campaignId: z.string().optional(),
      name: z.string().optional(),
      status: z.enum(["ENABLED", "PAUSED", "REMOVED"]).optional(),
      advertisingChannelType: z.string().optional(),
    })
  ),
});

/**
 * Campaign Get Request Schema
 */
export const campaignGetRequestSchema = z.object({
  customerId: customerIdSchema,
  campaignId: z.string().min(1, "Campaign ID is required"),
});

/**
 * Campaign Get Response Schema
 */
export const campaignGetResponseSchema = z.object({
  campaignId: z.string().optional(),
  name: z.string().optional(),
  status: z.enum(["ENABLED", "PAUSED", "REMOVED"]).optional(),
  advertisingChannelType: z.string().optional(),
  budget: z.string().optional(),
  biddingStrategy: z.string().optional(),
});

/**
 * Campaign Upsert Request Schema
 */
export const campaignUpsertRequestSchema = z.object({
  customerId: customerIdSchema,
  campaignId: z.string().optional(), // Required for update, optional for create
  name: z.string().min(1, "Campaign name is required"),
  status: z.enum(["ENABLED", "PAUSED", "REMOVED"]).optional(),
  advertisingChannelType: z.enum(["SEARCH", "DISPLAY", "VIDEO", "SHOPPING", "HOTEL", "MULTI_CHANNEL", "PERFORMANCE_MAX"]).optional(),
  budget: z.string().optional(), // Budget resource name
  biddingStrategy: z.string().optional(), // Bidding strategy resource name
  adSchedule: z.array(z.unknown()).optional(), // Ad schedule configuration
  targeting: z.record(z.unknown()).optional(), // Targeting configuration
});

/**
 * Campaign Upsert Response Schema
 */
export const campaignUpsertResponseSchema = campaignGetResponseSchema;

/**
 * Campaign Pause Request Schema
 */
export const campaignPauseRequestSchema = z.object({
  customerId: customerIdSchema,
  campaignId: z.string().min(1, "Campaign ID is required"),
});

/**
 * Campaign Pause Response Schema
 */
export const campaignPauseResponseSchema = z.object({
  campaignId: z.string().optional(),
  status: z.enum(["PAUSED"]).optional(),
});

/**
 * Ad Group List Request Schema
 */
export const adGroupListRequestSchema = z.object({
  customerId: customerIdSchema,
  campaignId: z.string().optional(),
});

/**
 * Ad Group List Response Schema
 */
export const adGroupListResponseSchema = z.object({
  adGroups: z.array(
    z.object({
      adGroupId: z.string().optional(),
      name: z.string().optional(),
      status: z.enum(["ENABLED", "PAUSED", "REMOVED"]).optional(),
      type: z.string().optional(),
      campaignId: z.string().optional(),
    })
  ),
});

/**
 * Ad Group Get Request Schema
 */
export const adGroupGetRequestSchema = z.object({
  customerId: customerIdSchema,
  adGroupId: z.string().min(1, "Ad Group ID is required"),
});

/**
 * Ad Group Get Response Schema
 */
export const adGroupGetResponseSchema = z.object({
  adGroupId: z.string().optional(),
  name: z.string().optional(),
  status: z.enum(["ENABLED", "PAUSED", "REMOVED"]).optional(),
  type: z.string().optional(),
  campaignId: z.string().optional(),
  targeting: z.record(z.unknown()).optional(),
});

/**
 * Ad Group Upsert Request Schema
 */
export const adGroupUpsertRequestSchema = z.object({
  customerId: customerIdSchema,
  adGroupId: z.string().optional(), // Required for update, optional for create
  campaignId: z.string().min(1, "Campaign ID is required"),
  name: z.string().min(1, "Ad Group name is required"),
  status: z.enum(["ENABLED", "PAUSED", "REMOVED"]).optional(),
  type: z.enum(["SEARCH_STANDARD", "SEARCH_DYNAMIC_ADS", "DISPLAY_STANDARD", "DISPLAY_ENGAGEMENT", "SHOPPING_PRODUCT_ADS", "HOTEL_ADS", "VIDEO_RESPONSIVE", "VIDEO_TRUE_VIEW_DISCOVERY", "VIDEO_TRUE_VIEW_IN_STREAM", "VIDEO_NON_SKIPPABLE_IN_STREAM", "VIDEO_OUTSTREAM", "VIDEO_SEQUENCE"]).optional(),
  targeting: z.record(z.unknown()).optional(),
});

/**
 * Ad Group Upsert Response Schema
 */
export const adGroupUpsertResponseSchema = adGroupGetResponseSchema;

/**
 * Keyword List Request Schema
 */
export const keywordListRequestSchema = z.object({
  customerId: customerIdSchema,
  adGroupId: z.string().optional(),
});

/**
 * Keyword List Response Schema
 */
export const keywordListResponseSchema = z.object({
  keywords: z.array(
    z.object({
      keywordId: z.string().optional(),
      text: z.string().optional(),
      matchType: z.enum(["EXACT", "PHRASE", "BROAD"]).optional(),
      cpcBid: z.number().optional(),
      negative: z.boolean().optional(),
    })
  ),
});

/**
 * Keyword Upsert Request Schema
 */
export const keywordUpsertRequestSchema = z.object({
  customerId: customerIdSchema,
  adGroupId: z.string().min(1, "Ad Group ID is required"),
  keywordId: z.string().optional(), // Required for update, optional for create
  text: z.string().min(1, "Keyword text is required"),
  matchType: z.enum(["EXACT", "PHRASE", "BROAD"]),
  cpcBid: z.number().positive().optional(),
  negative: z.boolean().optional(),
});

/**
 * Keyword Upsert Response Schema
 */
export const keywordUpsertResponseSchema = z.object({
  keywordId: z.string().optional(),
  text: z.string().optional(),
  matchType: z.enum(["EXACT", "PHRASE", "BROAD"]).optional(),
  cpcBid: z.number().optional(),
});

/**
 * Keyword Delete Request Schema
 */
export const keywordDeleteRequestSchema = z.object({
  customerId: customerIdSchema,
  keywordId: z.string().min(1, "Keyword ID is required"),
});

/**
 * Keyword Delete Response Schema
 */
export const keywordDeleteResponseSchema = z.object({
  keywordId: z.string().optional(),
  deleted: z.boolean().optional(),
});

/**
 * Conversion List Request Schema
 */
export const conversionListRequestSchema = z.object({
  customerId: customerIdSchema,
  filter: z.string().optional(),
});

/**
 * Conversion List Response Schema
 */
export const conversionListResponseSchema = z.object({
  conversions: z.array(
    z.object({
      conversionId: z.string().optional(),
      name: z.string().optional(),
      type: z.string().optional(),
      category: z.string().optional(),
      status: z.enum(["ENABLED", "REMOVED", "HIDDEN"]).optional(),
    })
  ),
});

/**
 * Conversion Get Request Schema
 */
export const conversionGetRequestSchema = z.object({
  customerId: customerIdSchema,
  conversionId: z.string().min(1, "Conversion ID is required"),
});

/**
 * Conversion Get Response Schema
 */
export const conversionGetResponseSchema = z.object({
  conversionId: z.string().optional(),
  name: z.string().optional(),
  type: z.enum(["WEBPAGE", "APP", "PHONE_CALL", "IMPORT", "GOOGLE_ANALYTICS"]).optional(),
  category: z.enum(["PURCHASE", "SIGNUP", "LEAD", "VIEW_ITEM", "ADD_TO_CART", "BEGIN_CHECKOUT", "SUBSCRIBE_PAID", "PHONE_CALL_LEAD", "IMPORTED_LEAD", "SUBMIT_LEAD_FORM", "BOOK_APPOINTMENT", "REQUEST_QUOTE", "GET_DIRECTIONS", "OUTBOUND_CLICK", "CALL_TRACKING"]).optional(),
  status: z.enum(["ENABLED", "REMOVED", "HIDDEN"]).optional(),
  countingType: z.enum(["ONE_PER_CLICK", "MANY_PER_CLICK"]).optional(),
  attributionModel: z.enum(["DATA_DRIVEN", "LAST_CLICK", "FIRST_CLICK", "LINEAR", "TIME_DECAY", "POSITION_BASED"]).optional(),
  valueSettings: z.object({
    defaultValue: z.number().optional(),
    alwaysUseDefaultValue: z.boolean().optional(),
  }).optional(),
});

/**
 * Conversion Upsert Request Schema
 */
export const conversionUpsertRequestSchema = z.object({
  customerId: customerIdSchema,
  conversionId: z.string().optional(), // Required for update, optional for create
  name: z.string().min(1, "Conversion name is required"),
  type: z.enum(["WEBPAGE", "APP", "PHONE_CALL", "IMPORT", "GOOGLE_ANALYTICS"]).optional(),
  category: z.enum(["PURCHASE", "SIGNUP", "LEAD", "VIEW_ITEM", "ADD_TO_CART", "BEGIN_CHECKOUT", "SUBSCRIBE_PAID", "PHONE_CALL_LEAD", "IMPORTED_LEAD", "SUBMIT_LEAD_FORM", "BOOK_APPOINTMENT", "REQUEST_QUOTE", "GET_DIRECTIONS", "OUTBOUND_CLICK", "CALL_TRACKING"]).optional(),
  status: z.enum(["ENABLED", "REMOVED", "HIDDEN"]).optional(),
  countingType: z.enum(["ONE_PER_CLICK", "MANY_PER_CLICK"]).optional(),
  attributionModel: z.enum(["DATA_DRIVEN", "LAST_CLICK", "FIRST_CLICK", "LINEAR", "TIME_DECAY", "POSITION_BASED"]).optional(),
  valueSettings: z.object({
    defaultValue: z.number().optional(),
    alwaysUseDefaultValue: z.boolean().optional(),
  }).optional(),
});

/**
 * Conversion Upsert Response Schema
 */
export const conversionUpsertResponseSchema = conversionGetResponseSchema;

/**
 * Conversion Delete Request Schema
 */
export const conversionDeleteRequestSchema = z.object({
  customerId: customerIdSchema,
  conversionId: z.string().min(1, "Conversion ID is required"),
});

/**
 * Conversion Delete Response Schema
 */
export const conversionDeleteResponseSchema = z.object({
  conversionId: z.string().optional(),
  deleted: z.boolean().optional(),
});

/**
 * Conversion Offline Import Request Schema
 */
export const conversionOfflineImportRequestSchema = z.object({
  customerId: customerIdSchema,
  conversionId: z.string().min(1, "Conversion ID is required"),
  conversions: z.array(
    z.object({
      gclid: z.string().optional(),
      conversionDateTime: z.string().min(1, "Conversion date time is required"),
      conversionValue: z.number().optional(),
      currencyCode: z.string().optional(),
      orderId: z.string().optional(),
    })
  ).min(1, "At least one conversion is required"),
});

/**
 * Conversion Offline Import Response Schema
 */
export const conversionOfflineImportResponseSchema = z.object({
  imported: z.number().optional(),
  errors: z.array(z.string()).optional(),
});

/**
 * Conversion Enhanced Request Schema
 */
export const conversionEnhancedRequestSchema = z.object({
  customerId: customerIdSchema,
  conversionId: z.string().min(1, "Conversion ID is required"),
  enabled: z.boolean(),
});

/**
 * Conversion Enhanced Response Schema
 */
export const conversionEnhancedResponseSchema = z.object({
  conversionId: z.string().optional(),
  enabled: z.boolean().optional(),
});

/**
 * Audience List Request Schema
 */
export const audienceListRequestSchema = z.object({
  customerId: customerIdSchema,
  type: z.enum(["USER_LIST", "CUSTOMER_MATCH_USER_LIST", "BASIC_USER_LIST", "LOGICAL_USER_LIST", "SIMILAR_USER_LIST"]).optional(),
});

/**
 * Audience List Response Schema
 */
export const audienceListResponseSchema = z.object({
  audiences: z.array(
    z.object({
      audienceId: z.string().optional(),
      name: z.string().optional(),
      type: z.string().optional(),
      status: z.enum(["ENABLED", "REMOVED", "HIDDEN"]).optional(),
    })
  ),
});

/**
 * Audience Get Request Schema
 */
export const audienceGetRequestSchema = z.object({
  customerId: customerIdSchema,
  audienceId: z.string().min(1, "Audience ID is required"),
});

/**
 * Audience Get Response Schema
 */
export const audienceGetResponseSchema = z.object({
  audienceId: z.string().optional(),
  name: z.string().optional(),
  type: z.enum(["USER_LIST", "CUSTOMER_MATCH_USER_LIST", "BASIC_USER_LIST", "LOGICAL_USER_LIST", "SIMILAR_USER_LIST"]).optional(),
  status: z.enum(["ENABLED", "REMOVED", "HIDDEN"]).optional(),
  membershipStatus: z.enum(["OPEN", "CLOSED"]).optional(),
  membershipLifeSpan: z.number().optional(),
  description: z.string().optional(),
});

/**
 * Audience Upsert Request Schema
 */
export const audienceUpsertRequestSchema = z.object({
  customerId: customerIdSchema,
  audienceId: z.string().optional(), // Required for update, optional for create
  name: z.string().min(1, "Audience name is required"),
  type: z.enum(["USER_LIST", "CUSTOMER_MATCH_USER_LIST", "BASIC_USER_LIST", "LOGICAL_USER_LIST", "SIMILAR_USER_LIST"]).optional(),
  status: z.enum(["ENABLED", "REMOVED", "HIDDEN"]).optional(),
  membershipStatus: z.enum(["OPEN", "CLOSED"]).optional(),
  membershipLifeSpan: z.number().min(1).max(540).optional(),
  description: z.string().optional(),
});

/**
 * Audience Upsert Response Schema
 */
export const audienceUpsertResponseSchema = audienceGetResponseSchema;

/**
 * Audience Attach Request Schema
 */
export const audienceAttachRequestSchema = z.object({
  customerId: customerIdSchema,
  campaignId: z.string().min(1, "Campaign ID is required"),
  audienceId: z.string().min(1, "Audience ID is required"),
  bidModifier: z.number().optional(),
});

/**
 * Audience Attach Response Schema
 */
export const audienceAttachResponseSchema = z.object({
  campaignId: z.string().optional(),
  audienceId: z.string().optional(),
  attached: z.boolean().optional(),
  bidModifier: z.number().optional(),
});

