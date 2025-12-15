# Custom Event Tracking Guide

## Complete Flow: Frontend → GTM → GA4 → Ads

### 1. Frontend Data Layer Push

```javascript
dataLayer.push({
  event: 'purchase',
  transactionId: 'T12345',
  value: 99.99,
  currency: 'USD',
  items: [...]
});
```

### 2. GTM Variable Extraction

- Data layer variables automatically extract values
- Custom JavaScript variables can transform data
- Lookup tables can map/enrich values

### 3. GTM Trigger Firing

- Custom event trigger matches `event: 'purchase'`
- Additional conditions can filter (e.g., `value > 50`)

### 4. GTM Tag Execution

- GA4 Event tag fires with mapped parameters
- Tag sequencing ensures consent/other tags fire first
- Firing rules can add additional logic

### 5. GA4 Event Receipt

- Event received via gtag.js or Measurement Protocol
- Custom parameters stored in event
- Custom dimensions/metrics populated if configured

### 6. GA4 Conversion Processing

- If event marked as conversion, processed accordingly
- Attribution model applied
- Value settings determine conversion value

### 7. Ads Conversion Linking

- GA4 conversion linked to Ads conversion action
- Offline conversions can be imported with transaction IDs
- Enhanced conversions improve matching accuracy

## Setup Workflow

See [Complete Custom Event Tracking Setup](../docs/tools.md#complete-custom-event-tracking-setup) for step-by-step instructions.

## Measurement Protocol

For server-side event tracking:

- `ga4.measurement.send` - Send events with client_id, user_id, or both
- `ga4.measurement.validate` - Validate event structure without sending

Supports:
- Batch events
- Custom parameters
- User properties
- Automatic retry on transient failures
- Idempotency via `event_id` parameter

## Best Practices

1. Use consistent naming conventions
2. Document event schema
3. Validate events before production
4. Use lookup tables for normalization
5. Monitor event delivery
