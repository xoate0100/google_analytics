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

## GA4 Admin API Tools

### Properties

#### `ga4.property.list`

List all GA4 properties accessible to the authenticated account.

**Parameters:**
```json
{
  "parent": "accounts/123456"
}
```

**Returns:**
```json
{
  "properties": [
    {
      "name": "properties/987654",
      "displayName": "My Property",
      "timeZone": "America/New_York",
      "currencyCode": "USD"
    }
  ]
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: List all GA4 properties for an account
- **Required Args**: `parent` (account path)
- **Safety Checks**: Account ID validation, Admin API capability check
- **Canonical Example**: `ga4.property.list({ parent: "accounts/123456" })`

---

#### `ga4.property.get`

Get details for a specific GA4 property.

**Parameters:**
```json
{
  "name": "properties/987654"
}
```

**Returns:**
```json
{
  "name": "properties/987654",
  "displayName": "My Property",
  "timeZone": "America/New_York",
  "currencyCode": "USD",
  "createTime": "2024-01-01T00:00:00Z"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Get detailed information about a GA4 property
- **Required Args**: `name` (property path)
- **Safety Checks**: Property ID validation, Admin API capability check
- **Canonical Example**: `ga4.property.get({ name: "properties/987654" })`

---

#### `ga4.property.upsert`

Create or update a GA4 property.

**Parameters:**
```json
{
  "parent": "accounts/123456",
  "displayName": "My Property",
  "timeZone": "America/New_York",
  "currencyCode": "USD",
  "propertyId": "987654" // optional, for updates
}
```

**Returns:**
```json
{
  "name": "properties/987654",
  "displayName": "My Property",
  "timeZone": "America/New_York",
  "currencyCode": "USD"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Create a new GA4 property or update an existing one
- **Required Args**: `parent`, `displayName`, `timeZone`, `currencyCode`
- **Safety Checks**: Account ID validation, timezone validation, currency code validation, Admin API capability check
- **Canonical Example**: `ga4.property.upsert({ parent: "accounts/123456", displayName: "My Property", timeZone: "America/New_York", currencyCode: "USD" })`

---

#### `ga4.property.delete`

Delete a GA4 property.

**Parameters:**
```json
{
  "name": "properties/987654"
}
```

**Returns:**
```json
{
  "success": true,
  "name": "properties/987654"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Delete a GA4 property (use with caution)
- **Required Args**: `name` (property path)
- **Safety Checks**: Property ID validation, Admin API capability check, rollback support
- **Canonical Example**: `ga4.property.delete({ name: "properties/987654" })`

---

### Data Streams

#### `ga4.datastream.list`

List all data streams for a GA4 property.

**Parameters:**
```json
{
  "parent": "properties/987654"
}
```

**Returns:**
```json
{
  "dataStreams": [
    {
      "name": "properties/987654/dataStreams/111111",
      "displayName": "Web Stream",
      "type": "WEB_DATA_STREAM",
      "webStreamData": {
        "measurementId": "G-XXXXXXXXXX",
        "defaultUri": "https://example.com"
      }
    }
  ]
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: List all data streams (WEB, IOS, ANDROID) for a property
- **Required Args**: `parent` (property path)
- **Safety Checks**: Property ID validation, Admin API capability check
- **Canonical Example**: `ga4.datastream.list({ parent: "properties/987654" })`

---

#### `ga4.datastream.get`

Get details for a specific data stream.

**Parameters:**
```json
{
  "name": "properties/987654/dataStreams/111111"
}
```

**Returns:**
```json
{
  "name": "properties/987654/dataStreams/111111",
  "displayName": "Web Stream",
  "type": "WEB_DATA_STREAM",
  "webStreamData": {
    "measurementId": "G-XXXXXXXXXX",
    "defaultUri": "https://example.com"
  }
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Get detailed information about a data stream
- **Required Args**: `name` (data stream path)
- **Safety Checks**: Data stream path validation, Admin API capability check
- **Canonical Example**: `ga4.datastream.get({ name: "properties/987654/dataStreams/111111" })`

---

#### `ga4.datastream.upsert`

Create or update a data stream.

**Parameters:**
```json
{
  "parent": "properties/987654",
  "displayName": "Web Stream",
  "type": "WEB_DATA_STREAM",
  "webStreamData": {
    "defaultUri": "https://example.com"
  },
  "dataStreamId": "111111" // optional, for updates
}
```

**Returns:**
```json
{
  "name": "properties/987654/dataStreams/111111",
  "displayName": "Web Stream",
  "type": "WEB_DATA_STREAM"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Create or update a data stream (WEB, IOS, or ANDROID)
- **Required Args**: `parent`, `displayName`, `type`
- **Safety Checks**: Property ID validation, data stream type validation, Admin API capability check
- **Canonical Example**: `ga4.datastream.upsert({ parent: "properties/987654", displayName: "Web Stream", type: "WEB_DATA_STREAM", webStreamData: { defaultUri: "https://example.com" } })`

---

#### `ga4.datastream.delete`

Delete a data stream.

**Parameters:**
```json
{
  "name": "properties/987654/dataStreams/111111"
}
```

**Returns:**
```json
{
  "success": true,
  "name": "properties/987654/dataStreams/111111"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Delete a data stream (use with caution)
- **Required Args**: `name` (data stream path)
- **Safety Checks**: Data stream path validation, Admin API capability check, rollback support
- **Canonical Example**: `ga4.datastream.delete({ name: "properties/987654/dataStreams/111111" })`

---

#### `ga4.datastream.enhancedMeasurement.get`

Get enhanced measurement settings for a web data stream.

**Parameters:**
```json
{
  "name": "properties/987654/dataStreams/111111"
}
```

**Returns:**
```json
{
  "name": "properties/987654/dataStreams/111111/enhancedMeasurementSettings",
  "streamEnabled": true,
  "scrollsEnabled": true,
  "outboundClicksEnabled": true,
  "siteSearchEnabled": true,
  "videoEngagementEnabled": true,
  "fileDownloadsEnabled": true,
  "pageChangesEnabled": true,
  "formInteractionsEnabled": true
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Get enhanced measurement configuration for a web data stream
- **Required Args**: `name` (data stream path)
- **Safety Checks**: Data stream path validation, Admin API capability check
- **Canonical Example**: `ga4.datastream.enhancedMeasurement.get({ name: "properties/987654/dataStreams/111111" })`

---

#### `ga4.datastream.enhancedMeasurement.update`

Update enhanced measurement settings for a web data stream.

**Parameters:**
```json
{
  "name": "properties/987654/dataStreams/111111",
  "streamEnabled": true,
  "scrollsEnabled": true,
  "outboundClicksEnabled": true,
  "siteSearchEnabled": true,
  "videoEngagementEnabled": true,
  "fileDownloadsEnabled": true,
  "pageChangesEnabled": true,
  "formInteractionsEnabled": true
}
```

**Returns:**
```json
{
  "name": "properties/987654/dataStreams/111111/enhancedMeasurementSettings",
  "streamEnabled": true,
  "scrollsEnabled": true
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Configure enhanced measurement settings (scrolls, clicks, video, etc.)
- **Required Args**: `name`, at least one setting field
- **Safety Checks**: Data stream path validation, Admin API capability check
- **Canonical Example**: `ga4.datastream.enhancedMeasurement.update({ name: "properties/987654/dataStreams/111111", scrollsEnabled: true, outboundClicksEnabled: true })`

---

### Custom Dimensions

#### `ga4.customDimension.list`

List all custom dimensions for a property.

**Parameters:**
```json
{
  "parent": "properties/987654"
}
```

**Returns:**
```json
{
  "customDimensions": [
    {
      "name": "properties/987654/customDimensions/222222",
      "parameterName": "user_type",
      "displayName": "User Type",
      "description": "Type of user",
      "scope": "USER",
      "disallowAdsPersonalization": false
    }
  ]
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: List all custom dimensions (USER, EVENT, ITEM scopes)
- **Required Args**: `parent` (property path)
- **Safety Checks**: Property ID validation, Admin API capability check
- **Canonical Example**: `ga4.customDimension.list({ parent: "properties/987654" })`

---

#### `ga4.customDimension.get`

Get details for a specific custom dimension.

**Parameters:**
```json
{
  "name": "properties/987654/customDimensions/222222"
}
```

**Returns:**
```json
{
  "name": "properties/987654/customDimensions/222222",
  "parameterName": "user_type",
  "displayName": "User Type",
  "scope": "USER"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Get detailed information about a custom dimension
- **Required Args**: `name` (custom dimension path)
- **Safety Checks**: Custom dimension path validation, Admin API capability check
- **Canonical Example**: `ga4.customDimension.get({ name: "properties/987654/customDimensions/222222" })`

---

#### `ga4.customDimension.upsert`

Create or update a custom dimension.

**Parameters:**
```json
{
  "parent": "properties/987654",
  "parameterName": "user_type",
  "displayName": "User Type",
  "description": "Type of user",
  "scope": "USER",
  "disallowAdsPersonalization": false,
  "customDimensionId": "222222" // optional, for updates
}
```

**Returns:**
```json
{
  "name": "properties/987654/customDimensions/222222",
  "parameterName": "user_type",
  "displayName": "User Type",
  "scope": "USER"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Create or update a custom dimension (supports USER, EVENT, ITEM scopes)
- **Required Args**: `parent`, `parameterName`, `displayName`, `scope`
- **Safety Checks**: Property ID validation, scope validation, Admin API capability check, idempotency via dimension name
- **Canonical Example**: `ga4.customDimension.upsert({ parent: "properties/987654", parameterName: "user_type", displayName: "User Type", scope: "USER" })`

---

#### `ga4.customDimension.delete`

Delete a custom dimension.

**Parameters:**
```json
{
  "name": "properties/987654/customDimensions/222222"
}
```

**Returns:**
```json
{
  "success": true,
  "name": "properties/987654/customDimensions/222222"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Delete a custom dimension (use with caution)
- **Required Args**: `name` (custom dimension path)
- **Safety Checks**: Custom dimension path validation, Admin API capability check, rollback support
- **Canonical Example**: `ga4.customDimension.delete({ name: "properties/987654/customDimensions/222222" })`

---

### Custom Metrics

#### `ga4.customMetric.list`

List all custom metrics for a property.

**Parameters:**
```json
{
  "parent": "properties/987654"
}
```

**Returns:**
```json
{
  "customMetrics": [
    {
      "name": "properties/987654/customMetrics/333333",
      "parameterName": "engagement_score",
      "displayName": "Engagement Score",
      "measurementUnit": "STANDARD",
      "type": "INTEGER"
    }
  ]
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: List all custom metrics with currency/time units
- **Required Args**: `parent` (property path)
- **Safety Checks**: Property ID validation, Admin API capability check
- **Canonical Example**: `ga4.customMetric.list({ parent: "properties/987654" })`

---

#### `ga4.customMetric.get`

Get details for a specific custom metric.

**Parameters:**
```json
{
  "name": "properties/987654/customMetrics/333333"
}
```

**Returns:**
```json
{
  "name": "properties/987654/customMetrics/333333",
  "parameterName": "engagement_score",
  "displayName": "Engagement Score",
  "measurementUnit": "STANDARD",
  "type": "INTEGER"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Get detailed information about a custom metric
- **Required Args**: `name` (custom metric path)
- **Safety Checks**: Custom metric path validation, Admin API capability check
- **Canonical Example**: `ga4.customMetric.get({ name: "properties/987654/customMetrics/333333" })`

---

#### `ga4.customMetric.upsert`

Create or update a custom metric.

**Parameters:**
```json
{
  "parent": "properties/987654",
  "parameterName": "engagement_score",
  "displayName": "Engagement Score",
  "measurementUnit": "STANDARD",
  "type": "INTEGER",
  "customMetricId": "333333" // optional, for updates
}
```

**Returns:**
```json
{
  "name": "properties/987654/customMetrics/333333",
  "parameterName": "engagement_score",
  "displayName": "Engagement Score",
  "measurementUnit": "STANDARD",
  "type": "INTEGER"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Create or update a custom metric (supports currency/time units: STANDARD, CURRENCY, FEET, METERS, etc.)
- **Required Args**: `parent`, `parameterName`, `displayName`, `measurementUnit`, `type`
- **Safety Checks**: Property ID validation, type validation (INTEGER, FLOAT, SECONDS, etc.), Admin API capability check
- **Canonical Example**: `ga4.customMetric.upsert({ parent: "properties/987654", parameterName: "engagement_score", displayName: "Engagement Score", measurementUnit: "STANDARD", type: "INTEGER" })`

---

#### `ga4.customMetric.delete`

Delete a custom metric.

**Parameters:**
```json
{
  "name": "properties/987654/customMetrics/333333"
}
```

**Returns:**
```json
{
  "success": true,
  "name": "properties/987654/customMetrics/333333"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Delete a custom metric (use with caution)
- **Required Args**: `name` (custom metric path)
- **Safety Checks**: Custom metric path validation, Admin API capability check, rollback support
- **Canonical Example**: `ga4.customMetric.delete({ name: "properties/987654/customMetrics/333333" })`

---

### Events

#### `ga4.event.list`

List all event definitions for a property.

**Parameters:**
```json
{
  "parent": "properties/987654"
}
```

**Returns:**
```json
{
  "events": [
    {
      "name": "properties/987654/eventCreateRules/444444",
      "eventName": "purchase",
      "displayName": "Purchase",
      "description": "Purchase event"
    }
  ]
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: List all custom event definitions
- **Required Args**: `parent` (property path)
- **Safety Checks**: Property ID validation, Admin API capability check
- **Canonical Example**: `ga4.event.list({ parent: "properties/987654" })`

---

#### `ga4.event.get`

Get details for a specific event definition.

**Parameters:**
```json
{
  "name": "properties/987654/eventCreateRules/444444"
}
```

**Returns:**
```json
{
  "name": "properties/987654/eventCreateRules/444444",
  "eventName": "purchase",
  "displayName": "Purchase",
  "description": "Purchase event"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Get detailed information about an event definition
- **Required Args**: `name` (event path)
- **Safety Checks**: Event path validation, Admin API capability check
- **Canonical Example**: `ga4.event.get({ name: "properties/987654/eventCreateRules/444444" })`

---

#### `ga4.event.upsert`

Create or update an event definition.

**Parameters:**
```json
{
  "parent": "properties/987654",
  "eventName": "purchase",
  "displayName": "Purchase",
  "description": "Purchase event",
  "eventId": "444444" // optional, for updates
}
```

**Returns:**
```json
{
  "name": "properties/987654/eventCreateRules/444444",
  "eventName": "purchase",
  "displayName": "Purchase"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Create or update a custom event definition with parameters
- **Required Args**: `parent`, `eventName`, `displayName`
- **Safety Checks**: Property ID validation, event name conflict check, Admin API capability check
- **Canonical Example**: `ga4.event.upsert({ parent: "properties/987654", eventName: "purchase", displayName: "Purchase" })`

---

#### `ga4.event.parameter.list`

List event parameters for an event.

**Parameters:**
```json
{
  "parent": "properties/987654/eventCreateRules/444444"
}
```

**Returns:**
```json
{
  "eventParameters": []
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: List parameters for an event (note: API limitations may apply)
- **Required Args**: `parent` (event path)
- **Safety Checks**: Event path validation, Admin API capability check
- **Canonical Example**: `ga4.event.parameter.list({ parent: "properties/987654/eventCreateRules/444444" })`

**Note:** Event parameters have limited API support. Some operations may not be directly available via the Admin API.

---

### Conversions

#### `ga4.conversion.list`

List all conversions for a property.

**Parameters:**
```json
{
  "parent": "properties/987654"
}
```

**Returns:**
```json
{
  "conversions": [
    {
      "name": "properties/987654/conversions/555555",
      "eventName": "purchase",
      "countingMethod": "ONCE_PER_EVENT",
      "valueSettings": {
        "valueType": "FIXED_VALUE",
        "currencyCode": "USD"
      }
    }
  ]
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: List all conversions with counting methods and value settings
- **Required Args**: `parent` (property path)
- **Safety Checks**: Property ID validation, Admin API capability check
- **Canonical Example**: `ga4.conversion.list({ parent: "properties/987654" })`

---

#### `ga4.conversion.get`

Get details for a specific conversion.

**Parameters:**
```json
{
  "name": "properties/987654/conversions/555555"
}
```

**Returns:**
```json
{
  "name": "properties/987654/conversions/555555",
  "eventName": "purchase",
  "countingMethod": "ONCE_PER_EVENT",
  "valueSettings": {
    "valueType": "FIXED_VALUE",
    "currencyCode": "USD"
  }
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Get detailed information about a conversion
- **Required Args**: `name` (conversion path)
- **Safety Checks**: Conversion path validation, Admin API capability check
- **Canonical Example**: `ga4.conversion.get({ name: "properties/987654/conversions/555555" })`

---

#### `ga4.conversion.upsert`

Create or update a conversion.

**Parameters:**
```json
{
  "parent": "properties/987654",
  "eventName": "purchase",
  "countingMethod": "ONCE_PER_EVENT",
  "valueSettings": {
    "valueType": "FIXED_VALUE",
    "currencyCode": "USD"
  },
  "conversionId": "555555" // optional, for updates
}
```

**Returns:**
```json
{
  "name": "properties/987654/conversions/555555",
  "eventName": "purchase",
  "countingMethod": "ONCE_PER_EVENT"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Create or update a conversion with counting methods, value settings, and attribution settings
- **Required Args**: `parent`, `eventName`, `countingMethod`
- **Safety Checks**: Property ID validation, counting method validation, Admin API capability check, idempotency via event name
- **Canonical Example**: `ga4.conversion.upsert({ parent: "properties/987654", eventName: "purchase", countingMethod: "ONCE_PER_EVENT", valueSettings: { valueType: "FIXED_VALUE", currencyCode: "USD" } })`

---

#### `ga4.conversion.delete`

Delete a conversion.

**Parameters:**
```json
{
  "name": "properties/987654/conversions/555555"
}
```

**Returns:**
```json
{
  "success": true,
  "name": "properties/987654/conversions/555555"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Delete a conversion (use with caution)
- **Required Args**: `name` (conversion path)
- **Safety Checks**: Conversion path validation, Admin API capability check, rollback support
- **Canonical Example**: `ga4.conversion.delete({ name: "properties/987654/conversions/555555" })`

---

### Audiences

#### `ga4.audience.list`

List all audiences for a property.

**Parameters:**
```json
{
  "parent": "properties/987654"
}
```

**Returns:**
```json
{
  "audiences": [
    {
      "name": "properties/987654/audiences/666666",
      "displayName": "High Value Users",
      "description": "Users with high engagement",
      "membershipDurationDays": 30
    }
  ]
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: List all audiences with definitions and filters
- **Required Args**: `parent` (property path)
- **Safety Checks**: Property ID validation, Admin API capability check
- **Canonical Example**: `ga4.audience.list({ parent: "properties/987654" })`

---

#### `ga4.audience.get`

Get details for a specific audience.

**Parameters:**
```json
{
  "name": "properties/987654/audiences/666666"
}
```

**Returns:**
```json
{
  "name": "properties/987654/audiences/666666",
  "displayName": "High Value Users",
  "description": "Users with high engagement",
  "membershipDurationDays": 30
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Get detailed information about an audience
- **Required Args**: `name` (audience path)
- **Safety Checks**: Audience path validation, Admin API capability check
- **Canonical Example**: `ga4.audience.get({ name: "properties/987654/audiences/666666" })`

---

#### `ga4.audience.upsert`

Create or update an audience.

**Parameters:**
```json
{
  "parent": "properties/987654",
  "displayName": "High Value Users",
  "description": "Users with high engagement",
  "membershipDurationDays": 30,
  "audienceId": "666666" // optional, for updates
}
```

**Returns:**
```json
{
  "name": "properties/987654/audiences/666666",
  "displayName": "High Value Users",
  "membershipDurationDays": 30
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Create or update an audience with definitions, filters, and trigger configuration
- **Required Args**: `parent`, `displayName`, `membershipDurationDays`
- **Safety Checks**: Property ID validation, audience definition validation, Admin API capability check
- **Canonical Example**: `ga4.audience.upsert({ parent: "properties/987654", displayName: "High Value Users", membershipDurationDays: 30 })`

---

#### `ga4.audience.delete`

Delete an audience.

**Parameters:**
```json
{
  "name": "properties/987654/audiences/666666"
}
```

**Returns:**
```json
{
  "success": true,
  "name": "properties/987654/audiences/666666"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Delete an audience (use with caution)
- **Required Args**: `name` (audience path)
- **Safety Checks**: Audience path validation, Admin API capability check, rollback support
- **Canonical Example**: `ga4.audience.delete({ name: "properties/987654/audiences/666666" })`

---

### Attribution

#### `ga4.attribution.get`

Get attribution settings for a property.

**Parameters:**
```json
{
  "name": "properties/987654"
}
```

**Returns:**
```json
{
  "name": "properties/987654/attributionSettings",
  "acquisitionConversionEventLookbackWindow": "ACQUISITION_CONVERSION_EVENT_LOOKBACK_WINDOW_7_DAYS",
  "otherConversionEventLookbackWindow": "OTHER_CONVERSION_EVENT_LOOKBACK_WINDOW_30_DAYS",
  "reportingAttributionModel": "CROSS_CHANNEL_DATA_DRIVEN"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Get attribution model configuration for a property
- **Required Args**: `name` (property path)
- **Safety Checks**: Property ID validation, Admin API capability check
- **Canonical Example**: `ga4.attribution.get({ name: "properties/987654" })`

---

#### `ga4.attribution.update`

Update attribution settings for a property.

**Parameters:**
```json
{
  "name": "properties/987654",
  "acquisitionConversionEventLookbackWindow": "ACQUISITION_CONVERSION_EVENT_LOOKBACK_WINDOW_7_DAYS",
  "otherConversionEventLookbackWindow": "OTHER_CONVERSION_EVENT_LOOKBACK_WINDOW_30_DAYS",
  "reportingAttributionModel": "CROSS_CHANNEL_DATA_DRIVEN"
}
```

**Returns:**
```json
{
  "name": "properties/987654/attributionSettings",
  "reportingAttributionModel": "CROSS_CHANNEL_DATA_DRIVEN"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Update attribution models and lookback windows
- **Required Args**: `name`, at least one attribution setting
- **Safety Checks**: Property ID validation, attribution model validation, Admin API capability check
- **Canonical Example**: `ga4.attribution.update({ name: "properties/987654", reportingAttributionModel: "CROSS_CHANNEL_DATA_DRIVEN" })`

---

### Integrations

#### `ga4.integration.ads.list`

List all Google Ads links for a property.

**Parameters:**
```json
{
  "parent": "properties/987654"
}
```

**Returns:**
```json
{
  "googleAdsLinks": [
    {
      "name": "properties/987654/googleAdsLinks/777777",
      "customerId": "123-456-7890",
      "canManageClients": true
    }
  ]
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: List all Google Ads integration links
- **Required Args**: `parent` (property path)
- **Safety Checks**: Property ID validation, Admin API capability check
- **Canonical Example**: `ga4.integration.ads.list({ parent: "properties/987654" })`

---

#### `ga4.integration.ads.get`

Get details for a specific Google Ads link.

**Parameters:**
```json
{
  "name": "properties/987654/googleAdsLinks/777777"
}
```

**Returns:**
```json
{
  "name": "properties/987654/googleAdsLinks/777777",
  "customerId": "123-456-7890",
  "canManageClients": true
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Get detailed information about a Google Ads link
- **Required Args**: `name` (Google Ads link path)
- **Safety Checks**: Google Ads link path validation, Admin API capability check
- **Canonical Example**: `ga4.integration.ads.get({ name: "properties/987654/googleAdsLinks/777777" })`

---

#### `ga4.integration.ads.create`

Create a new Google Ads link.

**Parameters:**
```json
{
  "parent": "properties/987654",
  "customerId": "123-456-7890",
  "canManageClients": true
}
```

**Returns:**
```json
{
  "name": "properties/987654/googleAdsLinks/777777",
  "customerId": "123-456-7890",
  "canManageClients": true
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Create a Google Ads integration link with conversion import mapping
- **Required Args**: `parent`, `customerId`
- **Safety Checks**: Property ID validation, customer ID validation, Admin API capability check
- **Canonical Example**: `ga4.integration.ads.create({ parent: "properties/987654", customerId: "123-456-7890" })`

---

#### `ga4.integration.ads.update`

Update an existing Google Ads link.

**Parameters:**
```json
{
  "name": "properties/987654/googleAdsLinks/777777",
  "canManageClients": false
}
```

**Returns:**
```json
{
  "name": "properties/987654/googleAdsLinks/777777",
  "customerId": "123-456-7890",
  "canManageClients": false
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Update Google Ads link configuration
- **Required Args**: `name`, at least one update field
- **Safety Checks**: Google Ads link path validation, Admin API capability check
- **Canonical Example**: `ga4.integration.ads.update({ name: "properties/987654/googleAdsLinks/777777", canManageClients: false })`

---

#### `ga4.integration.ads.delete`

Delete a Google Ads link.

**Parameters:**
```json
{
  "name": "properties/987654/googleAdsLinks/777777"
}
```

**Returns:**
```json
{
  "success": true,
  "name": "properties/987654/googleAdsLinks/777777"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Delete a Google Ads integration link
- **Required Args**: `name` (Google Ads link path)
- **Safety Checks**: Google Ads link path validation, Admin API capability check, rollback support
- **Canonical Example**: `ga4.integration.ads.delete({ name: "properties/987654/googleAdsLinks/777777" })`

---

#### `ga4.integration.bigquery.list`

List all BigQuery links for a property.

**Parameters:**
```json
{
  "parent": "properties/987654"
}
```

**Returns:**
```json
{
  "bigQueryLinks": [
    {
      "name": "properties/987654/bigqueryLinks/888888",
      "projectId": "my-project",
      "dailyExportEnabled": true,
      "streamingExportEnabled": true
    }
  ]
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: List all BigQuery integration links
- **Required Args**: `parent` (property path)
- **Safety Checks**: Property ID validation, Admin API capability check
- **Canonical Example**: `ga4.integration.bigquery.list({ parent: "properties/987654" })`

---

#### `ga4.integration.bigquery.get`

Get details for a specific BigQuery link.

**Parameters:**
```json
{
  "name": "properties/987654/bigqueryLinks/888888"
}
```

**Returns:**
```json
{
  "name": "properties/987654/bigqueryLinks/888888",
  "projectId": "my-project",
  "dailyExportEnabled": true,
  "streamingExportEnabled": true
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Get detailed information about a BigQuery link
- **Required Args**: `name` (BigQuery link path)
- **Safety Checks**: BigQuery link path validation, Admin API capability check
- **Canonical Example**: `ga4.integration.bigquery.get({ name: "properties/987654/bigqueryLinks/888888" })`

---

#### `ga4.integration.bigquery.create`

Create a new BigQuery link.

**Parameters:**
```json
{
  "parent": "properties/987654",
  "projectId": "my-project",
  "dailyExportEnabled": true,
  "streamingExportEnabled": true
}
```

**Returns:**
```json
{
  "name": "properties/987654/bigqueryLinks/888888",
  "projectId": "my-project",
  "dailyExportEnabled": true,
  "streamingExportEnabled": true
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Create a BigQuery integration link with export configuration
- **Required Args**: `parent`, `projectId`
- **Safety Checks**: Property ID validation, project ID validation, Admin API capability check, rollback support
- **Canonical Example**: `ga4.integration.bigquery.create({ parent: "properties/987654", projectId: "my-project", dailyExportEnabled: true })`

---

#### `ga4.integration.bigquery.delete`

Delete a BigQuery link.

**Parameters:**
```json
{
  "name": "properties/987654/bigqueryLinks/888888"
}
```

**Returns:**
```json
{
  "success": true,
  "name": "properties/987654/bigqueryLinks/888888"
}
```

**Status:** ✅ Implemented (Sprint 2)

**For AI Agents:**
- **Intent**: Delete a BigQuery integration link
- **Required Args**: `name` (BigQuery link path)
- **Safety Checks**: BigQuery link path validation, Admin API capability check, rollback support
- **Canonical Example**: `ga4.integration.bigquery.delete({ name: "properties/987654/bigqueryLinks/888888" })`

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
