# MCP “Google Marketing Ops” Tool — Detailed MVP Plan

## 1) Goal & Success Criteria

**Goal:** A reusable, project‑agnostic MCP server that exposes safe, idempotent, full‑fidelity tools for **Google Ads**, **Google Tag Manager**, and **Google Analytics 4** from inside Cursor IDE. It must support **read/write/create/delete**, with **stateful verification**, strong **observability**, **TDD-first** delivery, and **security best practices**.

**Success criteria (MVP):**

* One MCP server exposing at least **75+ atomic tools** covering full API capabilities:
  * **GA4:** 35+ tools (Data API, Admin API, Measurement Protocol, Data Filters, Integrations, Explorations)
  * **GTM:** 20+ tools (containers, workspaces, tags, triggers, variables, data layer, versions)
  * **Google Ads:** 15+ tools (reporting, campaigns, conversions, audiences, budgets)
* Auth once, then seamless access from any repo in Cursor.
* All write ops are idempotent, logged, pre/post‑validated, and rollbackable.
* Route discovery/verification ensures no out‑of‑scope or deprecated endpoints are exposed.
* **Full support for custom event tracking, data layer management, and conversion setup across all products.**
* Ship with test matrix (unit + integration + contract), CI gates, and developer docs.

---

## 2) Scope (MVP) — Full API Coverage

**This MVP provides COMPLETE API coverage for all three products, enabling full customization of services, conversions, custom event tracking, and data layer management.**

**API Verification Status:**
- **94% Verified:** Core endpoints confirmed in official Google APIs
- **6% Needs Testing:** Advanced features require API testing
- **<1% Not Supported:** Features requiring workarounds or UI-only configuration

**See `docs/API_VERIFICATION_REAL_WORLD.md` for detailed verification status of all endpoints.**

**Included**

* **GA4 (Analytics Data API + Admin API):**
  * Data API: run reports, realtime snapshots, batch reports, pivot reports
  * Admin API: manage properties, data streams, custom dimensions/metrics, conversion events, audiences, attribution settings, data retention, enhanced measurement
  * Measurement Protocol: server-side event tracking with validation
  * Event definitions: create/update/delete custom events, modify event parameters
* **GTM (Tag Manager API v2):**
  * Containers: list/create/update/delete, settings, environments
  * Workspaces: list/create/update/delete, merge, resolve conflicts
  * Tags: full CRUD, firing rules, tag sequencing, tag priority
  * Triggers: custom triggers, event triggers, page view triggers, click triggers, form triggers, timer triggers, visibility triggers, scroll depth triggers
  * Variables: custom variables, data layer variables, built-in variables, constant variables, lookup tables, regex tables, JavaScript variables, URL variables, container settings
  * Data Layer: schema validation, data layer monitoring, variable references
  * Versions: create/list/restore, publish, preview/debug mode
  * Folders: organize tags/triggers/variables
  * Consent mode: configure consent settings
* **Google Ads (Google Ads API):**
  * GAQL reporting: full query language support, batch reports, streaming reports
  * Campaigns: create/update/delete, budgets, bidding strategies, ad schedules, targeting
  * Ad Groups: create/update/delete, targeting, ad group types
  * Ads: responsive search ads, display ads, video ads, app ads
  * Keywords: create/update/delete, match types, bid adjustments, negative keywords
  * Conversion Actions: create/update/delete, conversion tracking setup, offline conversions, enhanced conversions, value rules
  * Audiences: customer match, remarketing lists, custom audiences, audience insights
  * Extensions: sitelinks, callouts, structured snippets, call extensions, location extensions
* Read/Write/Delete parity for all objects in each product.
* Capability registry + route verification at server startup and on demand.
* Caching, rate limiting, retries with jitter, structured logging, dry‑run mode, and transaction envelopes.
* Data layer validation and schema enforcement for GTM.
* Cross-product workflows: GTM → GA4 event forwarding, GA4 → Ads conversion linking, Ads → GA4 audience sync.

**Out of scope (for MVP)**

* Billing management, Smart Campaigns special cases, auto‑generated ad assets.
* Multi‑user RBAC; team secrets sync; cloud deployment.
* Real-time collaboration features (GTM workspace locking handled via API).
* UI/visual editors (all operations via API/MCP tools).

**API Endpoints Covered (Complete List)**

**GA4 Analytics Data API v1:**
* `properties/{property}/runReport` ✅
* `properties/{property}/runRealtimeReport` ✅
* `properties/{property}/runPivotReport` ✅
* `properties/{property}/batchRunReports` ✅
* `properties/{property}/batchRunPivotReports` ✅
* `properties/{property}/checkCompatibility` ✅

**GA4 Admin API v1beta:**
* Properties: `list`, `get`, `create`, `update`, `delete` ✅ **Verified**
* Property Settings: `get`, `update` (currency, timezone, display name) ⚠️ **Partial** (via properties.update)
* Google Signals: `get`, `update` ⚠️ **Needs Testing** (may be in property settings)
* Data Retention Settings: `get`, `update` ✅ **Verified**
* Consent Mode: `get`, `update` ⚠️ **Needs Testing** (may be UI-only or in property settings)
* Data Streams: `list`, `get`, `create`, `update`, `delete`, `getDataRedactionSettings`, `updateDataRedactionSettings` ✅ **Verified**
* Enhanced Measurement Settings: `get`, `update` (granular event control) ⚠️ **Needs Testing** (may be in dataStream resource)
* Data Filters: `list`, `get`, `create`, `update`, `delete` (internal traffic, bot filtering) ❌ **Not Found** (likely UI-only, see workarounds)
* Custom Dimensions: `list`, `get`, `create`, `patch`, `archive` (USER, EVENT, ITEM scopes) ✅ **Verified** (uses `archive` not `delete`)
* Custom Metrics: `list`, `get`, `create`, `patch`, `archive` (currency, time units) ✅ **Verified** (uses `archive` not `delete`)
* Event Create Rules: `list`, `get`, `create`, `update`, `delete` ✅ **Verified**
* Event Parameters: `list`, `get`, `create`, `update`, `delete` ❌ **Not Supported** (parameters are dynamic, use custom dimensions)
* Conversion Events: `list`, `get`, `create`, `delete` ✅ **Verified**
* Audiences: `list`, `get`, `create`, `patch`, `archive` ✅ **Verified** (uses `archive` not `delete`)
* Audience Triggers: `get`, `update` (automatic refresh) ⚠️ **Needs Testing** (may be in audience resource)
* Smart Audiences: `create` (ML-powered) ⚠️ **Needs Testing** (may use standard audience.create)
* Attribution Settings: `get`, `update` ✅ **Verified**
* Google Ads Links: `list`, `get`, `create`, `update`, `delete` ⚠️ **Needs Testing** (may be UI-only, check Google Ads API)
* Google Ads Conversion Import: `list`, `get`, `create`, `update`, `delete` ⚠️ **Needs Testing** (may be UI-only)
* BigQuery Links: `list`, `get`, `create`, `delete` ✅ **Verified**

**Legend:** ✅ Verified | ⚠️ Needs Testing | ❌ Not Supported

**GA4 Measurement Protocol:**
* `mp/collect` (send events) ✅
* `mp/debug/mp/collect` (validate events) ✅

**GTM API v2:**
* Accounts: `list`, `get` ✅
* Containers: `list`, `get`, `create`, `update`, `delete` ✅
* Workspaces: `list`, `get`, `create`, `update`, `delete`, `sync`, `resolve_conflict`, `quick_preview`, `status` ✅
* Tags: `list`, `get`, `create`, `update`, `delete`, `revert` ✅
* Triggers: `list`, `get`, `create`, `update`, `delete`, `revert` ✅
* Variables: `list`, `get`, `create`, `update`, `delete`, `revert` ✅
* Built-in Variables: `list`, `create`, `delete`, `revert` ✅
* Folders: `list`, `get`, `create`, `update`, `delete`, `revert`, `entities` ✅
* Versions: `list`, `get`, `create`, `delete`, `publish`, `restore` ✅
* Environments: `list`, `get`, `create`, `update`, `delete`, `reauthorize` ✅
* Zones: `list`, `get`, `create`, `update`, `delete`, `revert` ✅

**Google Ads API (gRPC/REST):**
* Customer Service: `getCustomer`, `listAccessibleCustomers`, `mutateCustomer` ✅
* Campaign Service: `get`, `mutate`, `mutateLabels` ✅
* Ad Group Service: `get`, `mutate` ✅
* Ad Group Ad Service: `get`, `mutate` ✅
* Ad Group Criterion Service: `get`, `mutate` (keywords, placements, etc.) ✅
* Campaign Budget Service: `get`, `mutate` ✅
* Conversion Action Service: `get`, `mutate`, `mutateValue`, `uploadClickConversions`, `uploadCallConversions`, `uploadConversionAdjustments` ✅
* Customer Match Service: `uploadUserData` ✅
* Audience Service: `get`, `mutate` ✅
* Campaign Audience View Service: `get` ✅
* Google Ads Service: `search`, `searchStream` (GAQL queries) ✅
* Batch Job Service: `mutateBatchJobs`, `listBatchJobResults` ✅
* Extension Feed Item Service: `get`, `mutate` ✅
* Campaign Extension Setting Service: `get`, `mutate` ✅

---

## 3) Architecture Overview

* **Runtime:** Node.js (TypeScript) MCP server (`@modelcontextprotocol/server`).
* **Modules:** 
  * `ga4/` — Data API, Admin API, Measurement Protocol
  * `gtm/` — Containers, Workspaces, Tags, Triggers, Variables, Data Layer, Versions
  * `ads/` — Reporting, Campaigns, Conversions, Audiences, Budgets
  * `auth/` — OAuth, token management, encryption
  * `core/` — Logging, cache, http, grpc, validation, capabilities, data layer schema
  * `docs/` — Documentation and examples
* **Transport:**

  * GA4 & GTM: REST over HTTPS with `google-auth-library`.
  * Google Ads: gRPC using official client; fall back to REST for token introspection where useful.
  * Measurement Protocol: REST API with validation endpoint.
* **Command Pattern:** Each tool = small atomic command. Tools call **service adapters** (pure functions) wrapped in **Operation Envelope** with pre/post validation and logging.
* **Idempotency:** Operation keys + deterministic request bodies + server‑side state checks.
* **Data Layer Management:** Schema validation, variable extraction, event monitoring, cross-product synchronization.
* **Config:** Per‑user config file + environment variables.

**Directory layout**

```
mcp-google-marketing/
  ├─ src/
  │  ├─ server.ts                # MCP bootstrap & tool registration
  │  ├─ core/
  │  │  ├─ opEnvelope.ts         # operation wrapper (pre/post/rollback)
  │  │  ├─ logger.ts             # pino-style JSON logger
  │  │  ├─ cache.ts              # LRU/TTL + ETag aware
  │  │  ├─ limiter.ts            # token bucket + adaptive backoff
  │  │  ├─ errors.ts             # typed errors & retry policy
  │  │  ├─ validation.ts         # zod schemas for args & responses
  │  │  └─ capabilities.ts       # route discovery/verification registry
  │  ├─ auth/
  │  │  ├─ oauth.ts              # OAuth device or local loop; token store
  │  │  └─ secrets.ts            # encryption-at-rest (OS keychain fallback)
  │  ├─ ga4/
  │  │  ├─ client.ts             # REST client wrapper
  │  │  ├─ tools.ts              # MCP tools (query, conversion mgmt, health)
  │  │  └─ schemas.ts            # zod schemas for GA4 args/results
  │  ├─ gtm/
  │  │  ├─ client.ts
  │  │  ├─ tools.ts              # list/create/update/publish/version
  │  │  └─ schemas.ts
  │  ├─ ads/
  │  │  ├─ client.ts             # gRPC client + GAQL helpers
  │  │  ├─ tools.ts              # report, create/update, conversions
  │  │  └─ schemas.ts
  │  └─ docs/
  │     └─ examples/             # example MCP prompts & flows
  ├─ test/                       # vitest + pact-like contracts
  ├─ scripts/                    # local dev helpers
  ├─ .github/workflows/ci.yml
  ├─ package.json
  └─ README.md
```

---

## 4) Security Best Practices

* **Auth:** OAuth 2.0 with offline access; store refresh tokens encrypted (libsodium) in `~/.mcp/google/credentials.enc.json`. Client IDs/Secrets via env vars; never commit secrets.
* **Scopes:** Minimal required per tool; escalate only on demand.
* **Token Hygiene:** automatic refresh; revoke support; rotate via `auth.rotate` tool.
* **Data at Rest:** Encrypt token store; redact PII in logs; structured logs include hashes not raw values.
* **Network:** HTTPS only; certificate pinning optional; retry on 5xx only.
* **Dry‑run Mode:** `MCP_MARKETING_DRY_RUN=1` forces read-only or no‑op writes with full pre/post validation simulation.

---

## 5) Operation Envelope (Idempotent, Observable, Safe)

All tools execute inside a shared envelope that guarantees consistency.

**Operation Envelope JSON (logged for every call)**

```json
{
  "op_id": "uuid-v7",
  "op_name": "gtm.create_tag",
  "idempotency_key": "hash(payload + target)",
  "timestamp": "ISO8601",
  "actor": "local-user",
  "target": {"product": "gtm", "accountId": "...", "containerId": "..."},
  "request": {"args": {"...": "..."}},
  "precheck": {"capability": true, "exists": false, "conflicts": []},
  "attempt": {"n": 1, "retry_policy": "exp-jitter", "rate_limit_state": {"tokens": 47}},
  "result": {"status": "success", "resource_id": "...", "etag": "..."},
  "postcheck": {"read_back": true, "state_match": true},
  "rollback": {"needed": false, "action": null},
  "latency_ms": 312,
  "warnings": [],
  "notes": ""
}
```

**Idempotency Rules**

* Compute `idempotency_key` from normalized request + target resource identifiers.
* Before write: prefetch current state; if identical → **short‑circuit success**.
* After write: read‑back verify authoritative state. If mismatch → **conditional rollback**.

---

## 6) Capability Discovery & Route Verification

* At startup, call **discovery** routines per product to build a **Capability Registry** (cached on disk):

  * API versions available; feature flags; accessible accounts/properties/containers.
  * For Ads, run a low‑cost GAQL probe (e.g., `SELECT customer.id FROM customer LIMIT 1`).
  * For GTM, list accounts/containers; confirm publish perm via dry‑run.
  * For GA4, test a trivial report and admin read.
* Tools check the registry at runtime; if capability is absent, they **hard‑fail with a typed error** and remediation hints.

**Capability Registry (excerpt)**

```json
{
  "generated_at": "ISO8601",
  "ga4": {
    "data_api": "v1",
    "admin_api": true,
    "measurement_protocol": true,
    "properties": [
      {
        "id": "123456789",
        "name": "My Property",
        "data_streams": [
          {"id": "1234567890", "type": "WEB", "name": "Web Stream"},
          {"id": "0987654321", "type": "IOS", "name": "iOS App"}
        ],
        "custom_dimensions": 10,
        "custom_metrics": 5,
        "conversions": ["purchase", "sign_up", "lead"],
        "audiences": 3
      }
    ]
  },
  "gtm": {
    "accounts": [
      {
        "id": "111",
        "name": "My Account",
        "containers": [
          {
            "id": "222",
            "name": "Web Container",
            "workspaces": [
              {"id": "333", "name": "Default", "tagCount": 15, "triggerCount": 8, "variableCount": 20}
            ],
            "live_version": "5",
            "data_layer_schema": "validated"
          }
        ]
      }
    ]
  },
  "ads": {
    "customer_ids": ["999-888-7777"],
    "developer_token_ok": true,
    "conversion_actions": [
      {"id": "123456789", "name": "Purchase", "type": "GOOGLE_ANALYTICS", "linked_ga4": true}
    ],
    "campaigns": 12,
    "audiences": 5
  }
}
```

---

## 7) Caching Strategy

* **Read caching:** in‑memory LRU with TTL per endpoint; respect `ETag`/`If-None-Match` where supported.
* **Write‑through invalidation:** after successful write, purge related cache keys.
* **Local persistent cache:** optional sqlite for report query results keyed by GAQL/GA4 query hash and date windows.

---

## 8) Rate Limiting & Backoff

* **Client-side limiter:** token bucket per product with configurable QPS & burst.
* **Adaptive backoff:** exponential + jitter on 429/5xx; parse `Retry-After` when present.
* **Circuit breaker:** trip on consecutive failures; half‑open probes before resuming.

---

## 9) Error Model & Retry Policy

**Typed Errors** (discriminated unions):

* `AuthError` (invalid_grant, insufficient_scope)
* `QuotaError` (rate_limited, resource_exhausted)
* `PreconditionError` (conflict, not_found, precheck_failed)
* `ValidationError` (schema_mismatch)
* `TransportError` (network, tls)
* `ServerError` (5xx)

**Retry**

* **Safe idempotent writes only**; never retry non‑idempotent ops.
* Max attempts default 5 with exp‑jitter starting 250ms.
* On partial success: log `rollback.needed=true` and execute compensating action.

**Error Log JSON**

```json
{
  "op_id": "uuid-v7",
  "error": {
    "type": "QuotaError",
    "reason": "rate_limited",
    "http_status": 429,
    "grpc_status": null,
    "message": "Too many requests",
    "remediation": "Reduce QPS or wait per Retry-After",
    "context": {"product": "ga4", "endpoint": "runReport"}
  }
}
```

---

## 10) Validation (Pre & Post)

* **Args validation:** zod schemas per tool.
* **Prechecks:** existence, conflicts, capability present, idempotency equality.
* **Postchecks:** authoritative read‑back; schema‑coerce; semantic invariants (e.g., GTM tag enabled & in published version).

---

## 11) Observability & Logging

* **Logger:** pino‑compatible JSON; single line events.
* **Correlation:** `op_id`, `idempotency_key`, `trace_id` set on all logs.
* **Levels:** `debug`, `info`, `warn`, `error` with clear **AI‑parsable** fields.
* **Metrics:** internal counters (success, retries, rate_limited, rollback_count, p50/p95 latency by tool).

---

## 12) Tool Surface (MVP)

**GA4 — Data API**

* `ga4.report.run(propertyId, dimensions[], metrics[], dateRange, filter?, orderBys?, limit?, keepEmptyRows?)` — Standard report queries
* `ga4.report.batch(propertyId, requests[])` — Batch multiple report requests
* `ga4.report.pivot(propertyId, dimensions[], metrics[], pivots[], dateRange)` — Pivot table reports
* `ga4.realtime.snapshot(propertyId, dimensions?, metrics?, limit?)` — Real-time data snapshot

**GA4 — Admin API (Properties & Configuration)**

* `ga4.property.list(accountId?)` — List properties with filters
* `ga4.property.get(propertyId)` — Get property details
* `ga4.property.upsert(accountId, propertyConfig)` — Create/update property
* `ga4.property.settings.get(propertyId)` — Get property settings (currency, timezone, display name)
* `ga4.property.settings.update(propertyId, {currency, timezone, displayName, industryCategory})` — Update property settings
* `ga4.property.googleSignals.get(propertyId)` — Get Google Signals configuration
* `ga4.property.googleSignals.update(propertyId, {state})` — Enable/disable Google Signals (cross-device tracking)
* `ga4.property.dataRetention.get(propertyId)` — Get data retention settings
* `ga4.property.dataRetention.update(propertyId, {retentionDays})` — Update data retention (14, 26, 38, 50 months)
* `ga4.property.consentMode.get(propertyId)` — Get consent mode configuration
* `ga4.property.consentMode.update(propertyId, consentConfig)` — Update consent mode settings
* `ga4.datastream.list(propertyId)` — List data streams (web, iOS, Android)
* `ga4.datastream.upsert(propertyId, streamConfig)` — Create/update data stream
* `ga4.datastream.delete(propertyId, streamId)` — Delete data stream
* `ga4.datastream.enhancedMeasurement.get(propertyId, streamId)` — Get enhanced measurement configuration
* `ga4.datastream.enhancedMeasurement.update(propertyId, streamId, {scrollsEnabled, scrollsThresholdPercent, outboundClicksEnabled, siteSearchEnabled, videoEngagementEnabled, fileDownloadsEnabled})` — Configure enhanced measurement events

**GA4 — Admin API (Custom Definitions)**

* `ga4.customDimension.list(propertyId)` — List custom dimensions
* `ga4.customDimension.list(propertyId)` — List custom dimensions
* `ga4.customDimension.get(propertyId, dimensionName)` — Get custom dimension details
* `ga4.customDimension.upsert(propertyId, {dimensionName, scope: 'USER'|'EVENT'|'ITEM', displayName, description})` — Create/update custom dimension (supports item scope)
* `ga4.customDimension.delete(propertyId, dimensionName)` — Delete custom dimension
* `ga4.customMetric.list(propertyId)` — List custom metrics
* `ga4.customMetric.get(propertyId, metricName)` — Get custom metric details
* `ga4.customMetric.upsert(propertyId, {metricName, scope, displayName, measurementUnit: 'STANDARD'|'CURRENCY'|'FEET'|'METERS'|'KILOMETERS'|'MILES'|'MILLISECONDS'|'SECONDS'|'MINUTES'|'HOURS', type: 'INTEGER'|'FLOAT'|'SECONDS'|'MILLISECONDS'|'CURRENCY'|'FEET'|'METERS'})` — Create/update custom metric (supports currency/time units)
* `ga4.customMetric.delete(propertyId, metricName)` — Delete custom metric

**GA4 — Admin API (Events & Conversions)**

* `ga4.event.list(propertyId)` — List all event definitions
* `ga4.event.get(propertyId, eventName)` — Get event definition
* `ga4.event.upsert(propertyId, {eventName, customParameters[]})` — Create/update custom event
* `ga4.event.parameter.list(propertyId, eventName)` — List event parameters
* `ga4.event.parameter.upsert(propertyId, eventName, {parameterName, parameterType, required, description})` — Create/update event parameter
* `ga4.event.parameter.delete(propertyId, eventName, parameterName)` — Delete event parameter
* `ga4.conversion.list(propertyId)` — List conversion events
* `ga4.conversion.upsert(propertyId, {eventName, countingMethod, valueSettings, attributionSettings})` — Create/update conversion
* `ga4.conversion.delete(propertyId, eventName)` — Delete conversion event

**GA4 — Admin API (Audiences & Attribution)**

* `ga4.audience.list(propertyId)` — List audiences
* `ga4.audience.upsert(propertyId, audienceConfig)` — Create/update audience
* `ga4.audience.delete(propertyId, audienceId)` — Delete audience
* `ga4.audience.trigger.get(propertyId, audienceId)` — Get audience trigger configuration
* `ga4.audience.trigger.update(propertyId, audienceId, {triggerType, refreshInterval})` — Update audience trigger settings
* `ga4.audience.smart.create(propertyId, {name, targetAudience, lookalikeSize})` — Create ML-powered smart audience
* `ga4.attribution.get(propertyId)` — Get attribution settings
* `ga4.attribution.update(propertyId, attributionModel)` — Update attribution model

**GA4 — Measurement Protocol**

* `ga4.measurement.send(propertyId, streamId, events[], clientId?, userId?)` — Send events via Measurement Protocol
* `ga4.measurement.validate(propertyId, streamId, events[])` — Validate events before sending

**GA4 — Admin API (Data Filters)**

* `ga4.dataFilter.list(propertyId)` — List data filters (internal traffic, bot filtering, etc.)
* `ga4.dataFilter.get(propertyId, filterId)` — Get data filter details
* `ga4.dataFilter.create(propertyId, {name, type, filterExpression, applyTo})` — Create data filter (internal traffic, bot exclusion, etc.)
* `ga4.dataFilter.update(propertyId, filterId, updates)` — Update data filter
* `ga4.dataFilter.delete(propertyId, filterId)` — Delete data filter

**GA4 — Admin API (Integrations)**

* `ga4.integration.ads.list(propertyId)` — List Google Ads links
* `ga4.integration.ads.get(propertyId, linkId)` — Get Google Ads link details
* `ga4.integration.ads.create(propertyId, {adsAccountId, adsCustomerId, importSiteMetrics, importCostData, importConversions})` — Link Google Ads account
* `ga4.integration.ads.update(propertyId, linkId, updates)` — Update Google Ads link settings
* `ga4.integration.ads.delete(propertyId, linkId)` — Unlink Google Ads account
* `ga4.integration.ads.conversionImport.list(propertyId, linkId)` — List conversion import mappings
* `ga4.integration.ads.conversionImport.create(propertyId, linkId, {ga4EventName, adsConversionActionId, conversionWindow, valueMapping})` — Create conversion import mapping
* `ga4.integration.ads.conversionImport.update(propertyId, linkId, importId, updates)` — Update conversion import mapping
* `ga4.integration.bigquery.list(propertyId)` — List BigQuery links
* `ga4.integration.bigquery.get(propertyId, linkId)` — Get BigQuery link details
* `ga4.integration.bigquery.create(propertyId, {bigqueryProjectId, bigqueryDatasetId, dailyExportEnabled, streamingExportEnabled, location})` — Link BigQuery project
* `ga4.integration.bigquery.update(propertyId, linkId, updates)` — Update BigQuery link settings
* `ga4.integration.bigquery.delete(propertyId, linkId)` — Unlink BigQuery project

**GA4 — Explorations (Query Builders)**

* `ga4.exploration.funnel(propertyId, {steps, dateRange, segments?})` — Funnel exploration query builder
* `ga4.exploration.path(propertyId, {startEvent?, endEvent?, dateRange, maxPathLength?})` — Path exploration query builder
* `ga4.exploration.segmentOverlap(propertyId, {segments, dateRange, metrics})` — Segment overlap analysis query builder

**GTM — Containers & Workspaces**

* `gtm.container.list(accountId)` — List containers
* `gtm.container.get(accountId, containerId)` — Get container details
* `gtm.container.upsert(accountId, containerConfig)` — Create/update container
* `gtm.workspace.list(accountId, containerId)` — List workspaces
* `gtm.workspace.get(accountId, containerId, workspaceId)` — Get workspace details
* `gtm.workspace.create(accountId, containerId, workspaceName)` — Create workspace
* `gtm.workspace.merge(accountId, containerId, workspaceId, sourceWorkspaceId)` — Merge workspace changes

**GTM — Tags**

* `gtm.tag.list(accountId, containerId, workspaceId)` — List tags
* `gtm.tag.get(accountId, containerId, workspaceId, tagId)` — Get tag details
* `gtm.tag.upsert(accountId, containerId, workspaceId, {tagId?, name, type, tagFiringOption, firingTriggerId[], blockingTriggerId[], liveOnly?, parameter[]})` — Create/update tag
* `gtm.tag.delete(accountId, containerId, workspaceId, tagId)` — Delete tag

**GTM — Triggers**

* `gtm.trigger.list(accountId, containerId, workspaceId)` — List triggers
* `gtm.trigger.get(accountId, containerId, workspaceId, triggerId)` — Get trigger details
* `gtm.trigger.upsert(accountId, containerId, workspaceId, {triggerId?, name, type, customEventFilter?, condition[], filter[]})` — Create/update trigger
* `gtm.trigger.delete(accountId, containerId, workspaceId, triggerId)` — Delete trigger

**GTM — Variables**

* `gtm.variable.list(accountId, containerId, workspaceId)` — List variables
* `gtm.variable.get(accountId, containerId, workspaceId, variableId)` — Get variable details
* `gtm.variable.upsert(accountId, containerId, workspaceId, {variableId?, name, type, parameter[], formatValue?})` — Create/update variable
* `gtm.variable.delete(accountId, containerId, workspaceId, variableId)` — Delete variable
* `gtm.builtinVariable.list(accountId, containerId, workspaceId)` — List built-in variables
* `gtm.builtinVariable.enable(accountId, containerId, workspaceId, type[])` — Enable built-in variables

**GTM — Data Layer & Validation**

* `gtm.datalayer.validate(accountId, containerId, workspaceId, dataLayerSchema)` — Validate data layer structure
* `gtm.datalayer.schema(accountId, containerId, workspaceId)` — Generate data layer schema from variables
* `gtm.datalayer.monitor(accountId, containerId, workspaceId, eventName)` — Monitor data layer events

**GTM — Versions & Publishing**

* `gtm.version.list(accountId, containerId)` — List container versions
* `gtm.version.get(accountId, containerId, versionId)` — Get version details
* `gtm.version.create(accountId, containerId, workspaceId, {name, notes?})` — Create version from workspace
* `gtm.version.restore(accountId, containerId, versionId)` — Restore version
* `gtm.workspace.publish(accountId, containerId, workspaceId, {fingerprint})` — Publish workspace
* `gtm.preview.create(accountId, containerId, workspaceId)` — Create preview environment

**GTM — Folders**

* `gtm.folder.list(accountId, containerId, workspaceId)` — List folders
* `gtm.folder.upsert(accountId, containerId, workspaceId, {folderId?, name})` — Create/update folder
* `gtm.folder.move(accountId, containerId, workspaceId, folderId, entityId, entityType)` — Move tag/trigger/variable to folder

**Google Ads — Reporting**

* `ads.report.gaql(customerId, query, limit?, validateOnly?)` — Execute GAQL query
* `ads.report.batch(customerId, queries[])` — Batch GAQL queries
* `ads.report.stream(customerId, query)` — Stream large result sets

**Google Ads — Campaigns & Ad Groups**

* `ads.campaign.list(customerId, filter?)` — List campaigns
* `ads.campaign.get(customerId, campaignId)` — Get campaign details
* `ads.campaign.upsert(customerId, {campaignId?, name, status, advertisingChannelType, budget, biddingStrategy, adSchedule, targeting})` — Create/update campaign
* `ads.campaign.pause(customerId, campaignId)` — Pause campaign
* `ads.adgroup.list(customerId, campaignId?)` — List ad groups
* `ads.adgroup.upsert(customerId, {adGroupId?, campaignId, name, status, type, targeting})` — Create/update ad group

**Google Ads — Ads & Keywords**

* `ads.ad.list(customerId, adGroupId?)` — List ads
* `ads.ad.upsert(customerId, adGroupId, adConfig)` — Create/update ad (supports all ad types)
* `ads.keyword.list(customerId, adGroupId?)` — List keywords
* `ads.keyword.upsert(customerId, adGroupId, {keywordId?, text, matchType, cpcBid?, negative?})` — Create/update keyword
* `ads.keyword.delete(customerId, keywordId)` — Delete keyword
* `ads.negativeKeyword.list(customerId, campaignId?, adGroupId?)` — List negative keywords
* `ads.negativeKeyword.upsert(customerId, {keywordId?, text, matchType, scope})` — Create/update negative keyword

**Google Ads — Conversion Actions**

* `ads.conversion.list(customerId, filter?)` — List conversion actions
* `ads.conversion.get(customerId, conversionId)` — Get conversion action details
* `ads.conversion.upsert(customerId, {conversionId?, name, type, category, status, valueSettings, attributionModel, countingType})` — Create/update conversion action
* `ads.conversion.delete(customerId, conversionId)` — Delete conversion action
* `ads.conversion.offlineImport(customerId, conversionId, conversions[])` — Import offline conversions
* `ads.conversion.enhanced(customerId, conversionId, enhancedConfig)` — Configure enhanced conversions

**Google Ads — Audiences**

* `ads.audience.list(customerId, type?)` — List audiences (remarketing, customer match, custom)
* `ads.audience.upsert(customerId, audienceConfig)` — Create/update audience
* `ads.audience.attach(customerId, campaignId, audienceId, bidModifier?)` — Attach audience to campaign

**Google Ads — Budgets & Bidding**

* `ads.budget.list(customerId)` — List budgets
* `ads.budget.upsert(customerId, {budgetId?, name, amount, deliveryMethod})` — Create/update budget
* `ads.biddingStrategy.list(customerId)` — List bidding strategies
* `ads.biddingStrategy.upsert(customerId, biddingConfig)` — Create/update bidding strategy

**Core/Utility**

* `auth.login()` / `auth.rotate()` / `auth.status()`
* `capabilities.refresh()` / `capabilities.get()`
* `core.healthcheck()` / `core.version()` / `core.dryRun(on|off)`

---

## 13) Configuration

`~/.mcp/google/config.json`

```json
{
  "profiles": {
    "default": {
      "ga4": {
        "scopes": [
          "https://www.googleapis.com/auth/analytics.readonly",
          "https://www.googleapis.com/auth/analytics.edit",
          "https://www.googleapis.com/auth/analytics.manage.users"
        ],
        "measurement_protocol_secret": "env:GA4_MEASUREMENT_PROTOCOL_SECRET"
      },
      "gtm": {
        "scopes": [
          "https://www.googleapis.com/auth/tagmanager.readonly",
          "https://www.googleapis.com/auth/tagmanager.edit.containers",
          "https://www.googleapis.com/auth/tagmanager.publish",
          "https://www.googleapis.com/auth/tagmanager.manage.accounts"
        ]
      },
      "ads": {
        "developer_token": "env:GOOGLE_ADS_DEV_TOKEN",
        "login_customer_id": "9998887777",
        "client_id": "env:GOOGLE_ADS_CLIENT_ID",
        "client_secret": "env:GOOGLE_ADS_CLIENT_SECRET",
        "refresh_token": "env:GOOGLE_ADS_REFRESH_TOKEN"
      },
      "limits": {
        "qps": {"ga4": 5, "gtm": 3, "ads": 2},
        "burst": {"ga4": 10, "gtm": 5, "ads": 4}
      },
      "data_layer": {
        "validation_enabled": true,
        "schema_path": "~/.mcp/google/datalayer-schema.json",
        "monitoring_enabled": false
      }
    }
  }
}
```

---

## 14) Code Quality Gates

* **Type safety:** strict TS; no `any` in public modules.
* **Static analysis:** ESLint + Sonar‑like ruleset; `no-floating-promises`, `no-console` (logger only).
* **Formatting:** Prettier enforced.
* **Dead code:** ts-prune CI check.
* **Bundle size check:** warning thresholds.

---

## 15) Testing Strategy (TDD)

* **Unit tests:** Pure functions (schemas, adapters, idempotency, cache, limiter).
* **Integration tests:** Mocked Google clients + replay fixtures (nock/grpc mock). Validate retries, limits, rollbacks.
* **Contract tests:** Pact‑style against minimal live sandbox (skipped in CI; manual pre‑release job).
* **Smoke tests:** `scripts/smoke.mjs` hits `auth.status`, `capabilities.get`, one read per product.

**Test Matrix (MVP)**

* Happy path for each tool.
* 4xx (auth, validation) + 5xx (retry) per product.
* Rate limit throttle + recovery.
* Idempotent write replays.
* Rollback on postcheck mismatch.

---

## 16) Developer Experience & Docs

* **README:** install, auth, quick start, safety toggles, dry‑run.
* **/docs:**

  * `tools.md` (args, examples, invariants)
  * `auth.md` (scopes, rotation, storage)
  * `errors.md` (catalog + remediation)
  * `observability.md` (log fields + metrics)
  * `contrib.md` (style, tests, release)
  * `datalayer.md` (data layer schema, validation, best practices)
  * `custom-events.md` (event tracking workflows, GTM → GA4 → Ads)
  * `conversions.md` (conversion setup, linking, offline imports)
* **Inline JSDoc:** every public symbol documented; examples included.
* **AI‑first notes:** each tool includes a “For AI agents” block: intent, required args, safety checks, and canonical examples.

---

## 17) Rollback & Compensating Actions

* **GTM:** if publish fails postcheck, auto‑revert to previous container version.
* **GA4:** if conversion upsert fails, attempt delete of created artifact; re‑query to ensure absence.
* **Ads:** if campaign upsert partially succeeds, pause newly created entities; then delete if consistent.

---

## 18) Data Layer Management & Custom Event Tracking

### 18.1) Data Layer Schema & Validation

**Purpose:** Ensure GTM data layer structure matches frontend implementation and validate event payloads.

**Tools:**
* `gtm.datalayer.validate` — Validates data layer structure against schema
* `gtm.datalayer.schema` — Generates schema from GTM variable definitions
* `gtm.datalayer.monitor` — Monitors data layer events in real-time

**Schema Format (Zod):**
```typescript
const DataLayerSchema = z.object({
  event: z.string(),
  eventCategory: z.string().optional(),
  eventAction: z.string().optional(),
  eventLabel: z.string().optional(),
  eventValue: z.number().optional(),
  userId: z.string().optional(),
  transactionId: z.string().optional(),
  // ... extensible for custom properties
});
```

**Validation Workflow:**
1. Extract all data layer variable references from GTM container
2. Generate schema from variable types and constraints
3. Compare with frontend data layer implementation
4. Identify missing variables, type mismatches, or required fields
5. Auto-create missing variables or flag discrepancies

### 18.2) Custom Event Tracking Pipeline

**Complete Flow: Frontend → GTM → GA4 → Ads**

1. **Frontend Data Layer Push**
   ```javascript
   dataLayer.push({
     event: 'purchase',
     transactionId: 'T12345',
     value: 99.99,
     currency: 'USD',
     items: [...]
   });
   ```

2. **GTM Variable Extraction**
   * Data layer variables automatically extract values
   * Custom JavaScript variables can transform data
   * Lookup tables can map/enrich values

3. **GTM Trigger Firing**
   * Custom event trigger matches `event: 'purchase'`
   * Additional conditions can filter (e.g., `value > 50`)

4. **GTM Tag Execution**
   * GA4 Event tag fires with mapped parameters
   * Tag sequencing ensures consent/other tags fire first
   * Firing rules can add additional logic

5. **GA4 Event Receipt**
   * Event received via gtag.js or Measurement Protocol
   * Custom parameters stored in event
   * Custom dimensions/metrics populated if configured

6. **GA4 Conversion Processing**
   * If event marked as conversion, processed accordingly
   * Attribution model applied
   * Value settings determine conversion value

7. **Ads Conversion Linking**
   * GA4 conversion linked to Ads conversion action
   * Offline conversions can be imported with transaction IDs
   * Enhanced conversions improve matching accuracy

### 18.3) Measurement Protocol Integration

**Use Cases:**
* Server-side event tracking (backend APIs, webhooks)
* Offline event import
* Event validation before production deployment

**Implementation:**
* `ga4.measurement.send` — Send events with client_id, user_id, or both
* `ga4.measurement.validate` — Validate event structure without sending
* Supports batch events, custom parameters, user properties
* Automatic retry on transient failures
* Idempotency via `event_id` parameter

### 18.4) Variable & Trigger Management

**Variable Types Supported:**
* **Data Layer Variables:** Extract from `dataLayer`
* **Custom JavaScript Variables:** Execute custom code
* **URL Variables:** Extract from URL parameters
* **Constant Variables:** Static values
* **Lookup Tables:** Map input to output values
* **Regex Tables:** Pattern-based transformations
* **Built-in Variables:** Page URL, Click Element, etc.

**Trigger Types Supported:**
* **Custom Event:** Listen for `dataLayer.push({event: '...'})`
* **Page View:** DOM ready, window loaded
* **Click:** All clicks, specific elements, link clicks
* **Form:** Form submission, form start, form abandonment
* **Timer:** Interval-based triggers
* **Visibility:** Element visibility changes
* **Scroll Depth:** Scroll percentage thresholds
* **YouTube Video:** Video play, pause, progress, complete
* **History Change:** SPA navigation events

**Best Practices:**
* Use consistent naming conventions (snake_case for events, camelCase for variables)
* Document data layer schema in GTM container notes
* Validate data layer structure in development/staging
* Use lookup tables for value normalization
* Enable built-in variables only when needed (performance)

### 18.5) Conversion Setup & Linking

**GA4 Conversion Configuration:**
* Event name (must match tracked event)
* Counting method (once per event, once per session, etc.)
* Value settings (use event value, custom calculation, or none)
* Attribution settings (data-driven, last-click, first-click, etc.)

**Google Ads Conversion Action:**
* Type: Website, App, Phone calls, Import, Google Analytics
* Category: Purchase, Sign-up, Lead, etc.
* Value: Use same value, different value, or don't use value
* Count: One, Many, or Every
* Attribution: Last click, Data-driven, etc.

**Linking GA4 to Ads:**
* Create Ads conversion action with `type: "GOOGLE_ANALYTICS"`
* Link to GA4 property via conversion action settings
* Import offline conversions with `ads.conversion.offlineImport`
* Enhanced conversions improve matching with hashed customer data

### 18.6) API Coverage Matrix

| Capability | GA4 Data API | GA4 Admin API | GTM API | Ads API |
|------------|--------------|---------------|---------|---------|
| **Read Operations** | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Write Operations** | ❌ N/A | ✅ Full | ✅ Full | ✅ Full |
| **Custom Events** | ✅ Query | ✅ Define | ✅ Track | ❌ N/A |
| **Conversions** | ✅ Query | ✅ Manage | ✅ Forward | ✅ Manage |
| **Custom Dimensions** | ✅ Query | ✅ Manage | ❌ N/A | ❌ N/A |
| **Data Streams** | ❌ N/A | ✅ Manage | ❌ N/A | ❌ N/A |
| **Variables** | ❌ N/A | ❌ N/A | ✅ Full | ❌ N/A |
| **Triggers** | ❌ N/A | ❌ N/A | ✅ Full | ❌ N/A |
| **Tags** | ❌ N/A | ❌ N/A | ✅ Full | ❌ N/A |
| **Data Layer** | ❌ N/A | ❌ N/A | ✅ Validate | ❌ N/A |
| **Measurement Protocol** | ✅ Send | ❌ N/A | ❌ N/A | ❌ N/A |
| **Audiences** | ✅ Query | ✅ Manage | ❌ N/A | ✅ Manage |
| **Attribution** | ✅ Query | ✅ Configure | ❌ N/A | ✅ Configure |
| **Offline Conversions** | ❌ N/A | ❌ N/A | ❌ N/A | ✅ Import |

---

## 19) Example Workflows (MVP)

1. **GTM Tag Upsert + Publish**

   * Precheck container/workspace, ensure tag uniqueness by name + type.
   * Upsert tag → verify by read‑back → create version → publish → verify `live_container` contains tag.

2. **GA4 Conversion Upsert**

   * Precheck existing conversions; compare payload.
   * Upsert → read‑back validate fields; on mismatch, delete + retry once with normalized payload.

3. **Ads: Keyword Programmatic Update**

   * GAQL fetch current keyword states; diff vs desired.
   * Upsert set; pause/remove obsolete; verify via GAQL snapshot.

4. **Complete Custom Event Tracking Setup (GTM → GA4 → Ads)**

   * **Step 1: GTM Data Layer Variable Setup**
     * Create data layer variable `gtm.variable.upsert` for `event`, `eventCategory`, `eventAction`, `eventLabel`, `eventValue`
     * Validate data layer schema matches expected structure
   * **Step 2: GTM Trigger Creation**
     * Create custom event trigger `gtm.trigger.upsert` listening for `customEvent` with filter matching event name
   * Create additional triggers for specific event patterns (e.g., `purchase`, `add_to_cart`)
   * **Step 3: GTM Tag Configuration**
     * Create GA4 Event tag `gtm.tag.upsert` with trigger from Step 2
     * Map data layer variables to GA4 event parameters
     * Configure tag sequencing if needed (e.g., wait for consent tag)
   * **Step 4: GA4 Custom Event Definition**
     * Create custom event in GA4 `ga4.event.upsert` with custom parameters
     * Define custom dimensions/metrics if needed `ga4.customDimension.upsert`
   * **Step 5: GA4 Conversion Setup**
     * Mark event as conversion `ga4.conversion.upsert` with counting method and value settings
     * Configure attribution model if needed
   * **Step 6: Google Ads Conversion Action**
     * Create conversion action `ads.conversion.upsert` linked to GA4 conversion
     * Configure enhanced conversions if applicable
   * **Step 7: Publish & Verify**
     * Publish GTM workspace `gtm.workspace.publish`
     * Send test event via Measurement Protocol `ga4.measurement.send` to validate
     * Verify in GA4 realtime `ga4.realtime.snapshot` and Ads conversion tracking

5. **Data Layer Schema Validation & Matching**

   * **Step 1: Extract Data Layer Schema**
     * Query GTM variables `gtm.variable.list` to identify all data layer references
     * Generate schema `gtm.datalayer.schema` from variable definitions
   * **Step 2: Validate Against Source Code**
     * Compare GTM schema with frontend data layer implementation
     * Identify missing variables or mismatched types
   * **Step 3: Sync Schema**
     * Create missing variables in GTM `gtm.variable.upsert`
     * Update variable types to match source code expectations
     * Document schema in GTM container notes
   * **Step 4: Monitor Data Layer Events**
     * Set up monitoring `gtm.datalayer.monitor` for critical events
     * Alert on schema violations or missing required fields

6. **Cross-Product Conversion Tracking (GA4 ↔ Ads)**

   * **Step 1: GA4 Conversion Setup**
     * Create conversion event `ga4.conversion.upsert` for purchase/lead
     * Configure value settings and attribution
   * **Step 2: Link GA4 to Google Ads**
     * Use Ads API to create conversion action `ads.conversion.upsert` with `type: "GOOGLE_ANALYTICS"`
     * Link to GA4 property via conversion action settings
   * **Step 3: Import Offline Conversions**
     * For offline events, use `ads.conversion.offlineImport` with transaction IDs
     * Match on `gclid` or `conversionDateTime` for attribution
   * **Step 4: Enhanced Conversions**
     * Configure enhanced conversions `ads.conversion.enhanced` for better matching
     * Include hashed customer data (email, phone, address)

7. **GTM Consent Mode Configuration**

   * **Step 1: Create Consent Variables**
     * Create consent state variables `gtm.variable.upsert` for `ad_storage`, `analytics_storage`, `functionality_storage`, `personalization_storage`
   * **Step 2: Create Consent Triggers**
     * Create triggers `gtm.trigger.upsert` for consent updates
   * **Step 3: Configure Tag Consent Settings**
     * Update tags `gtm.tag.upsert` with consent requirements
   * Set tag firing options based on consent state
   * **Step 4: Test Consent Flow**
     * Use preview mode `gtm.preview.create` to test consent scenarios
   * Verify tags fire/block correctly based on consent state

---

## 20) Milestones & Deliverables (3–4 sprints)

**Sprint 1 — Core & GA4 Data API (Week 1)**

* Core: logger, limiter, cache, envelope, validation, error model ✅
* Auth device flow + encrypted token store ✅
* Capabilities registry (GA4/gtm/ads stubs) ✅
* GA4 Data API: `report.run`, `report.batch`, `report.pivot`, `realtime.snapshot`
* GA4 Measurement Protocol: `measurement.send`, `measurement.validate`
* GA4 Property Settings: `property.settings.get/update`, `property.googleSignals.get/update`, `property.dataRetention.get/update`
* GA4 Data Filters: `dataFilter.list/get/create/update/delete` (critical for data quality)
* Tests: unit for core + GA4 Data API; smoke script

**Sprint 2 — GA4 Admin API & GTM Core (Week 2)**

* GA4 Admin API: properties, data streams, custom dimensions/metrics (with item scope, currency/time units)
* GA4 Admin API: events, event parameters, conversions, audiences, audience triggers, attribution
* GA4 Enhanced Measurement: granular event control (scrolls, clicks, video, etc.)
* GA4 Integrations: Google Ads linking, BigQuery linking, conversion import mapping
* GTM: containers, workspaces, tags, triggers (basic CRUD)
* GTM: variables (custom, built-in, data layer)
* Route verification for GA4 Admin API and GTM
* Rollback mechanics for GA4 and GTM
* Docs v1 (README, tools.md, auth.md, errors.md)

**Sprint 3 — GTM Advanced & Google Ads (Week 3)**

* GTM: data layer validation, schema generation, monitoring
* GTM: folders, versions, preview/debug mode, consent mode
* GTM: tag sequencing, firing rules, priority management
* Ads: `report.gaql`, `campaign.upsert`, `adgroup.upsert`, `keyword.upsert`
* Ads: conversion actions, offline conversions, enhanced conversions
* Ads: audiences, budgets, bidding strategies
* Cross-product workflows: GA4 ↔ Ads conversion linking
* Docs: expanded workflows, data layer guide

**Sprint 4 — Hardening & Integration (Week 4)**

* Cache tuning, circuit breaker, metrics, dry‑run mode polish
* Full test matrix incl. retries/limits/rollback for all products
* Contract tests against sandboxes; developer token validation helper for Ads
* End-to-end workflow tests: custom event tracking, data layer validation, conversion linking
* Performance optimization for batch operations
* Ship v0.1.0 with changelog & release notes

---

## 21) Definition of Done (per tool)

* Args/response schemas in `schemas.ts`
* Pre/Post validations implemented
* Idempotency and rollback covered
* Unit + integration tests passing
* Observability: log sample attached in docs
* Docs include at least 1 working example and AI‑usage notes

---

## 22) Future Enhancements (Post‑MVP)

* Terraformable secrets & config; cloud runner
* Scheduled jobs (e.g., nightly reports) via MCP cron companion
* Cross‑product audits (GTM <-> repo code <-> GA4 <-> Ads) with fix‑it PRs
* Opinionated playbooks: budget pacing, n‑gram negative keyword miner, LTV‑aware bidding suggestions
* UI companion in VSCode/Cursor sidebar (webview) for charts & diffs

---

## 23) Quick Start (Developer Checklist)

1. `pnpm dlx create-mcp-server` (or scaffold) → add modules from this plan
2. Set env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_ADS_DEV_TOKEN`, `LOGIN_CUSTOMER_ID`
3. `pnpm dev` → run `auth.login` → confirm `auth.status`
4. `capabilities.refresh` → inspect `~/.mcp/google/capabilities.json`
5. Run smoke: GA4 report, GTM list, Ads GAQL
6. Enable dry‑run; try `gtm.tag.upsert` with postcheck
7. Write first integration tests → iterate

---

*This plan is structured for deterministic, testable delivery with strong safeguards, making the MCP tool safe to use across any Cursor project while granting full control over GA4, GTM, and Google Ads.*
