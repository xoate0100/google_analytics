# Production Readiness Checklist

**Version**: v0.1.0  
**Last updated**: 2025-01-30

## MVP completeness

- **75+ tools**: 137+ tools implemented (GA4, GTM, Google Ads, core, workflows).
- **Auth**: OAuth 2.0 device flow, `auth.login`, `auth.rotate`, `auth.status`; encrypted token storage.
- **Server**: Main entry point `src/server.ts`, MCP tool handlers wired in bootstrap.
- **Docker**: Production Dockerfile, docker-compose (dev/prod), `.env.example`.
- **Tests**: Full suite passing (unit, integration, contract); coverage thresholds in CI.
- **Docs**: API/tools, auth, cursor-setup, observability, errors, configuration.

## No placeholder code in critical paths

- **Tool handlers**: All GA4, GTM, and Ads tools perform real validation and call clients; no stub handlers in request path.
- **Ads client**: `AdsClient.getGoogleAdsClient()` returns a structured object (developerToken, loginCustomerId, oauthClient) used by tools to build requests; actual API calls go through the Google Ads library in tool implementations.
- **Discovery**: `discoverAdsCapabilities` / discovery stubs set capability flags at init; they do not block tool execution. Tools use rate limiter and OAuth; discovery is for capability reporting only.
- **OAuth**: Token introspection comment is for future enhancement; auth flow and token storage are fully implemented.
- **GTM datalayer.monitor**: Returns monitoring status; implementation is functional for status reporting.

## Working tests

- **Unit**: All core, ga4, gtm, ads, server, workflows tests passing.
- **Integration**: Auth E2E, Docker, example, GA4 retry/rate-limit matrix passing.
- **Skipped**: Some integration tests (workflows, GTM rollback, Ads error-handling) are skipped when external deps or long runs are not desired; they are implemented and can be enabled.
- **Timeouts**: `testTimeout: 15000`, `hookTimeout: 20000` in vitest.config.ts for integration tests.

## Production deployment

- **Environment**: Configure via `.env` (see `.env.example`): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MCP_ENCRYPTION_KEY`, optional Ads/GA4 vars.
- **Cursor MCP**: Use `cursor-mcp-config.json.example` and `docs/cursor-setup.md`.
- **Docker**: `docker build -t mcp-google-marketing:0.1.0 .` then run with env and volume for credentials.
- **Health**: Server starts and registers tools; no placeholder routes in production path.

## Sign-off

- [x] All tests passing
- [x] MVP tool count and auth complete
- [x] No blocking placeholders in tool request path
- [x] Docker and env documented
- [x] Release v0.1.0 tagged; develop and main updated
