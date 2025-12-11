# Sprint 3: GTM Advanced & Google Ads

## Overview

Sprint 3 implements GTM advanced features (data layer validation, folders, versions, preview/debug mode, consent mode, tag sequencing) and Google Ads core tools (GAQL reporting, campaigns, ad groups, ads, keywords, conversion actions, audiences, budgets). Includes cross-product workflows for GA4 ↔ Ads conversion linking.

**Git Branch**: `feature/sprint3-gtm-advanced-ads`
**Base Branch**: `develop`
**Merge Target**: `develop`
**Commit Strategy**: Checkpoint-based (after phases, every 3-5 tasks)

## Stage 1: GTM Advanced Features (Tasks 3.1-3.6)

### Phase 3.1: GTM Data Layer Tools

**Task 3.1.1**: Create GTM data layer validation tools (TDD)

- **Git Steps**:
1. Create branch: `git checkout -b feature/sprint3-gtm-advanced-ads`
2. Write failing test: `test/unit/gtm/datalayer-validation.test.ts`
3. Implement: `src/gtm/tools.ts` (add `gtm.datalayer.validate`, `gtm.datalayer.schema.generate`)
4. Add schemas: `src/gtm/schemas.ts` (data layer validation schemas)
5. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.1.1 feat: add GTM data layer validation tools`

- **Outputs**: `src/gtm/tools.ts`, `src/gtm/schemas.ts`, `test/unit/gtm/datalayer-validation.test.ts`
- **SOLID**: Single responsibility per validation function, interface segregation for schema types

**Task 3.1.2**: Create GTM data layer monitoring tools (TDD)

- **Git Steps**:
1. Write failing test: `test/unit/gtm/datalayer-monitoring.test.ts`
2. Implement: `src/gtm/tools.ts` (add `gtm.datalayer.monitor`, `gtm.datalayer.events.list`)
3. Add monitoring schemas and event tracking
4. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.1.2 feat: add GTM data layer monitoring tools`

- **Outputs**: `src/gtm/tools.ts`, `src/gtm/schemas.ts`, `test/unit/gtm/datalayer-monitoring.test.ts`

### Phase 3.2: GTM Folders

**Task 3.2.1**: Create GTM folder tools (TDD)

- **Git Steps**:
1. Write failing test: `test/unit/gtm/folder.test.ts`
2. Implement: `src/gtm/tools.ts` (add `gtm.folder.list`, `gtm.folder.get`, `gtm.folder.upsert`, `gtm.folder.delete`)
3. Add schemas for folder organization
4. Add move entity to folder support
5. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.2.1 feat: add GTM folder tools`

- **Outputs**: `src/gtm/tools.ts`, `src/gtm/schemas.ts`, `test/unit/gtm/folder.test.ts`

### Phase 3.3: GTM Versions & Publishing

**Task 3.3.1**: Create GTM version tools (TDD)

- **Git Steps**:
1. Write failing test: `test/unit/gtm/version.test.ts`
2. Implement: `src/gtm/tools.ts` (add `gtm.version.list`, `gtm.version.get`, `gtm.version.create`, `gtm.version.restore`)
3. Add schemas for version management
4. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.3.1 feat: add GTM version tools`

- **Outputs**: `src/gtm/tools.ts`, `src/gtm/schemas.ts`, `test/unit/gtm/version.test.ts`

**Task 3.3.2**: Create GTM publish and preview tools (TDD)

- **Git Steps**:
1. Write failing test: `test/unit/gtm/publish.test.ts`
2. Implement: `src/gtm/tools.ts` (add `gtm.workspace.publish`, `gtm.preview.create`, `gtm.preview.get`)
3. Add schemas for publishing and preview/debug mode
4. Add rollback for failed publishes
5. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.3.2 feat: add GTM publish and preview tools`

- **Outputs**: `src/gtm/tools.ts`, `src/gtm/schemas.ts`, `test/unit/gtm/publish.test.ts`

### Phase 3.4: GTM Consent Mode & Tag Sequencing

**Task 3.4.1**: Create GTM consent mode tools (TDD)

- **Git Steps**:
1. Write failing test: `test/unit/gtm/consent-mode.test.ts`
2. Implement: `src/gtm/tools.ts` (add `gtm.consent.configure`, `gtm.consent.get`)
3. Add schemas for consent settings (ad_storage, analytics_storage, etc.)
4. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.4.1 feat: add GTM consent mode tools`

- **Outputs**: `src/gtm/tools.ts`, `src/gtm/schemas.ts`, `test/unit/gtm/consent-mode.test.ts`

**Task 3.4.2**: Create GTM tag sequencing and priority tools (TDD)

- **Git Steps**:
1. Write failing test: `test/unit/gtm/tag-sequencing.test.ts`
2. Implement: `src/gtm/tools.ts` (add `gtm.tag.sequence.update`, `gtm.tag.priority.update`)
3. Add schemas for tag sequencing and firing rules
4. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.4.2 feat: add GTM tag sequencing and priority tools`

- **Outputs**: `src/gtm/tools.ts`, `src/gtm/schemas.ts`, `test/unit/gtm/tag-sequencing.test.ts`

**Phase 3.1-3.4 Commit Checkpoint**: Commit after completing Stage 1 Phase 3.4

## Stage 2: Google Ads Core Tools (Tasks 3.7-3.12)

### Phase 3.5: Google Ads Client & Reporting

**Task 3.5.1**: Create Google Ads REST client wrapper (TDD)

- **Git Steps**:
1. Write failing test: `test/unit/ads/client.test.ts`
2. Implement: `src/ads/client.ts` (Google Ads API client with rate limiting)
3. Add error handling and retry logic
4. Integrate with core limiter and cache
5. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.5.1 feat: add Google Ads REST client wrapper`

- **Outputs**: `src/ads/client.ts`, `test/unit/ads/client.test.ts`
- **SOLID**: Dependency inversion for HTTP client interface

**Task 3.5.2**: Create Google Ads GAQL reporting tools (TDD)

- **Git Steps**:
1. Write failing test: `test/unit/ads/reporting.test.ts`
2. Implement: `src/ads/tools.ts` (add `ads.report.gaql`, `ads.report.batch`, `ads.report.stream`)
3. Add schemas for GAQL queries and responses
4. Add query validation
5. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.5.2 feat: add Google Ads GAQL reporting tools`

- **Outputs**: `src/ads/tools.ts`, `src/ads/schemas.ts`, `test/unit/ads/reporting.test.ts`

### Phase 3.6: Google Ads Campaigns & Ad Groups

**Task 3.6.1**: Create Google Ads campaign tools (TDD)

- **Git Steps**:
1. Write failing test: `test/unit/ads/campaign.test.ts`
2. Implement: `src/ads/tools.ts` (add `ads.campaign.list`, `ads.campaign.get`, `ads.campaign.upsert`, `ads.campaign.pause`)
3. Add schemas for campaign configuration (budgets, bidding strategies, ad schedules, targeting)
4. Add idempotency via campaign name
5. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.6.1 feat: add Google Ads campaign tools`

- **Outputs**: `src/ads/tools.ts`, `src/ads/schemas.ts`, `test/unit/ads/campaign.test.ts`

**Task 3.6.2**: Create Google Ads ad group tools (TDD)

- **Git Steps**:
1. Write failing test: `test/unit/ads/adgroup.test.ts`
2. Implement: `src/ads/tools.ts` (add `ads.adgroup.list`, `ads.adgroup.get`, `ads.adgroup.upsert`)
3. Add schemas for ad group types and targeting
4. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.6.2 feat: add Google Ads ad group tools`

- **Outputs**: `src/ads/tools.ts`, `src/ads/schemas.ts`, `test/unit/ads/adgroup.test.ts`

**Phase 3.5-3.6 Commit Checkpoint**: Commit after completing Stage 2 Phase 3.6

## Stage 3: Google Ads Ads, Keywords & Conversions (Tasks 3.13-3.18)

### Phase 3.7: Google Ads Ads & Keywords

**Task 3.7.1**: Create Google Ads ad tools (TDD)

- **Git Steps**:
1. Write failing test: `test/unit/ads/ad.test.ts`
2. Implement: `src/ads/tools.ts` (add `ads.ad.list`, `ads.ad.get`, `ads.ad.upsert`)
3. Add schemas for ad types (responsive search ads, display ads, video ads, app ads)
4. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.7.1 feat: add Google Ads ad tools`

- **Outputs**: `src/ads/tools.ts`, `src/ads/schemas.ts`, `test/unit/ads/ad.test.ts`

**Task 3.7.2**: Create Google Ads keyword tools (TDD)

- **Git Steps**:
1. Write failing test: `test/unit/ads/keyword.test.ts`
2. Implement: `src/ads/tools.ts` (add `ads.keyword.list`, `ads.keyword.get`, `ads.keyword.upsert`)
3. Add schemas for match types, bid adjustments, negative keywords
4. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.7.2 feat: add Google Ads keyword tools`

- **Outputs**: `src/ads/tools.ts`, `src/ads/schemas.ts`, `test/unit/ads/keyword.test.ts`

### Phase 3.8: Google Ads Conversions & Audiences

**Task 3.8.1**: Create Google Ads conversion action tools (TDD)

- **Git Steps**:
1. Write failing test: `test/unit/ads/conversion.test.ts`
2. Implement: `src/ads/tools.ts` (add `ads.conversion.list`, `ads.conversion.get`, `ads.conversion.upsert`)
3. Add schemas for conversion types, categories, value settings
4. Add offline conversions and enhanced conversions support
5. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.8.1 feat: add Google Ads conversion action tools`

- **Outputs**: `src/ads/tools.ts`, `src/ads/schemas.ts`, `test/unit/ads/conversion.test.ts`

**Task 3.8.2**: Create Google Ads audience tools (TDD)

- **Git Steps**:
1. Write failing test: `test/unit/ads/audience.test.ts`
2. Implement: `src/ads/tools.ts` (add `ads.audience.list`, `ads.audience.get`, `ads.audience.upsert`)
3. Add schemas for audience types (customer match, remarketing lists, custom audiences)
4. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.8.2 feat: add Google Ads audience tools`

- **Outputs**: `src/ads/tools.ts`, `src/ads/schemas.ts`, `test/unit/ads/audience.test.ts`

**Task 3.8.3**: Create Google Ads budget and bidding strategy tools (TDD)

- **Git Steps**:
1. Write failing test: `test/unit/ads/budget.test.ts`
2. Implement: `src/ads/tools.ts` (add `ads.budget.list`, `ads.budget.get`, `ads.budget.upsert`, `ads.biddingStrategy.upsert`)
3. Add schemas for budget types and bidding strategies
4. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.8.3 feat: add Google Ads budget and bidding strategy tools`

- **Outputs**: `src/ads/tools.ts`, `src/ads/schemas.ts`, `test/unit/ads/budget.test.ts`

**Phase 3.7-3.8 Commit Checkpoint**: Commit after completing Stage 3 Phase 3.8

## Stage 4: Cross-Product Workflows & Documentation (Tasks 3.19-3.25)

### Phase 3.9: Cross-Product Workflows

**Task 3.9.1**: Implement GA4 ↔ Ads conversion linking (TDD)

- **Git Steps**:
1. Write failing test: `test/unit/workflows/ga4-ads-linking.test.ts`
2. Implement: `src/workflows/ga4-ads-linking.ts` (cross-product conversion linking)
3. Add schemas for conversion linking configuration
4. Add integration tests
5. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.9.1 feat: add GA4 ↔ Ads conversion linking workflow`

- **Outputs**: `src/workflows/ga4-ads-linking.ts`, `test/unit/workflows/ga4-ads-linking.test.ts`, `test/integration/workflows/ga4-ads-linking.test.ts`

### Phase 3.10: Documentation & Stateful Tracking

**Task 3.10.1**: Update tools documentation for GTM advanced features

- **Git Steps**:
1. Update: `docs/tools.md` (add GTM advanced tools documentation)
2. Add examples for data layer validation, folders, versions, preview mode
3. Add workflow examples
4. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.10.1 docs: update GTM advanced tools documentation`

- **Outputs**: `docs/tools.md`

**Task 3.10.2**: Update tools documentation for Google Ads

- **Git Steps**:
1. Update: `docs/tools.md` (add Google Ads tool documentation)
2. Add examples for GAQL queries, campaign management, conversion setup
3. Add workflow examples
4. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.10.2 docs: update Google Ads tools documentation`

- **Outputs**: `docs/tools.md`

**Task 3.10.3**: Create data layer guide

- **Git Steps**:
1. Create: `docs/datalayer-guide.md`
2. Document data layer best practices, schema validation, monitoring
3. Add examples and workflows
4. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.10.3 docs: create data layer guide`

- **Outputs**: `docs/datalayer-guide.md`

**Task 3.10.4**: Update ACTIVE_PLAN.yaml with Sprint 3 progress

- **Git Steps**:
1. Update: `6_ai_runtime_context/ACTIVE_PLAN.yaml` (mark Sprint 3 tasks as completed)
2. Add Sprint 3 summary and metrics
3. Update next_sprint field
4. Commit: `plan:mcp-google-marketing-mvp component:backend task:3.10.4 docs: update ACTIVE_PLAN.yaml Sprint 3 status`

- **Outputs**: `6_ai_runtime_context/ACTIVE_PLAN.yaml`

**Task 3.10.5**: Final verification and merge to develop

- **Git Steps**:
1. Run full test suite: `pnpm test`
2. Run linting: `pnpm lint`
3. Run type check: `pnpm type-check`
4. Verify all pre-commit hooks pass
5. Merge branch: `git checkout develop && git merge --no-ff feature/sprint3-gtm-advanced-ads`
6. Push: `git push origin develop`
7. Commit message: `plan:mcp-google-marketing-mvp component:backend task:3.10.5 merge: Sprint 3 complete - GTM Advanced & Google Ads tools`

- **Outputs**: Merge commit to develop branch

**Phase 3.9-3.10 Commit Checkpoint**: Final commit and merge after completing all Sprint 3 tasks

## Deliverables Summary

- **GTM Advanced Tools**: 15+ tools (data layer validation/monitoring, folders, versions, publish/preview, consent mode, tag sequencing)
- **Google Ads Core Tools**: 20+ tools (GAQL reporting, campaigns, ad groups, ads, keywords, conversions, audiences, budgets)
- **Cross-Product Workflows**: GA4 ↔ Ads conversion linking
- **Documentation**: Updated tools.md, data layer guide
- **Test Coverage**: >90% for all new tools
- **SOLID Compliance**: All code follows SOLID principles
- **TDD**: All tools implemented with test-first approach

## Success Criteria

- All 25 tasks completed with tests passing
- All pre-commit hooks passing (TDD, SOLID, lint, type-check)
- All tools registered in MCP server
- Cross-product workflows tested and verified
- Documentation complete with examples
- Successfully merged to develop branch
