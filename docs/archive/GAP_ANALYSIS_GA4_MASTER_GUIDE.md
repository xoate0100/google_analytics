<!-- DEPRECATED: Archived for reference. See docs/archive/README.md. Current context: 6_ai_runtime_context/ACTIVE_PLAN.yaml -->

# Gap Analysis: GA4 Master Guide → MCP API Requirements

## Executive Summary

This document provides a critical-to-quality (CTQ) analysis and gap assessment of the GA4 Master Guide requirements against the current MVP MCP plan. The analysis identifies **missing API routes and capabilities** required for fully automated Google Marketing Engineering operations via Cursor IDE AI chat.

**Key Findings:**
- **Critical Gaps:** 15+ missing API endpoints
- **High Priority:** Data filters, enhanced measurement config, Google Signals, BigQuery linking, Google Ads linking
- **Medium Priority:** Explorations API, event parameter management, audience triggers
- **Low Priority:** UI-only features (explorations interface, some reporting views)

---

## 1. GA4 Property Setup & Configuration

### 1.1 Property Setup Checklist (Lines 32-40)

| Requirement | Current MVP Status | Gap | Required API Endpoint |
|------------|-------------------|-----|---------------------|
| Create GA4 property | ✅ Covered | None | `ga4.property.upsert` |
| Configure data streams | ✅ Covered | None | `ga4.datastream.upsert` |
| Set data retention (14, 26, 38, 50 months) | ⚠️ Mentioned | **Missing tool** | `ga4.property.dataRetention.update` |
| Configure data filters (internal traffic, bot filtering) | ❌ **MISSING** | **Critical** | `ga4.dataFilter.list/create/update/delete` |
| Set currency and timezone | ⚠️ Partially | **Missing tool** | `ga4.property.settings.update` |
| Enable Google Signals | ❌ **MISSING** | **Critical** | `ga4.property.googleSignals.update` |
| Configure consent mode | ⚠️ Mentioned | **Missing tool** | `ga4.property.consentMode.update` |

**Gap Analysis:**
- **Data Filters API:** Completely missing. Required for:
  - Internal traffic filtering (IP-based)
  - Bot filtering configuration
  - Data exclusion rules
- **Google Signals:** Missing API endpoint for cross-device tracking
- **Property Settings:** Need granular settings management (currency, timezone, display name)

**Required Tools:**
```typescript
// Data Filters
ga4.dataFilter.list(propertyId)
ga4.dataFilter.get(propertyId, filterId)
ga4.dataFilter.create(propertyId, {name, type, filterExpression})
ga4.dataFilter.update(propertyId, filterId, updates)
ga4.dataFilter.delete(propertyId, filterId)

// Property Settings
ga4.property.settings.get(propertyId)
ga4.property.settings.update(propertyId, {currency, timezone, displayName, industryCategory})

// Google Signals
ga4.property.googleSignals.get(propertyId)
ga4.property.googleSignals.update(propertyId, {state: 'ENABLED'|'DISABLED'})

// Data Retention
ga4.property.dataRetention.get(propertyId)
ga4.property.dataRetention.update(propertyId, {retentionDays: 14|26|38|50})
```

---

## 2. Data Stream Configuration

### 2.1 Enhanced Measurement Events (Lines 54-61)

| Requirement | Current MVP Status | Gap | Required API Endpoint |
|------------|-------------------|-----|---------------------|
| Configure enhanced measurement | ⚠️ Mentioned | **Missing tool** | `ga4.datastream.enhancedMeasurement.update` |
| Enable/disable specific events (scrolls, outbound clicks, site search, video, file downloads) | ❌ **MISSING** | **High Priority** | Enhanced measurement granular control |
| Configure scroll threshold (default 90%) | ❌ **MISSING** | **Medium Priority** | Scroll depth configuration |
| DebugView configuration | ❌ **MISSING** | **Low Priority** | DebugView settings (UI-only feature) |

**Gap Analysis:**
- Enhanced measurement is mentioned but no granular control tool exists
- Need per-event enable/disable capability
- Scroll threshold configuration missing

**Required Tools:**
```typescript
ga4.datastream.enhancedMeasurement.get(propertyId, streamId)
ga4.datastream.enhancedMeasurement.update(propertyId, streamId, {
  scrollsEnabled: boolean,
  scrollsThresholdPercent: number,
  outboundClicksEnabled: boolean,
  siteSearchEnabled: boolean,
  videoEngagementEnabled: boolean,
  fileDownloadsEnabled: boolean,
  pageChangesEnabled: boolean,
  formInteractionsEnabled: boolean
})
```

---

## 3. Event Tracking & Custom Events

### 3.1 Event Parameter Management (Lines 182-201)

| Requirement | Current MVP Status | Gap | Required API Endpoint |
|------------|-------------------|-----|---------------------|
| Create custom events | ✅ Covered | None | `ga4.event.upsert` |
| Define event parameters | ⚠️ Partial | **Missing granular control** | Event parameter schema management |
| Modify event parameters | ❌ **MISSING** | **High Priority** | `ga4.event.parameter.update` |
| Event parameter validation | ❌ **MISSING** | **Medium Priority** | Parameter type/format validation |

**Gap Analysis:**
- Event creation exists but parameter management is limited
- Need ability to modify parameters of existing events
- Parameter validation and schema enforcement missing

**Required Tools:**
```typescript
ga4.event.parameter.list(propertyId, eventName)
ga4.event.parameter.upsert(propertyId, eventName, {
  parameterName: string,
  parameterType: 'STRING'|'INTEGER'|'DOUBLE'|'BOOLEAN',
  required: boolean,
  description: string
})
ga4.event.parameter.delete(propertyId, eventName, parameterName)
```

---

## 4. Custom Dimensions & Metrics

### 4.1 Item-Scoped Dimensions (Lines 203-250)

| Requirement | Current MVP Status | Gap | Required API Endpoint |
|------------|-------------------|-----|---------------------|
| User-scoped dimensions | ✅ Covered | None | `ga4.customDimension.upsert` |
| Event-scoped dimensions | ✅ Covered | None | `ga4.customDimension.upsert` |
| **Item-scoped dimensions** | ❌ **MISSING** | **High Priority** | Item scope support |
| Custom metric types (Standard, Currency, Time) | ⚠️ Partial | **Missing currency/time types** | Enhanced metric type support |

**Gap Analysis:**
- Item-scoped dimensions not explicitly supported
- Custom metric types need expansion (currency, time units)

**Required Enhancement:**
```typescript
// Already exists but needs item scope support
ga4.customDimension.upsert(propertyId, {
  dimensionName: string,
  scope: 'USER'|'EVENT'|'ITEM', // ITEM scope missing
  displayName: string,
  description: string
})

// Metric types enhancement
ga4.customMetric.upsert(propertyId, {
  metricName: string,
  scope: 'EVENT',
  displayName: string,
  measurementUnit: 'STANDARD'|'CURRENCY'|'FEET'|'METERS'|'KILOMETERS'|'MILES'|'MILLISECONDS'|'SECONDS'|'MINUTES'|'HOURS',
  type: 'INTEGER'|'FLOAT'|'SECONDS'|'MILLISECONDS'|'CURRENCY'|'FEET'|'METERS'
})
```

---

## 5. Explorations & Reporting

### 5.1 Exploration Types (Lines 252-290)

| Requirement | Current MVP Status | Gap | Required API Endpoint |
|------------|-------------------|-----|---------------------|
| Free Form exploration | ⚠️ Partial | **UI-only feature** | Data API covers queries |
| Funnel Exploration | ❌ **MISSING** | **Medium Priority** | Funnel analysis queries |
| Path Exploration | ❌ **MISSING** | **Medium Priority** | Path analysis queries |
| Segment Overlap | ❌ **MISSING** | **Medium Priority** | Segment comparison queries |
| User Explorer | ❌ **MISSING** | **Low Priority** | User-level queries (privacy concerns) |

**Gap Analysis:**
- Explorations are primarily UI features, but underlying data queries can be automated
- Funnel and path analysis require specialized query patterns
- User Explorer has privacy/API limitations

**Required Tools:**
```typescript
// Funnel Analysis
ga4.exploration.funnel(propertyId, {
  steps: Array<{eventName: string, name: string}>,
  dateRange: DateRange,
  segments?: Segment[]
})

// Path Analysis
ga4.exploration.path(propertyId, {
  startEvent?: string,
  endEvent?: string,
  dateRange: DateRange,
  maxPathLength?: number
})

// Segment Overlap
ga4.exploration.segmentOverlap(propertyId, {
  segments: Segment[],
  dateRange: DateRange,
  metrics: Metric[]
})
```

**Note:** These can be implemented using Data API with specialized query builders, not requiring separate API endpoints.

---

## 6. Audiences & Audience Triggers

### 6.1 Audience Creation (Lines 313-336)

| Requirement | Current MVP Status | Gap | Required API Endpoint |
|------------|-------------------|-----|---------------------|
| Create custom audiences | ✅ Covered | None | `ga4.audience.upsert` |
| Audience triggers (automatic updates) | ❌ **MISSING** | **High Priority** | Audience trigger configuration |
| Predefined audiences | ⚠️ Partial | **Missing list/management** | Predefined audience catalog |
| Smart audiences (ML-powered) | ❌ **MISSING** | **Medium Priority** | Smart audience configuration |

**Gap Analysis:**
- Audience creation exists but trigger management missing
- Need ability to configure automatic audience updates
- Smart audience configuration not exposed

**Required Tools:**
```typescript
ga4.audience.trigger.get(propertyId, audienceId)
ga4.audience.trigger.update(propertyId, audienceId, {
  triggerType: 'AUTOMATIC'|'MANUAL',
  refreshInterval?: 'DAILY'|'WEEKLY'|'MONTHLY'
})

ga4.audience.smart.create(propertyId, {
  name: string,
  description: string,
  targetAudience: string, // Source audience for lookalike
  lookalikeSize: 'SMALL'|'MEDIUM'|'LARGE'
})
```

---

## 7. Integrations

### 7.1 Google Ads Integration (Lines 339-360)

| Requirement | Current MVP Status | Gap | Required API Endpoint |
|------------|-------------------|-----|---------------------|
| Link Google Ads to GA4 | ❌ **MISSING** | **Critical** | `ga4.integration.ads.link` |
| Import site metrics | ❌ **MISSING** | **High Priority** | Link configuration |
| Import cost data | ❌ **MISSING** | **High Priority** | Link configuration |
| Import conversions | ❌ **MISSING** | **High Priority** | Conversion import settings |
| Conversion import mapping | ❌ **MISSING** | **High Priority** | Conversion mapping configuration |

**Gap Analysis:**
- **CRITICAL GAP:** Google Ads linking completely missing
- This is essential for cross-product workflows
- Conversion import settings not exposed

**Required Tools:**
```typescript
// Google Ads Linking
ga4.integration.ads.list(propertyId)
ga4.integration.ads.get(propertyId, linkId)
ga4.integration.ads.create(propertyId, {
  adsAccountId: string,
  adsCustomerId: string,
  importSiteMetrics: boolean,
  importCostData: boolean,
  importConversions: boolean
})
ga4.integration.ads.update(propertyId, linkId, updates)
ga4.integration.ads.delete(propertyId, linkId)

// Conversion Import
ga4.integration.ads.conversionImport.list(propertyId, linkId)
ga4.integration.ads.conversionImport.create(propertyId, linkId, {
  ga4EventName: string,
  adsConversionActionId: string,
  conversionWindow: number, // days
  valueMapping?: {ga4Parameter: string, adsField: string}
})
```

### 7.2 BigQuery Integration (Lines 361-377)

| Requirement | Current MVP Status | Gap | Required API Endpoint |
|------------|-------------------|-----|---------------------|
| Enable BigQuery export | ❌ **MISSING** | **High Priority** | `ga4.integration.bigquery.link` |
| Configure daily export | ❌ **MISSING** | **High Priority** | Export schedule configuration |
| Configure streaming export | ❌ **MISSING** | **High Priority** | Streaming configuration |
| Set export location | ❌ **MISSING** | **Medium Priority** | Region configuration |

**Gap Analysis:**
- BigQuery linking completely missing
- Essential for data warehousing and advanced analytics
- Export configuration not exposed

**Required Tools:**
```typescript
ga4.integration.bigquery.list(propertyId)
ga4.integration.bigquery.get(propertyId, linkId)
ga4.integration.bigquery.create(propertyId, {
  bigqueryProjectId: string,
  bigqueryDatasetId: string,
  dailyExportEnabled: boolean,
  streamingExportEnabled: boolean,
  location: string // e.g., 'US', 'EU'
})
ga4.integration.bigquery.update(propertyId, linkId, updates)
ga4.integration.bigquery.delete(propertyId, linkId)
```

---

## 8. Google Tag Manager Integration

### 8.1 GTM Configuration (Lines 379-406)

| Requirement | Current MVP Status | Gap | Required API Endpoint |
|------------|-------------------|-----|---------------------|
| GA4 Configuration tag setup | ✅ Covered (via GTM API) | None | `gtm.tag.upsert` (GA4 Config) |
| GA4 Event tag setup | ✅ Covered (via GTM API) | None | `gtm.tag.upsert` (GA4 Event) |
| Custom parameter mapping | ✅ Covered | None | Tag parameter configuration |
| Field mapping (user_id, custom_map) | ✅ Covered | None | Tag fields configuration |

**Gap Analysis:**
- GTM integration is well covered via GTM API
- No additional GA4-specific endpoints needed
- ✅ **No gaps identified**

---

## 9. API & Automation

### 9.1 Admin API Operations (Lines 475-509)

| Requirement | Current MVP Status | Gap | Required API Endpoint |
|------------|-------------------|-----|---------------------|
| Custom dimension management | ✅ Covered | None | `ga4.customDimension.*` |
| Custom metric management | ✅ Covered | None | `ga4.customMetric.*` |
| Property management | ✅ Covered | None | `ga4.property.*` |
| Data stream management | ✅ Covered | None | `ga4.datastream.*` |

**Gap Analysis:**
- Core Admin API operations are covered
- ✅ **No gaps identified**

### 9.2 Automation Use Cases (Lines 511-532)

| Use Case | Current MVP Status | Gap | Required Capabilities |
|----------|-------------------|-----|---------------------|
| Daily performance reports | ✅ Covered | None | `ga4.report.run` |
| Audience refresh | ⚠️ Partial | **Missing trigger automation** | Audience trigger management |
| Conversion optimization | ⚠️ Partial | **Missing path analysis** | Funnel/path exploration queries |
| Bid strategy updates | ✅ Covered (via Ads API) | None | `ads.biddingStrategy.*` |

**Gap Analysis:**
- Most automation use cases can be supported
- Audience refresh needs trigger automation
- Conversion optimization needs exploration query support

---

## 10. Critical Missing Features Summary

### 10.1 Critical Priority (Must Have)

1. **Data Filters API** - Internal traffic, bot filtering
2. **Google Ads Linking** - Cross-product integration
3. **BigQuery Linking** - Data export configuration
4. **Google Signals** - Cross-device tracking
5. **Property Settings** - Currency, timezone, display name
6. **Data Retention Settings** - Retention period configuration

### 10.2 High Priority (Should Have)

1. **Enhanced Measurement Configuration** - Granular event control
2. **Event Parameter Management** - Parameter CRUD operations
3. **Audience Triggers** - Automatic audience updates
4. **Conversion Import Mapping** - GA4 → Ads conversion linking
5. **Item-Scoped Dimensions** - E-commerce dimension support

### 10.3 Medium Priority (Nice to Have)

1. **Funnel Exploration Queries** - Funnel analysis automation
2. **Path Exploration Queries** - User journey analysis
3. **Segment Overlap Queries** - Audience comparison
4. **Smart Audiences** - ML-powered audience creation
5. **Custom Metric Types** - Currency, time units

### 10.4 Low Priority (Future)

1. **User Explorer Queries** - Privacy-limited user-level data
2. **DebugView Configuration** - Development tooling
3. **Exploration UI Features** - Visual interface elements

---

## 11. Required API Endpoints Matrix

### GA4 Admin API v1beta - Missing Endpoints

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `properties/{property}/dataFilters` | GET, POST, PATCH, DELETE | Data filter management | **Critical** |
| `properties/{property}/googleSignalsSettings` | GET, PATCH | Google Signals configuration | **Critical** |
| `properties/{property}/dataRetentionSettings` | GET, PATCH | Data retention configuration | **Critical** |
| `properties/{property}` | PATCH | Property settings (currency, timezone) | **Critical** |
| `properties/{property}/dataStreams/{stream}/enhancedMeasurementSettings` | GET, PATCH | Enhanced measurement config | **High** |
| `properties/{property}/googleAdsLinks` | GET, POST, PATCH, DELETE | Google Ads integration | **Critical** |
| `properties/{property}/bigQueryLinks` | GET, POST, PATCH, DELETE | BigQuery integration | **High** |
| `properties/{property}/audiences/{audience}/trigger` | GET, PATCH | Audience trigger config | **High** |
| `properties/{property}/events/{event}/parameters` | GET, POST, PATCH, DELETE | Event parameter management | **High** |

---

## 12. Implementation Recommendations

### Phase 1: Critical Gaps (Sprint 1-2)

1. **Data Filters API**
   - Internal traffic filter creation
   - Bot filtering configuration
   - Filter expression builder

2. **Google Ads Linking**
   - Link creation/management
   - Conversion import configuration
   - Cost data import settings

3. **Property Settings**
   - Currency/timezone management
   - Display name updates
   - Industry category

4. **Google Signals**
   - Enable/disable cross-device tracking
   - Consent state management

5. **Data Retention**
   - Retention period configuration
   - Event data retention settings

### Phase 2: High Priority (Sprint 3-4)

1. **Enhanced Measurement**
   - Granular event enable/disable
   - Scroll threshold configuration
   - Per-event settings

2. **Event Parameters**
   - Parameter CRUD operations
   - Parameter validation
   - Schema enforcement

3. **BigQuery Linking**
   - Export configuration
   - Streaming setup
   - Region selection

4. **Audience Triggers**
   - Automatic refresh configuration
   - Trigger scheduling

### Phase 3: Medium Priority (Post-MVP)

1. **Exploration Queries**
   - Funnel analysis builders
   - Path exploration queries
   - Segment overlap analysis

2. **Smart Audiences**
   - ML-powered audience creation
   - Lookalike audience configuration

---

## 13. Tool Surface Additions Required

### New GA4 Tools Needed

```typescript
// Data Filters
ga4.dataFilter.list(propertyId)
ga4.dataFilter.create(propertyId, {name, type, filterExpression})
ga4.dataFilter.update(propertyId, filterId, updates)
ga4.dataFilter.delete(propertyId, filterId)

// Property Settings
ga4.property.settings.get(propertyId)
ga4.property.settings.update(propertyId, {currency, timezone, displayName})

// Google Signals
ga4.property.googleSignals.get(propertyId)
ga4.property.googleSignals.update(propertyId, {state})

// Data Retention
ga4.property.dataRetention.get(propertyId)
ga4.property.dataRetention.update(propertyId, {retentionDays})

// Enhanced Measurement
ga4.datastream.enhancedMeasurement.get(propertyId, streamId)
ga4.datastream.enhancedMeasurement.update(propertyId, streamId, config)

// Integrations
ga4.integration.ads.list(propertyId)
ga4.integration.ads.create(propertyId, config)
ga4.integration.ads.update(propertyId, linkId, updates)
ga4.integration.ads.conversionImport.create(propertyId, linkId, config)

ga4.integration.bigquery.list(propertyId)
ga4.integration.bigquery.create(propertyId, config)
ga4.integration.bigquery.update(propertyId, linkId, updates)

// Event Parameters
ga4.event.parameter.list(propertyId, eventName)
ga4.event.parameter.upsert(propertyId, eventName, parameterConfig)

// Audience Triggers
ga4.audience.trigger.get(propertyId, audienceId)
ga4.audience.trigger.update(propertyId, audienceId, config)
```

**Total New Tools Required: ~25 additional tools**

---

## 14. Automation Workflow Coverage

### Can Be Fully Automated ✅

- Property creation and configuration
- Data stream setup
- Custom dimension/metric creation
- Event tracking setup
- Conversion configuration
- Audience creation
- GTM tag/trigger/variable management
- Google Ads campaign management
- Conversion action setup

### Partially Automated ⚠️

- Explorations (queries can be automated, UI cannot)
- Audience refresh (needs trigger automation)
- Conversion optimization (needs exploration queries)
- Data quality monitoring (needs alerting system)

### Cannot Be Automated ❌

- DebugView (UI-only feature)
- Visual exploration interfaces
- Manual data review processes

---

## 15. Conclusion

The current MVP plan covers **~70% of required capabilities** for full automation of GA4 Master Guide operations. The **critical gaps** are:

1. **Data Filters** - Essential for data quality
2. **Google Ads & BigQuery Linking** - Critical for integrations
3. **Property Settings Management** - Required for proper configuration
4. **Enhanced Measurement Granular Control** - Needed for precise tracking setup

With the addition of **~25 new tools** covering these gaps, the MCP will support **95%+ automation** of all operations described in the GA4 Master Guide, enabling fully automated Google Marketing Engineering via Cursor IDE AI chat.

**Next Steps:**
1. Update MVP plan with missing tools
2. Prioritize critical gaps for Sprint 1-2
3. Design API integration patterns for new endpoints
4. Create test scenarios for each new capability
