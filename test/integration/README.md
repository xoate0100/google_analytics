# Integration Tests

Integration tests validate the interaction between components with mocked Google APIs.

## Structure

- `setup.ts` - Integration test setup and teardown
- `helpers/` - Test utilities and mocks
- `fixtures/` - Saved API responses for replay

## Running Integration Tests

```bash
pnpm test:integration
```

## Writing Integration Tests

1. Use `createIntegrationTestContext()` to get all dependencies
2. Mock Google API endpoints using `mockGA4DataAPI()`, `mockGA4AdminAPI()`, etc.
3. Register tools and execute operations
4. Verify behavior with mocked responses

## Example

See `example.test.ts` for a complete example.

