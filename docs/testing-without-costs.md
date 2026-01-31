# Testing MCP Server Without Costs

This guide explains how to test the MCP Google Marketing Ops server without incurring costs, especially for Google Ads operations.

## Overview

There are several strategies to test the MCP server safely:

1. **Dry-Run Mode** - Prevents actual writes (recommended)
2. **Read-Only Operations** - Safe operations that don't cost money
3. **Google Ads Test Mode** - Use Google's test environment
4. **GA4 & GTM Testing** - Free APIs (no cost for API calls)
5. **Mocked Integration Tests** - Use existing test infrastructure

## Method 1: Dry-Run Mode (Recommended)

Dry-run mode simulates write operations without actually executing them. This is the safest way to test write operations.

### Enable Dry-Run Mode

#### Option A: Environment Variable

Set `MCP_MARKETING_DRY_RUN=1` in your environment:

```bash
# In .env file
MCP_MARKETING_DRY_RUN=1
```

Or in your Cursor `mcp.json`:
```json
{
  "mcpServers": {
    "google-marketing": {
      "env": {
        "MCP_MARKETING_DRY_RUN": "1"
      }
    }
  }
}
```

#### Option B: Using the Tool

Enable dry-run mode dynamically using the `core.dryRun` tool:

```bash
# In Cursor chat
core.dryRun({ enabled: true })
```

This will:
- Set `MCP_MARKETING_DRY_RUN=1`
- Return confirmation that dry-run mode is enabled
- All subsequent write operations will be simulated

### How Dry-Run Mode Works

**Note**: Dry-run mode infrastructure is in place (`core.dryRun` tool and `MCP_MARKETING_DRY_RUN` environment variable), but individual tools need to check this flag before executing write operations. Currently, the safest approach is to use read-only operations or test accounts.

When fully implemented, dry-run mode will:
- **Read operations** (list, get) work normally
- **Write operations** (upsert, create, update, delete) are simulated:
  - Pre-check validation runs normally
  - The actual API call is skipped
  - A simulated success response is returned
  - Post-check validation runs on the simulated response
  - No actual changes are made to your Google accounts

**Current Status**: The `core.dryRun` tool can enable/disable the flag, but tools should check `process.env.MCP_MARKETING_DRY_RUN` before making write API calls. For now, use read-only operations or test accounts for safe testing.

### Disable Dry-Run Mode

```bash
# Using the tool
core.dryRun({ enabled: false })

# Or set environment variable
MCP_MARKETING_DRY_RUN=0
```

## Method 2: Read-Only Operations (100% Safe)

Many operations are read-only and **never cost money**. These are safe to test with real accounts:

### GA4 Read-Only Operations (Free)
- ✅ `ga4.report.run` - Run reports
- ✅ `ga4.report.batch` - Batch reports
- ✅ `ga4.report.pivot` - Pivot reports
- ✅ `ga4.realtime.snapshot` - Real-time data
- ✅ `ga4.property.list` - List properties
- ✅ `ga4.property.get` - Get property details
- ✅ `ga4.datastream.list` - List data streams
- ✅ `ga4.datastream.get` - Get data stream details
- ✅ `ga4.customDimension.list` - List custom dimensions
- ✅ `ga4.customDimension.get` - Get custom dimension
- ✅ `ga4.customMetric.list` - List custom metrics
- ✅ `ga4.customMetric.get` - Get custom metric
- ✅ `ga4.event.list` - List events
- ✅ `ga4.event.get` - Get event details
- ✅ `ga4.conversion.list` - List conversions
- ✅ `ga4.conversion.get` - Get conversion details
- ✅ `ga4.audience.list` - List audiences
- ✅ `ga4.audience.get` - Get audience details
- ✅ `ga4.integration.ads.list` - List Ads integrations
- ✅ `ga4.integration.ads.get` - Get Ads integration
- ✅ `ga4.integration.bigquery.list` - List BigQuery integrations
- ✅ `ga4.integration.bigquery.get` - Get BigQuery integration

**Note**: GA4 API calls are **completely free** - no cost for any operation.

### GTM Read-Only Operations (Free)
- ✅ `gtm.container.list` - List containers
- ✅ `gtm.container.get` - Get container details
- ✅ `gtm.workspace.list` - List workspaces
- ✅ `gtm.workspace.get` - Get workspace details
- ✅ `gtm.tag.list` - List tags
- ✅ `gtm.tag.get` - Get tag details
- ✅ `gtm.trigger.list` - List triggers
- ✅ `gtm.trigger.get` - Get trigger details
- ✅ `gtm.variable.list` - List variables
- ✅ `gtm.variable.get` - Get variable details
- ✅ `gtm.folder.list` - List folders
- ✅ `gtm.folder.get` - Get folder details
- ✅ `gtm.version.list` - List versions
- ✅ `gtm.version.get` - Get version details

**Note**: GTM API calls are **completely free** - no cost for any operation.

### Google Ads Read-Only Operations (Free API Calls)
- ✅ `ads.report.gaql` - Query data (read-only)
- ✅ `ads.report.batch` - Batch queries (read-only)
- ✅ `ads.campaign.list` - List campaigns
- ✅ `ads.campaign.get` - Get campaign details
- ✅ `ads.adgroup.list` - List ad groups
- ✅ `ads.adgroup.get` - Get ad group details
- ✅ `ads.keyword.list` - List keywords
- ✅ `ads.conversion.list` - List conversion actions
- ✅ `ads.conversion.get` - Get conversion action details
- ✅ `ads.audience.list` - List audiences
- ✅ `ads.audience.get` - Get audience details
- ✅ `ads.budget.list` - List budgets
- ✅ `ads.budget.get` - Get budget details
- ✅ `ads.biddingStrategy.list` - List bidding strategies
- ✅ `ads.biddingStrategy.get` - Get bidding strategy details

**Note**: Google Ads API calls are **free** (no cost for API usage). However, **write operations** (upsert, create, update, delete) can modify your campaigns, which may affect ad spend. Use dry-run mode or test mode for write operations.

## Method 3: Google Ads Test Mode

Google Ads provides a test mode that uses test accounts. Test accounts don't incur real costs.

### Setting Up Google Ads Test Mode

1. **Get a Test Account Customer ID**:
   - Test account customer IDs typically start with `test-` prefix
   - Example: `test-1234567890`
   - You can create test accounts in Google Ads Manager (MCC)

2. **Use Test Developer Token**:
   - Test developer tokens work with test accounts
   - They don't require production approval
   - Set `GOOGLE_ADS_DEV_TOKEN` to your test token

3. **Configure Test Customer ID**:
   ```bash
   # In .env or mcp.json
   LOGIN_CUSTOMER_ID=test-1234567890
   ```

4. **Test Operations**:
   - All operations work normally in test mode
   - No real campaigns are affected
   - No real costs are incurred
   - Test data is isolated from production

### Creating a Test Account

1. Go to [Google Ads](https://ads.google.com)
2. Create a new account or use an existing test account
3. Note the customer ID (format: `123-456-7890` or `test-1234567890`)
4. Use this customer ID in `LOGIN_CUSTOMER_ID`

**Important**: Test accounts are completely separate from production accounts and don't incur costs.

## Method 4: GA4 & GTM Testing (Recommended for Initial Testing)

GA4 and GTM APIs are **completely free** - you can test all operations without any cost concerns.

### Recommended Testing Flow

1. **Start with GA4** (100% free):
   ```bash
   # List properties (read-only, free)
   ga4.property.list()

   # Get property details (read-only, free)
   ga4.property.get({ name: "properties/123456789" })

   # Run a report (read-only, free)
   ga4.report.run({
     property: "properties/123456789",
     dateRanges: [{ startDate: "2024-01-01", endDate: "2024-01-31" }],
     dimensions: [{ name: "country" }],
     metrics: [{ name: "activeUsers" }]
   })
   ```

2. **Test GTM** (100% free):
   ```bash
   # List containers (read-only, free)
   gtm.container.list()

   # Get container details (read-only, free)
   gtm.container.get({ path: "accounts/123456/containers/789012" })

   # List tags (read-only, free)
   gtm.tag.list({ parent: "accounts/123456/containers/789012/workspaces/345678" })
   ```

3. **Test Google Ads Read Operations** (free API calls):
   ```bash
   # Query campaigns (read-only, free API call)
   ads.report.gaql({
     customerId: "1234567890",
     query: "SELECT campaign.id, campaign.name FROM campaign LIMIT 10"
   })

   # List campaigns (read-only, free API call)
   ads.campaign.list({ customerId: "1234567890" })
   ```

## Method 5: Using Integration Tests

The codebase includes comprehensive integration tests that mock all API calls:

```bash
# Run integration tests (all mocked, no real API calls)
pnpm test:integration

# Run specific test suites
pnpm test test/integration/auth-e2e.test.ts
pnpm test test/integration/docker.test.ts
```

These tests:
- Mock all Google API endpoints
- Don't make real API calls
- Don't incur any costs
- Test the complete flow

## Quick Start: Safest Testing Approach

**Recommended for first-time testing**:

1. **Test Authentication** (no cost):
   ```bash
   auth.login()
   # Complete OAuth flow
   auth.status()
   ```

2. **Test GA4 Read Operations** (100% free, no risk):
   ```bash
   ga4.property.list()
   ga4.report.run({ property: "properties/123456789", ... })
   ```

3. **Test GTM Read Operations** (100% free, no risk):
   ```bash
   gtm.container.list()
   gtm.tag.list({ parent: "..." })
   ```

4. **Test Google Ads Read Operations** (free API calls, no campaign changes):
   ```bash
   ads.report.gaql({ customerId: "1234567890", query: "SELECT campaign.id FROM campaign LIMIT 10" })
   ads.campaign.list({ customerId: "1234567890" })
   ```

**Avoid write operations on Google Ads** until you've set up a test account or verified dry-run mode is working.

## Testing Strategy Recommendations

### For Initial Testing (Safest)

1. **Use GA4 and GTM only**:
   - These APIs are completely free
   - Test all read and write operations safely
   - No cost concerns whatsoever

2. **Test authentication flow**:
   ```bash
   # Test auth.login (no cost)
   auth.login()
   # Complete OAuth flow
   auth.login({ deviceCode: "..." })

   # Check status (no cost)
   auth.status()
   ```

### For Google Ads Testing

1. **Start with read-only operations**:
   ```bash
   # Safe - read-only, no cost
   ads.report.gaql({ customerId: "1234567890", query: "SELECT campaign.id FROM campaign LIMIT 10" })
   ads.campaign.list({ customerId: "1234567890" })
   ```

2. **Use dry-run mode for write operations**:
   ```bash
   # Enable dry-run
   core.dryRun({ enabled: true })

   # Test write operations (simulated, no cost)
   ads.campaign.upsert({ customerId: "1234567890", name: "Test Campaign", advertisingChannelType: "SEARCH" })
   ```

3. **Use test accounts for real testing**:
   - Set up a Google Ads test account
   - Use test customer ID in `LOGIN_CUSTOMER_ID`
   - Test all operations safely

## Cost Breakdown

### Free Operations (No Cost)
- ✅ **All GA4 API calls** - Completely free
- ✅ **All GTM API calls** - Completely free
- ✅ **All Google Ads read operations** - Free API calls
- ✅ **OAuth authentication** - Free
- ✅ **MCP server operations** - Free

### Potentially Cost-Bearing Operations
- ⚠️ **Google Ads write operations** (upsert, create, update, delete):
  - API calls are free
  - But operations can modify campaigns, which may affect ad spend
  - **Solution**: Use dry-run mode or test accounts

## Best Practices

1. **Always enable dry-run mode** when testing write operations:
   ```bash
   core.dryRun({ enabled: true })
   ```

2. **Start with read-only operations** to verify connectivity:
   ```bash
   auth.status()
   ga4.property.list()
   gtm.container.list()
   ```

3. **Use test accounts** for Google Ads write operation testing

4. **Monitor your environment**:
   ```bash
   # Check if dry-run is enabled
   core.dryRun({ enabled: true })
   # Verify status
   auth.status()
   ```

5. **Test incrementally**:
   - Start with authentication
   - Test read operations
   - Test write operations with dry-run enabled
   - Only disable dry-run when confident

## Troubleshooting

### "Dry-run mode not working"
- Verify `MCP_MARKETING_DRY_RUN=1` is set in environment
- Check using `core.dryRun({ enabled: true })`
- Restart the MCP server after changing environment variables

### "Still making real API calls"
- Ensure dry-run mode is enabled before write operations
- Check server logs for dry-run mode status
- Verify environment variable is correctly set

### "Test account not working"
- Verify customer ID format (with or without `test-` prefix)
- Ensure test developer token is used
- Check OAuth scopes include Google Ads API access

## Summary

**Safest Testing Approach**:
1. ✅ Use GA4 and GTM for initial testing (100% free)
2. ✅ Enable dry-run mode for write operations
3. ✅ Use read-only operations for Google Ads
4. ✅ Use test accounts for Google Ads write testing
5. ✅ Use integration tests for automated testing

**Remember**:
- GA4 and GTM APIs are completely free
- Google Ads API calls are free (but write operations can affect campaigns)
- Dry-run mode prevents all write operations
- Test accounts provide isolated testing environment
