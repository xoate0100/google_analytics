# Conversion Setup Guide

## GA4 Conversion Configuration

### Event Name

Must match the tracked event name exactly.

### Counting Method

- Once per event
- Once per session
- Once per user

### Value Settings

- Use event value
- Custom calculation
- None

### Attribution Settings

- Data-driven
- Last-click
- First-click
- Linear
- Time decay
- Position-based

## Google Ads Conversion Action

### Type

- Website
- App
- Phone calls
- Import
- Google Analytics

### Category

- Purchase
- Sign-up
- Lead
- View item
- Add to cart
- Begin checkout

### Value

- Use same value
- Different value
- Don't use value

### Count

- One
- Many
- Every

### Attribution

- Last click
- Data-driven
- First click
- Linear
- Time decay
- Position-based

## Linking GA4 to Ads

1. Create Ads conversion action with `type: "GOOGLE_ANALYTICS"`
2. Link to GA4 property via conversion action settings
3. Import offline conversions with `ads.conversion.offlineImport`
4. Enhanced conversions improve matching with hashed customer data

## Offline Conversions

For offline events:

```bash
ads.conversion.offlineImport(customerId, conversionId, conversions[])
```

Match on:
- `gclid` (Google Click ID)
- `conversionDateTime` for attribution

## Enhanced Conversions

Configure enhanced conversions for better matching:

```bash
ads.conversion.enhanced(customerId, conversionId, enhancedConfig)
```

Include hashed customer data:
- Email
- Phone
- Address

## Best Practices

1. Use consistent conversion naming
2. Configure attribution models appropriately
3. Enable enhanced conversions when possible
4. Import offline conversions promptly
5. Monitor conversion tracking accuracy
