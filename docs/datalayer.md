# Data Layer Guide

## Overview

The data layer is a JavaScript object that contains all the data you want to pass to Google Tag Manager, GA4, and Google Ads.

## Schema Validation

### Validation Tools

- `gtm.datalayer.validate` - Validates data layer structure against schema
- `gtm.datalayer.schema` - Generates schema from GTM variable definitions
- `gtm.datalayer.monitor` - Monitors data layer events in real-time

### Schema Format

Data layer schema uses Zod for validation:

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

## Validation Workflow

1. Extract all data layer variable references from GTM container
2. Generate schema from variable types and constraints
3. Compare with frontend data layer implementation
4. Identify missing variables, type mismatches, or required fields
5. Auto-create missing variables or flag discrepancies

## Best Practices

1. **Consistent Naming**: Use snake_case for events, camelCase for variables
2. **Documentation**: Document data layer schema in GTM container notes
3. **Validation**: Validate data layer structure in development/staging
4. **Lookup Tables**: Use lookup tables for value normalization
5. **Performance**: Enable built-in variables only when needed

## Example

```javascript
dataLayer.push({
  event: 'purchase',
  transactionId: 'T12345',
  value: 99.99,
  currency: 'USD',
  items: [...]
});
```

## Monitoring

Use `gtm.datalayer.monitor` to monitor data layer events:

```bash
gtm.datalayer.monitor(accountId, containerId, workspaceId, eventName)
```

This will alert on:
- Schema violations
- Missing required fields
- Type mismatches

