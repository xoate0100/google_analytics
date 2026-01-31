<!-- DEPRECATED: Archived for reference. See docs/archive/README.md. Current context: 6_ai_runtime_context/ACTIVE_PLAN.yaml -->

# SRP Violations Analysis and Refactoring Plan

**Date**: 2024-01-17  
**Task**: T.2.1 - Analyze and document SRP violations  
**Status**: IN PROGRESS

## Executive Summary

**Total Violations Found**: 67 SRP violations across 3 files
- **src/ads/tools.ts**: 30 violations (focus of Phase T.2)
- **src/ga4/tools.ts**: 28 violations (Phase T.3)
- **src/gtm/tools.ts**: 9 violations (Phase T.3)

**Root Cause**: Functions exceed 50-line limit (SRP violation). These accumulated during Sprint 1-2 when enforcement wasn't working.

## src/ads/tools.ts Violations (30 total)

### GAQL Reporting Functions (3 violations)

#### 1. `searchResponse` (Line 211) - 167 lines
- **Location**: Inside `executeGAQLBatchAPIRequest`
- **Purpose**: Transform GAQL batch search results
- **Refactoring Strategy**:
  - Extract result transformation logic into `transformGAQLBatchResult()`
  - Extract error handling into `handleGAQLBatchError()`
  - Extract field mapping into `mapGAQLFields()`
  - Target: Break into 3-4 functions of ~40 lines each

#### 2. `response` (Line 378) - 131 lines  
- **Location**: Inside `executeGAQLQueryAPIRequest` or similar
- **Purpose**: Transform GAQL query response
- **Refactoring Strategy**:
  - Extract result parsing into `parseGAQLResults()`
  - Extract field extraction into `extractGAQLFields()`
  - Extract response formatting into `formatGAQLResponse()`
  - Target: Break into 3 functions of ~40 lines each

#### 3. `searchResponse` (Line 2858) - 59 lines
- **Location**: Inside another GAQL function
- **Purpose**: Transform search results
- **Refactoring Strategy**:
  - Extract transformation logic
  - Target: Break into 2 functions of ~30 lines each

### Campaign Management Functions (4 violations)

#### 4. `campaigns` (Line 865) - 122 lines
- **Location**: Inside `executeCampaignListAPIRequest`
- **Purpose**: Transform campaign list response
- **Refactoring Strategy**:
  - Extract campaign mapping into `mapCampaignFields()`
  - Extract filtering logic into `filterCampaigns()`
  - Extract sorting logic into `sortCampaigns()`
  - Target: Break into 3-4 functions of ~30 lines each

#### 5. `response` (Line 987) - 159 lines
- **Location**: Inside `executeCampaignGetAPIRequest`
- **Purpose**: Transform single campaign response
- **Refactoring Strategy**:
  - Extract campaign data extraction into `extractCampaignData()`
  - Extract nested object mapping into `mapCampaignNestedObjects()`
  - Extract validation into `validateCampaignResponse()`
  - Target: Break into 3-4 functions of ~40 lines each

#### 6. `response` (Line 1146) - 176 lines
- **Location**: Inside `executeCampaignUpsertAPIRequest`
- **Purpose**: Transform campaign upsert response
- **Refactoring Strategy**:
  - Extract mutation building into `buildCampaignMutation()`
  - Extract response handling into `handleCampaignUpsertResponse()`
  - Extract error handling into `handleCampaignUpsertError()`
  - Target: Break into 3-4 functions of ~45 lines each

#### 7. `response` (Line 1342) - 145 lines
- **Location**: Inside `executeCampaignPauseAPIRequest`
- **Purpose**: Transform campaign pause response
- **Refactoring Strategy**:
  - Extract pause logic into `processCampaignPause()`
  - Extract response transformation into `transformCampaignPauseResponse()`
  - Target: Break into 2-3 functions of ~50 lines each

### Ad Group Functions (3 violations)

#### 8. `adGroups` (Line 1502) - 125 lines
- **Location**: Inside `executeAdGroupListAPIRequest`
- **Purpose**: Transform ad group list response
- **Refactoring Strategy**:
  - Extract ad group mapping into `mapAdGroupFields()`
  - Extract filtering/sorting into helper functions
  - Target: Break into 3 functions of ~40 lines each

#### 9. `response` (Line 1627) - 151 lines
- **Location**: Inside `executeAdGroupGetAPIRequest`
- **Purpose**: Transform single ad group response
- **Refactoring Strategy**:
  - Extract ad group data extraction
  - Extract nested object mapping
  - Target: Break into 3 functions of ~50 lines each

#### 10. `response` (Line 1832) - 173 lines
- **Location**: Inside `executeAdGroupUpsertAPIRequest`
- **Purpose**: Transform ad group upsert response
- **Refactoring Strategy**:
  - Extract mutation building
  - Extract response handling
  - Target: Break into 3-4 functions of ~45 lines each

### Keyword Functions (3 violations)

#### 11. `keywords` (Line 2025) - 192 lines ⚠️ LARGEST
- **Location**: Inside `executeKeywordListAPIRequest`
- **Purpose**: Transform keyword list response
- **Refactoring Strategy**:
  - Extract keyword mapping into `mapKeywordFields()`
  - Extract bid extraction into `extractKeywordBids()`
  - Extract status mapping into `mapKeywordStatus()`
  - Extract filtering logic into `filterKeywords()`
  - Target: Break into 4-5 functions of ~40 lines each

#### 12. `response` (Line 2217) - 163 lines
- **Location**: Inside `executeKeywordUpsertAPIRequest`
- **Purpose**: Transform keyword upsert response
- **Refactoring Strategy**:
  - Extract mutation building
  - Extract response handling
  - Extract error handling
  - Target: Break into 3-4 functions of ~40 lines each

#### 13. `response` (Line 2402) - 141 lines
- **Location**: Inside `executeKeywordDeleteAPIRequest`
- **Purpose**: Transform keyword delete response
- **Refactoring Strategy**:
  - Extract delete processing
  - Extract response transformation
  - Target: Break into 2-3 functions of ~50 lines each

### Conversion Functions (4 violations)

#### 14. `conversions` (Line 2558) - 128 lines
- **Location**: Inside `executeConversionListAPIRequest`
- **Purpose**: Transform conversion list response
- **Refactoring Strategy**:
  - Extract conversion mapping
  - Extract filtering/sorting
  - Target: Break into 3 functions of ~40 lines each

#### 15. `response` (Line 2686) - 158 lines
- **Location**: Inside `executeConversionGetAPIRequest`
- **Purpose**: Transform single conversion response
- **Refactoring Strategy**:
  - Extract conversion data extraction
  - Extract nested object mapping
  - Target: Break into 3 functions of ~50 lines each

#### 16. `response` (Line 2917) - 181 lines ⚠️ LARGE
- **Location**: Inside `executeConversionUpsertAPIRequest`
- **Purpose**: Transform conversion upsert response
- **Refactoring Strategy**:
  - Extract mutation building
  - Extract response handling
  - Extract validation
  - Target: Break into 4 functions of ~45 lines each

#### 17. `response` (Line 3118) - 143 lines
- **Location**: Inside `executeConversionDeleteAPIRequest`
- **Purpose**: Transform conversion delete response
- **Refactoring Strategy**:
  - Extract delete processing
  - Extract response transformation
  - Target: Break into 2-3 functions of ~50 lines each

### Audience Functions (4 violations)

#### 18. `audiences` (Line 3624) - 127 lines
- **Location**: Inside `executeAudienceListAPIRequest`
- **Purpose**: Transform audience list response
- **Refactoring Strategy**:
  - Extract audience mapping
  - Extract filtering/sorting
  - Target: Break into 3 functions of ~40 lines each

#### 19. `response` (Line 3751) - 153 lines
- **Location**: Inside `executeAudienceGetAPIRequest`
- **Purpose**: Transform single audience response
- **Refactoring Strategy**:
  - Extract audience data extraction
  - Extract nested object mapping
  - Target: Break into 3 functions of ~50 lines each

#### 20. `response` (Line 3968) - 177 lines ⚠️ LARGE
- **Location**: Inside `executeAudienceUpsertAPIRequest`
- **Purpose**: Transform audience upsert response
- **Refactoring Strategy**:
  - Extract mutation building
  - Extract response handling
  - Extract validation
  - Target: Break into 4 functions of ~45 lines each

#### 21. `response` (Line 4181) - 147 lines
- **Location**: Inside `executeAudienceAttachAPIRequest`
- **Purpose**: Transform audience attach response
- **Refactoring Strategy**:
  - Extract attach processing
  - Extract response transformation
  - Target: Break into 2-3 functions of ~50 lines each

### Budget Functions (3 violations)

#### 22. `budgets` (Line 4343) - 123 lines
- **Location**: Inside `executeBudgetListAPIRequest`
- **Purpose**: Transform budget list response
- **Refactoring Strategy**:
  - Extract budget mapping
  - Extract filtering/sorting
  - Target: Break into 3 functions of ~40 lines each

#### 23. `response` (Line 4466) - 153 lines
- **Location**: Inside `executeBudgetGetAPIRequest`
- **Purpose**: Transform single budget response
- **Refactoring Strategy**:
  - Extract budget data extraction
  - Extract nested object mapping
  - Target: Break into 3 functions of ~50 lines each

#### 24. `response` (Line 4670) - 157 lines
- **Location**: Inside `executeBudgetUpsertAPIRequest`
- **Purpose**: Transform budget upsert response
- **Refactoring Strategy**:
  - Extract mutation building
  - Extract response handling
  - Target: Break into 3-4 functions of ~40 lines each

### Bidding Strategy Functions (3 violations)

#### 25. `strategies` (Line 4841) - 128 lines
- **Location**: Inside `executeBiddingStrategyListAPIRequest`
- **Purpose**: Transform bidding strategy list response
- **Refactoring Strategy**:
  - Extract strategy mapping
  - Extract filtering/sorting
  - Target: Break into 3 functions of ~40 lines each

#### 26. `response` (Line 4969) - 165 lines
- **Location**: Inside `executeBiddingStrategyGetAPIRequest`
- **Purpose**: Transform single bidding strategy response
- **Refactoring Strategy**:
  - Extract strategy data extraction
  - Extract nested object mapping
  - Target: Break into 3-4 functions of ~40 lines each

#### 27. `searchResponse` (Line 5148) - 63 lines
- **Location**: Inside `executeBiddingStrategyUpsertAPIRequest`
- **Purpose**: Transform bidding strategy search response
- **Refactoring Strategy**:
  - Extract search result transformation
  - Target: Break into 2 functions of ~30 lines each

#### 28. `response` (Line 5211) - 137 lines
- **Location**: Inside `executeBiddingStrategyUpsertAPIRequest`
- **Purpose**: Transform bidding strategy upsert response
- **Refactoring Strategy**:
  - Extract mutation building
  - Extract response handling
  - Target: Break into 3 functions of ~45 lines each

### Additional Violations (2)

#### 29. `response` (Line 3261) - 173 lines
- **Location**: Inside conversion-related function
- **Purpose**: Transform conversion response
- **Refactoring Strategy**: Similar to other conversion functions

#### 30. `response` (Line 3454) - 150 lines
- **Location**: Inside conversion-related function
- **Purpose**: Transform conversion response
- **Refactoring Strategy**: Similar to other conversion functions

## Refactoring Patterns

### Common Patterns Identified

1. **Response Transformation Functions** (most common)
   - Pattern: Large `response` functions that transform API responses
   - Solution: Extract into smaller transformation functions
   - Helper functions needed: `mapFields()`, `extractData()`, `transformNested()`

2. **List Response Functions**
   - Pattern: Functions like `campaigns()`, `adGroups()`, `keywords()` that process lists
   - Solution: Extract mapping, filtering, and sorting into separate functions

3. **Upsert Response Functions**
   - Pattern: Large functions handling create/update responses
   - Solution: Extract mutation building, response handling, error handling

4. **Search Response Functions**
   - Pattern: Functions transforming search results
   - Solution: Extract result parsing and field mapping

### Refactoring Strategy

1. **Create Helper Modules**:
   - `src/ads/transformers/campaign-transformer.ts` - Campaign transformation helpers
   - `src/ads/transformers/adgroup-transformer.ts` - Ad group transformation helpers
   - `src/ads/transformers/keyword-transformer.ts` - Keyword transformation helpers
   - `src/ads/transformers/conversion-transformer.ts` - Conversion transformation helpers
   - `src/ads/transformers/audience-transformer.ts` - Audience transformation helpers
   - `src/ads/transformers/budget-transformer.ts` - Budget transformation helpers
   - `src/ads/transformers/gaql-transformer.ts` - GAQL transformation helpers

2. **Extract Common Logic**:
   - Field mapping utilities
   - Response validation utilities
   - Error handling utilities
   - Mutation building utilities

3. **Maintain Test Coverage**:
   - Each extracted function needs tests
   - Maintain >90% coverage
   - Update existing tests to use new structure

## Task Breakdown

### Task T.2.2: Refactor GAQL Reporting Functions
- Violations: #1, #2, #3 (3 functions)
- Estimated effort: 2-3 hours
- Outputs: `src/ads/tools.ts`, `src/ads/transformers/gaql-transformer.ts`, `test/unit/ads/reporting.test.ts`

### Task T.2.3: Refactor Campaign Management Functions
- Violations: #4, #5, #6, #7 (4 functions)
- Estimated effort: 3-4 hours
- Outputs: `src/ads/tools.ts`, `src/ads/transformers/campaign-transformer.ts`, `test/unit/ads/campaign.test.ts`

### Task T.2.4: Refactor Ad Group and Keyword Functions
- Violations: #8, #9, #10, #11, #12, #13 (6 functions)
- Estimated effort: 4-5 hours
- Outputs: `src/ads/tools.ts`, `src/ads/transformers/adgroup-transformer.ts`, `src/ads/transformers/keyword-transformer.ts`, `test/unit/ads/adgroup.test.ts`, `test/unit/ads/keyword.test.ts`

### Task T.2.5: Refactor Conversion and Audience Functions
- Violations: #14-#21 (8 functions)
- Estimated effort: 5-6 hours
- Outputs: `src/ads/tools.ts`, `src/ads/transformers/conversion-transformer.ts`, `src/ads/transformers/audience-transformer.ts`, `test/unit/ads/conversion.test.ts`, `test/unit/ads/audience.test.ts`

### Remaining Tasks (Budget & Bidding Strategy)
- Violations: #22-#30 (9 functions)
- Will be handled after T.2.5 or in Phase T.3

## Success Criteria

- ✅ All functions ≤50 lines
- ✅ All tests passing
- ✅ Test coverage ≥90%
- ✅ Architecture check passes
- ✅ No functionality changes (refactoring only)

## Notes

- Refactoring must maintain exact same functionality
- All existing tests must continue to pass
- New helper functions need tests
- Follow TDD: Write tests for new functions first
- Commit after each task completion (T.2.2, T.2.3, T.2.4, T.2.5)
