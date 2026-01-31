<!-- DEPRECATED: Archived for reference. See docs/archive/README.md. Current context: 6_ai_runtime_context/ACTIVE_PLAN.yaml -->

# Remaining SRP Violations Analysis

**Date**: 2024-01-17  
**Task**: T.3.1 - Scan all src/ files for remaining SRP violations  
**Status**: IN PROGRESS

## Executive Summary

**Total Remaining Violations**: ~50+ violations across multiple files
- **src/ads/tools.ts**: ~30 violations (likely false positives from register functions)
- **src/ads/transformers/**: 8 violations (new transformer modules need refinement)
- **src/ga4/tools.ts**: ~28 violations (Phase T.3 focus)
- **src/gtm/tools.ts**: 9 violations (Phase T.3 focus)

## Critical Violations (Priority 1)

### src/ga4/tools.ts - Critical Large Functions

#### 1. `response` (Line 2270) - **1223 lines** ⚠️ CRITICAL
- **Location**: Large response handler
- **Priority**: HIGHEST - This is a massive violation
- **Refactoring Strategy**:
  - Break into multiple transformer modules
  - Extract response transformation logic
  - Create separate handlers for different response types
  - Target: 10-15 functions of ~80 lines each

#### 2. `eventCreateRules` (Line 3850) - **911 lines** ⚠️ CRITICAL
- **Location**: Event creation rules handler
- **Priority**: HIGHEST
- **Refactoring Strategy**:
  - Extract rule validation logic
  - Extract rule transformation logic
  - Extract rule application logic
  - Target: 15-20 functions of ~50 lines each

#### 3. `audiences` (Line 5198) - **424 lines** ⚠️ HIGH
- **Location**: Audience transformation
- **Priority**: HIGH
- **Refactoring Strategy**:
  - Extract audience mapping logic
  - Extract audience filtering logic
  - Extract audience validation logic
  - Target: 8-10 functions of ~40 lines each

#### 4. `bigQueryLinks` (Line 6724) - **303 lines** ⚠️ HIGH
- **Location**: BigQuery link transformation
- **Priority**: HIGH
- **Refactoring Strategy**:
  - Extract link mapping logic
  - Extract link validation logic
  - Extract link transformation logic
  - Target: 6-8 functions of ~40 lines each

## src/ga4/tools.ts - All Violations

1. `response` (Line 2120) - 150 lines
2. `response` (Line 2270) - **1223 lines** ⚠️ CRITICAL
3. `eventCreateRules` (Line 3493) - 137 lines
4. `eventCreateRules` (Line 3630) - 139 lines
5. `eventCreateRules` (Line 3769) - 81 lines
6. `eventCreateRules` (Line 3850) - **911 lines** ⚠️ CRITICAL
7. `audiences` (Line 4761) - 132 lines
8. `audiences` (Line 4893) - 143 lines
9. `audiences` (Line 5036) - 162 lines
10. `audiences` (Line 5198) - **424 lines** ⚠️ HIGH
11. `googleAdsLinks` (Line 5622) - 132 lines
12. `googleAdsLinks` (Line 5754) - 138 lines
13. `googleAdsLinks` (Line 5892) - 136 lines
14. `googleAdsLinks` (Line 6028) - 156 lines
15. `googleAdsLinks` (Line 6184) - 111 lines
16. `bigQueryLinks` (Line 6295) - 137 lines
17. `bigQueryLinks` (Line 6432) - 138 lines
18. `bigQueryLinks` (Line 6570) - 154 lines
19. `bigQueryLinks` (Line 6724) - **303 lines** ⚠️ HIGH
20. `response` (Line 7027) - 108 lines
21. `response` (Line 7135) - 127 lines
22. `response` (Line 7262) - 110 lines
23. `response` (Line 7372) - 124 lines
24. `response` (Line 7609) - 107 lines
25. `response` (Line 7716) - 180 lines
26. `response` (Line 7896) - 188 lines

**Total GA4 Violations**: 26 violations

## src/gtm/tools.ts - All Violations

1. `response` (Line 3887) - 197 lines
2. `response` (Line 4084) - 115 lines
3. `response` (Line 4199) - 102 lines
4. `response` (Line 4309) - 107 lines
5. `response` (Line 4428) - 122 lines
6. `response` (Line 4550) - 100 lines
7. `response` (Line 4671) - 149 lines
8. `response` (Line 4820) - 115 lines
9. `response` (Line 4979) - 122 lines
10. `response` (Line 5134) - 94 lines

**Total GTM Violations**: 10 violations

## src/ads/transformers/ - New Violations

These are in the transformer modules we just created. They need refinement:

1. `campaigns` (campaign-transformer.ts:29) - 188 lines
2. `conversions` (conversion-transformer.ts:41) - 184 lines
3. `adGroups` (adgroup-transformer.ts:37) - 125 lines
4. `audiences` (audience-transformer.ts:44) - 126 lines
5. `strategies` (bidding-strategy-transformer.ts:46) - 118 lines
6. `budgets` (budget-transformer.ts:47) - 89 lines
7. `response` (gaql-transformer.ts:40) - 118 lines
8. `keywords` (keyword-transformer.ts:45) - 79 lines

**Total Transformer Violations**: 8 violations

## src/ads/tools.ts - Remaining Violations

The architecture checker is still reporting ~30 violations in `src/ads/tools.ts`. These are likely:
- False positives from `register*Tool` functions (mostly schema definitions)
- Helper functions that are close to the limit
- Functions that need further refinement

**Action**: Verify these are actual violations vs. false positives from schema-heavy registration functions.

## Refactoring Strategy

### Phase T.3.1: Document and Prioritize ✅ (Current)
- Document all violations
- Identify critical violations (>300 lines)
- Create refactoring plan

### Phase T.3.2: Fix Transformer Modules (Priority 1)
- Refine the 8 transformer modules we just created
- Break down large transformation functions
- Target: All transformer functions ≤50 lines

### Phase T.3.3: Fix GA4 Critical Violations (Priority 2)
- Fix the 4 critical violations first:
  1. `response` (Line 2270) - 1223 lines
  2. `eventCreateRules` (Line 3850) - 911 lines
  3. `audiences` (Line 5198) - 424 lines
  4. `bigQueryLinks` (Line 6724) - 303 lines
- Create GA4 transformer modules similar to Ads transformers

### Phase T.3.4: Fix GA4 Remaining Violations (Priority 3)
- Fix remaining 22 GA4 violations
- Apply same transformer pattern

### Phase T.3.5: Fix GTM Violations (Priority 4)
- Fix all 10 GTM violations
- Create GTM transformer modules if needed

### Phase T.3.6: Verify src/ads/tools.ts (Priority 5)
- Investigate remaining violations
- Fix actual violations
- Document false positives if needed

## Next Steps

1. ✅ Complete T.3.1: Document violations (current task)
2. **T.3.2**: Fix transformer module violations (8 violations)
3. **T.3.3**: Fix GA4 critical violations (4 violations)
4. **T.3.4**: Fix GA4 remaining violations (22 violations)
5. **T.3.5**: Fix GTM violations (10 violations)
6. **T.3.6**: Verify and fix src/ads/tools.ts remaining violations
