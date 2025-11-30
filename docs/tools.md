# Tools Documentation

This document provides comprehensive documentation for all MCP tools exposed by the server.

## GA4 Tools

### Data API

- `ga4.report.run` - Standard report queries
- `ga4.report.batch` - Batch multiple report requests
- `ga4.report.pivot` - Pivot table reports
- `ga4.realtime.snapshot` - Real-time data snapshot

### Admin API - Properties

- `ga4.property.list` - List properties
- `ga4.property.get` - Get property details
- `ga4.property.upsert` - Create/update property
- `ga4.property.settings.get/update` - Property settings
- `ga4.property.googleSignals.get/update` - Google Signals configuration
- `ga4.property.dataRetention.get/update` - Data retention settings
- `ga4.property.consentMode.get/update` - Consent mode settings

### Admin API - Data Streams

- `ga4.datastream.list` - List data streams
- `ga4.datastream.upsert` - Create/update data stream
- `ga4.datastream.delete` - Delete data stream
- `ga4.datastream.enhancedMeasurement.get/update` - Enhanced measurement configuration

### Admin API - Custom Definitions

- `ga4.customDimension.*` - Custom dimensions (list, get, upsert, delete)
- `ga4.customMetric.*` - Custom metrics (list, get, upsert, delete)

### Admin API - Events & Conversions

- `ga4.event.*` - Event definitions (list, get, upsert)
- `ga4.event.parameter.*` - Event parameters (list, upsert, delete)
- `ga4.conversion.*` - Conversion events (list, get, upsert, delete)

### Admin API - Audiences & Attribution

- `ga4.audience.*` - Audiences (list, get, upsert, delete)
- `ga4.audience.trigger.*` - Audience trigger configuration
- `ga4.audience.smart.create` - Create ML-powered smart audience
- `ga4.attribution.get/update` - Attribution settings

### Measurement Protocol

- `ga4.measurement.send` - Send events via Measurement Protocol
- `ga4.measurement.validate` - Validate events before sending

### Integrations

- `ga4.integration.ads.*` - Google Ads linking
- `ga4.integration.bigquery.*` - BigQuery linking

### Explorations

- `ga4.exploration.funnel` - Funnel exploration query builder
- `ga4.exploration.path` - Path exploration query builder
- `ga4.exploration.segmentOverlap` - Segment overlap analysis

## GTM Tools

### Containers & Workspaces

- `gtm.container.*` - Containers (list, get, upsert)
- `gtm.workspace.*` - Workspaces (list, get, create, merge)

### Tags

- `gtm.tag.*` - Tags (list, get, upsert, delete)

### Triggers

- `gtm.trigger.*` - Triggers (list, get, upsert, delete)

### Variables

- `gtm.variable.*` - Variables (list, get, upsert, delete)
- `gtm.builtinVariable.*` - Built-in variables (list, enable)

### Data Layer

- `gtm.datalayer.validate` - Validate data layer structure
- `gtm.datalayer.schema` - Generate data layer schema
- `gtm.datalayer.monitor` - Monitor data layer events

### Versions & Publishing

- `gtm.version.*` - Container versions (list, get, create, restore)
- `gtm.workspace.publish` - Publish workspace
- `gtm.preview.create` - Create preview environment

### Folders

- `gtm.folder.*` - Folders (list, upsert, move)

## Google Ads Tools

### Reporting

- `ads.report.gaql` - Execute GAQL query
- `ads.report.batch` - Batch GAQL queries
- `ads.report.stream` - Stream large result sets

### Campaigns & Ad Groups

- `ads.campaign.*` - Campaigns (list, get, upsert, pause)
- `ads.adgroup.*` - Ad groups (list, get, upsert)

### Ads & Keywords

- `ads.ad.*` - Ads (list, upsert)
- `ads.keyword.*` - Keywords (list, upsert, delete)
- `ads.negativeKeyword.*` - Negative keywords (list, upsert)

### Conversions

- `ads.conversion.*` - Conversion actions (list, get, upsert, delete)
- `ads.conversion.offlineImport` - Import offline conversions
- `ads.conversion.enhanced` - Configure enhanced conversions

### Audiences

- `ads.audience.*` - Audiences (list, upsert, attach)

### Budgets & Bidding

- `ads.budget.*` - Budgets (list, upsert)
- `ads.biddingStrategy.*` - Bidding strategies (list, upsert)

## Core/Utility Tools

- `auth.login` - Authenticate with Google services
- `auth.rotate` - Rotate authentication tokens
- `auth.status` - Check authentication status
- `capabilities.refresh` - Refresh capability registry
- `capabilities.get` - Get current capabilities
- `core.healthcheck` - Health check
- `core.version` - Get server version
- `core.dryRun` - Enable/disable dry-run mode

## Tool Usage Examples

Examples will be added as tools are implemented. See `src/docs/examples/` for example MCP prompts and workflows.

