# Tools Documentation

This document provides comprehensive documentation for all MCP tools exposed by the server.

## Core/Utility Tools

### Authentication

#### `auth.login`

Authenticate with Google services using OAuth device flow.

**Parameters:** None

**Returns:**
```json
{
  "message": "Authentication flow not yet implemented"
}
```

**Status:** Stub implementation (Sprint 1)

**For AI Agents:**
- **Intent**: Initiate OAuth 2.0 device flow authentication
- **Required Args**: None
- **Safety Checks**: None (stub)
- **Canonical Example**: `auth.login()`

---

#### `auth.rotate`

Rotate authentication tokens.

**Parameters:** None

**Returns:**
```json
{
  "message": "Token rotation not yet implemented"
}
```

**Status:** Stub implementation (Sprint 1)

**For AI Agents:**
- **Intent**: Rotate OAuth refresh tokens for security
- **Required Args**: None
- **Safety Checks**: None (stub)
- **Canonical Example**: `auth.rotate()`

---

#### `auth.status`

Check authentication status and token information.

**Parameters:** None

**Returns:**
```json
{
  "authenticated": true,
  "products": ["ga4", "gtm", "ads"]
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Check if user is authenticated and which products have tokens
- **Required Args**: None
- **Safety Checks**: None
- **Canonical Example**: `auth.status()`

---

### Capabilities

#### `capabilities.refresh`

Refresh capability registry by running discovery routines.

**Parameters:** None

**Returns:**
```json
{
  "message": "Capabilities refreshed"
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Discover available API capabilities for all products
- **Required Args**: None
- **Safety Checks**: None
- **Canonical Example**: `capabilities.refresh()`

---

#### `capabilities.get`

Get current capabilities for a product or all products.

**Parameters:**
```json
{
  "product": "ga4" // optional, omit for all products
}
```

**Returns:**
```json
{
  "ga4": {
    "data_api": true,
    "admin_api": true,
    "measurement_protocol": true
  }
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Check if a specific capability is available before using a tool
- **Required Args**: None (product is optional)
- **Safety Checks**: None
- **Canonical Example**: `capabilities.get({ product: "ga4" })`

---

### Core Utilities

#### `core.healthcheck`

Health check endpoint.

**Parameters:** None

**Returns:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Status:** ✅ Implemented (Sprint 1)

---

#### `core.version`

Get server version information.

**Parameters:** None

**Returns:**
```json
{
  "name": "mcp-google-marketing",
  "version": "0.1.0"
}
```

**Status:** ✅ Implemented (Sprint 1)

---

#### `core.dryRun`

Enable/disable dry-run mode.

**Parameters:**
```json
{
  "enabled": true
}
```

**Returns:**
```json
{
  "dryRun": true
}
```

**Status:** ✅ Implemented (Sprint 1)

---

## GA4 Tools

### Data API

#### `ga4.report.run`

Run a standard GA4 report query.

**Parameters:**
```json
{
  "property": "properties/123456789",
  "dateRanges": [
    {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    }
  ],
  "dimensions": [
    { "name": "country" },
    { "name": "city" }
  ],
  "metrics": [
    { "name": "sessions" },
    { "name": "activeUsers" }
  ]
}
```

**Returns:**
```json
{
  "rows": [
    {
      "dimensionValues": [
        { "value": "United States" },
        { "value": "New York" }
      ],
      "metricValues": [
        { "value": "1000" },
        { "value": "800" }
      ]
    }
  ],
  "rowCount": 1
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Query GA4 data for dimensions and metrics over a date range
- **Required Args**: `property`, `dateRanges`, `dimensions`, `metrics`
- **Safety Checks**: Property ID validation, date range validation, dimension/metric compatibility
- **Canonical Example**: See parameters above

---

#### `ga4.report.batch`

Batch multiple report requests.

**Parameters:**
```json
{
  "property": "properties/123456789",
  "requests": [
    {
      "dateRanges": [{"startDate": "2024-01-01", "endDate": "2024-01-31"}],
      "dimensions": [{"name": "country"}],
      "metrics": [{"name": "sessions"}]
    }
  ]
}
```

**Returns:**
```json
{
  "reports": [
    {
      "rows": [],
      "rowCount": 0
    }
  ]
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Execute multiple report queries in a single API call
- **Required Args**: `property`, `requests` (array of report requests)
- **Safety Checks**: Same as `ga4.report.run` for each request
- **Canonical Example**: See parameters above

---

#### `ga4.report.pivot`

Run a pivot table report.

**Parameters:**
```json
{
  "property": "properties/123456789",
  "dateRanges": [
    {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    }
  ],
  "pivots": [
    {
      "fieldNames": ["country"],
      "metrics": [{"name": "sessions"}]
    }
  ],
  "metrics": [{"name": "activeUsers"}]
}
```

**Returns:**
```json
{
  "rows": [],
  "rowCount": 0
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Create pivot table reports with grouped dimensions
- **Required Args**: `property`, `dateRanges`, `pivots`, `metrics`
- **Safety Checks**: Pivot field validation, metric compatibility
- **Canonical Example**: See parameters above

---

#### `ga4.realtime.snapshot`

Get real-time data snapshot.

**Parameters:**
```json
{
  "property": "properties/123456789",
  "dimensions": [{"name": "country"}],
  "metrics": [{"name": "activeUsers"}]
}
```

**Returns:**
```json
{
  "rows": [],
  "rowCount": 0
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Get current real-time data (last 30 minutes)
- **Required Args**: `property`, `dimensions`, `metrics`
- **Safety Checks**: Real-time dimension/metric compatibility
- **Canonical Example**: See parameters above

---

### Measurement Protocol

#### `ga4.measurement.send`

Send events via GA4 Measurement Protocol.

**Parameters:**
```json
{
  "measurementId": "G-XXXXXXXXXX",
  "apiSecret": "your-api-secret",
  "events": [
    {
      "name": "purchase",
      "params": {
        "value": 99.99,
        "currency": "USD"
      }
    }
  ],
  "clientId": "1234567890.1234567890"
}
```

**Returns:**
```json
{
  "success": true
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Send server-side events to GA4
- **Required Args**: `measurementId`, `apiSecret`, `events`, `clientId` or `userId`
- **Safety Checks**: Event name validation, parameter validation, API secret validation
- **Canonical Example**: See parameters above

---

#### `ga4.measurement.validate`

Validate events before sending via Measurement Protocol.

**Parameters:**
```json
{
  "measurementId": "G-XXXXXXXXXX",
  "apiSecret": "your-api-secret",
  "events": [
    {
      "name": "purchase",
      "params": {
        "value": 99.99,
        "currency": "USD"
      }
    }
  ],
  "clientId": "1234567890.1234567890"
}
```

**Returns:**
```json
{
  "validationMessages": []
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Validate event structure before sending
- **Required Args**: Same as `ga4.measurement.send`
- **Safety Checks**: Event validation, parameter validation
- **Canonical Example**: See parameters above

---

### Admin API - Property Settings

#### `ga4.property.settings.get`

Get property settings.

**Parameters:**
```json
{
  "property": "properties/123456789"
}
```

**Returns:**
```json
{
  "name": "properties/123456789",
  "displayName": "My Property",
  "currencyCode": "USD",
  "timeZone": "America/New_York",
  "industryCategory": "RETAIL"
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Retrieve property configuration settings
- **Required Args**: `property`
- **Safety Checks**: Property ID validation, Admin API capability check
- **Canonical Example**: `ga4.property.settings.get({ property: "properties/123456789" })`

---

#### `ga4.property.settings.update`

Update property settings.

**Parameters:**
```json
{
  "property": "properties/123456789",
  "displayName": "Updated Property Name",
  "currencyCode": "EUR",
  "timeZone": "Europe/London",
  "industryCategory": "TRAVEL"
}
```

**Returns:**
```json
{
  "name": "properties/123456789",
  "displayName": "Updated Property Name",
  "currencyCode": "EUR",
  "timeZone": "Europe/London",
  "industryCategory": "TRAVEL"
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Update property configuration
- **Required Args**: `property`, at least one update field
- **Safety Checks**: Property ID validation, Admin API capability check, field validation
- **Canonical Example**: See parameters above

---

### Admin API - Google Signals

#### `ga4.property.googleSignals.get`

Get Google Signals settings.

**Parameters:**
```json
{
  "property": "properties/123456789"
}
```

**Returns:**
```json
{
  "name": "properties/123456789/googleSignalsSettings",
  "state": "GOOGLE_SIGNALS_ENABLED"
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Check Google Signals (remarketing) status
- **Required Args**: `property`
- **Safety Checks**: Property ID validation, Admin API capability check
- **Canonical Example**: `ga4.property.googleSignals.get({ property: "properties/123456789" })`

---

#### `ga4.property.googleSignals.update`

Update Google Signals settings.

**Parameters:**
```json
{
  "property": "properties/123456789",
  "state": "GOOGLE_SIGNALS_ENABLED"
}
```

**Returns:**
```json
{
  "name": "properties/123456789/googleSignalsSettings",
  "state": "GOOGLE_SIGNALS_ENABLED"
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Enable/disable Google Signals for remarketing
- **Required Args**: `property`, `state`
- **Safety Checks**: Property ID validation, Admin API capability check, state validation
- **Canonical Example**: See parameters above

---

### Admin API - Data Retention

#### `ga4.property.dataRetention.get`

Get data retention settings.

**Parameters:**
```json
{
  "property": "properties/123456789"
}
```

**Returns:**
```json
{
  "name": "properties/123456789/dataRetentionSettings",
  "retentionDays": "RETENTION_14_MONTHS",
  "eventDataRetention": "EVENT_DATA_RETENTION_14_MONTHS"
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Check data retention configuration
- **Required Args**: `property`
- **Safety Checks**: Property ID validation, Admin API capability check
- **Canonical Example**: `ga4.property.dataRetention.get({ property: "properties/123456789" })`

---

#### `ga4.property.dataRetention.update`

Update data retention settings.

**Parameters:**
```json
{
  "property": "properties/123456789",
  "retentionDays": "RETENTION_26_MONTHS",
  "eventDataRetention": "EVENT_DATA_RETENTION_26_MONTHS"
}
```

**Returns:**
```json
{
  "name": "properties/123456789/dataRetentionSettings",
  "retentionDays": "RETENTION_26_MONTHS",
  "eventDataRetention": "EVENT_DATA_RETENTION_26_MONTHS"
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Configure data retention periods
- **Required Args**: `property`, `retentionDays`
- **Safety Checks**: Property ID validation, Admin API capability check, retention period validation
- **Canonical Example**: See parameters above

---

### Admin API - Data Filters

#### `ga4.dataFilter.list`

List data filters for a GA4 property.

**Parameters:**
```json
{
  "property": "properties/123456789",
  "pageSize": 50,
  "pageToken": "optional-page-token"
}
```

**Returns:**
```json
{
  "dataFilters": [
    {
      "name": "properties/123456789/dataFilters/987654321",
      "displayName": "Internal Traffic Filter",
      "filterType": "INTERNAL_TRAFFIC",
      "dataFilterResult": "ACTIVE"
    }
  ],
  "nextPageToken": "optional-next-page-token"
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: List all data filters (internal traffic, bot filters, exclusions)
- **Required Args**: `property`
- **Safety Checks**: Property ID validation, Admin API capability check
- **Canonical Example**: `ga4.dataFilter.list({ property: "properties/123456789" })`

---

#### `ga4.dataFilter.get`

Get details of a specific data filter.

**Parameters:**
```json
{
  "property": "properties/123456789",
  "filterId": "dataFilters/987654321"
}
```

**Returns:**
```json
{
  "name": "properties/123456789/dataFilters/987654321",
  "displayName": "Internal Traffic Filter",
  "filterType": "INTERNAL_TRAFFIC",
  "filterExpression": {
    "andGroup": {
      "expressions": [
        {
          "dimensionFilter": {
            "dimension": "ipAddress",
            "stringFilter": {
              "matchType": "EXACT",
              "value": "192.168.1.1"
            }
          }
        }
      ]
    }
  },
  "dataFilterResult": "ACTIVE",
  "applyTo": "ALL_EVENTS"
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Retrieve specific data filter configuration
- **Required Args**: `property`, `filterId`
- **Safety Checks**: Property ID validation, filter ID validation, Admin API capability check
- **Canonical Example**: See parameters above

---

#### `ga4.dataFilter.create`

Create a new data filter.

**Parameters:**
```json
{
  "property": "properties/123456789",
  "name": "Internal Traffic Filter",
  "filterType": "INTERNAL_TRAFFIC",
  "filterExpression": {
    "dimensionFilter": {
      "dimension": "ipAddress",
      "stringFilter": {
        "matchType": "EXACT",
        "value": "192.168.1.1"
      }
    }
  },
  "applyTo": "ALL_EVENTS"
}
```

**Returns:**
```json
{
  "name": "properties/123456789/dataFilters/987654321",
  "displayName": "Internal Traffic Filter",
  "filterType": "INTERNAL_TRAFFIC",
  "dataFilterResult": "ACTIVE"
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Create internal traffic filters, bot filters, or exclusion rules
- **Required Args**: `property`, `name`, `filterType`
- **Safety Checks**: Property ID validation, filter type validation, filter expression validation, Admin API capability check
- **Canonical Example**: See parameters above

---

#### `ga4.dataFilter.update`

Update an existing data filter.

**Parameters:**
```json
{
  "property": "properties/123456789",
  "filterId": "dataFilters/987654321",
  "name": "Updated Filter Name",
  "filterExpression": {
    "dimensionFilter": {
      "dimension": "ipAddress",
      "stringFilter": {
        "matchType": "EXACT",
        "value": "10.0.0.1"
      }
    }
  }
}
```

**Returns:**
```json
{
  "name": "properties/123456789/dataFilters/987654321",
  "displayName": "Updated Filter Name",
  "filterType": "INTERNAL_TRAFFIC",
  "dataFilterResult": "ACTIVE"
}
```

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Modify existing data filter configuration
- **Required Args**: `property`, `filterId`, at least one update field
- **Safety Checks**: Property ID validation, filter ID validation, Admin API capability check
- **Canonical Example**: See parameters above

---

#### `ga4.dataFilter.delete`

Delete a data filter.

**Parameters:**
```json
{
  "property": "properties/123456789",
  "filterId": "dataFilters/987654321"
}
```

**Returns:** Empty response (void)

**Status:** ✅ Implemented (Sprint 1)

**For AI Agents:**
- **Intent**: Remove a data filter from a property
- **Required Args**: `property`, `filterId`
- **Safety Checks**: Property ID validation, filter ID validation, Admin API capability check
- **Canonical Example**: `ga4.dataFilter.delete({ property: "properties/123456789", filterId: "dataFilters/987654321" })`

---

## GTM Tools

GTM tools are planned for future sprints. See roadmap for implementation timeline.

## Google Ads Tools

Google Ads tools are planned for future sprints. See roadmap for implementation timeline.

---

## Error Handling

All tools follow a consistent error model. See [Error Catalog](errors.md) for details.

Common error types:
- `AuthError`: Authentication/authorization issues
- `QuotaError`: Rate limiting or quota exhaustion
- `PreconditionError`: Pre-conditions not met (e.g., capability not available)
- `ValidationError`: Input validation failures
- `TransportError`: Network/transport issues
- `ServerError`: Server-side errors (5xx)

Each error includes:
- Error type and reason
- Remediation hints
- Context information

---

## Rate Limiting

All tools respect rate limits:
- GA4 Data API: 100 QPS, 10 burst
- GA4 Admin API: 50 QPS, 5 burst
- Measurement Protocol: 20 QPS, 5 burst

Rate limiting is handled automatically with token bucket algorithm and adaptive backoff.

---

## Caching

Read operations are cached with TTL:
- Report queries: 5 minutes
- Property settings: 5 minutes
- Data filters: 5 minutes

Cache is automatically invalidated on write operations.

---

## Idempotency

Write operations support idempotency keys to prevent duplicate operations. See operation envelope documentation for details.

---

## Tool Usage Examples

See `src/docs/examples/` for example MCP prompts and workflows (to be added).
