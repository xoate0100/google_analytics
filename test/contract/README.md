# Contract Tests

Contract tests validate that our implementation matches the actual API contracts from Google's APIs. These tests can optionally run against live sandbox environments to ensure API contract compliance.

## Purpose

Contract tests serve a different purpose than integration tests:

- **Integration Tests**: Use mocked APIs to test our code logic and error handling
- **Contract Tests**: Validate that our schemas and transformations match the actual API responses

## Running Contract Tests

Contract tests are **skipped by default** to prevent accidental API calls in CI. To run them:

```bash
# Enable real API calls (use sandbox/test credentials)
CONTRACT_TEST_USE_REAL_APIS=true pnpm test:contract
```

## Environment Setup

When running contract tests against real APIs, you need:

1. **OAuth Credentials**: Valid OAuth client ID and secret
2. **Access Token**: Authenticated OAuth token (or refresh token)
3. **Sandbox Resources**: Test property IDs, container IDs, customer IDs, etc.

Set these via environment variables or a `.env` file (not committed to git).

## Test Structure

- `setup.ts` - Contract test setup and configuration
- `ga4/` - GA4 API contract tests
- `gtm/` - GTM API contract tests (future)
- `ads/` - Google Ads API contract tests (future)

## CI/CD

In CI/CD pipelines, contract tests are skipped unless explicitly enabled:

```yaml
# GitHub Actions example
- name: Run contract tests
  run: CONTRACT_TEST_USE_REAL_APIS=true pnpm test:contract
  env:
    GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
    GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
    GOOGLE_REFRESH_TOKEN: ${{ secrets.GOOGLE_REFRESH_TOKEN }}
```

## Best Practices

1. **Use Sandbox Environments**: Always use test/sandbox resources, never production
2. **Validate Schemas**: Ensure API responses match our Zod schemas
3. **Test Edge Cases**: Validate handling of optional fields, null values, etc.
4. **Skip in CI by Default**: Prevent accidental API calls and quota usage
5. **Document Requirements**: Clearly document what credentials/resources are needed
