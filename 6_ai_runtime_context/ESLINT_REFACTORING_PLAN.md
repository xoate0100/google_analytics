# ESLint Warnings Refactoring Plan

## Overview
- **Total Warnings**: 126
- **Goal**: Fix all warnings by refactoring to meet SOLID principles (max 50 lines, complexity ≤ 10)
- **Strategy**: Incremental refactoring with commits after each phase

## Categorization

### Phase 1: Critical Priority (Complexity > 20 or Lines > 100)
**Target**: 8 functions
1. `discoverGTMCapabilities` - 112 lines, complexity 34
2. `executeKeywordUpsertAPIRequest` - 134 lines, complexity 28
3. `executeConversionUpsertAPIRequest` - 137 lines, complexity 28
4. `executeBiddingStrategyUpsertAPIRequest` - 140 lines, complexity 27
5. `executeAudienceUpsertAPIRequest` - 127 lines, complexity 25
6. `executeBudgetUpsertAPIRequest` - 116 lines, complexity 23
7. `executeAdGroupUpsertAPIRequest` - 115 lines, complexity 20
8. `executeWorkspaceMerge` - 100 lines

### Phase 2: High Priority (Complexity 15-20 or Lines 70-100)
**Target**: 15 functions
1. `discoverGA4Capabilities` - 85 lines, complexity 17
2. `executeBiddingStrategyGetAPIRequest` - 76 lines, complexity 15
3. `executeTagSequenceUpdateAPIRequest` - 61 lines, complexity 15
4. `executeDataLayerValidate` - 99 lines, complexity 14
5. `executeDataLayerEventsList` - 104 lines, complexity 14
6. `executeDataLayerSchemaGenerate` - 96 lines
7. `executeCampaignPauseAPIRequest` - 76 lines, complexity 11
8. `executeKeywordDeleteAPIRequest` - 75 lines, complexity 11
9. `executeConversionDelete` - 91 lines, complexity 11
10. `executeConversionEnhancedAPIRequest` - 78 lines, complexity 12
11. `executeAudienceAttachAPIRequest` - 91 lines, complexity 12
12. `executeTagPriorityUpdateAPIRequest` - complexity 13
13. `executeEnhancedMeasurementUpdateAPIRequest` - 59 lines, complexity 13
14. `executePropertyDelete` - 89 lines
15. `executeDataStreamDelete` - 89 lines

### Phase 3: Medium Priority (Lines 50-70, Complexity 10-12)
**Target**: ~40 functions
- All `*ListAPIRequest` functions (51-66 lines)
- All `*GetAPIRequest` functions (54-67 lines)
- All `register*Tool` functions (51-77 lines)
- Various delete/update functions

### Phase 4: Test Files (Lines > 300)
**Target**: 7 test files
- These are test files, can be split into smaller test suites

### Phase 5: Missing Return Types
**Target**: 6 functions
- All in `src/core/postcheck.ts` - add explicit return types

## Refactoring Patterns

### Pattern 1: Extract Helper Functions
- Normalize customer ID → `normalizeCustomerId()`
- Escape SQL strings → `escapeSqlString()`
- Extract resource IDs → `extractResourceId()`
- Find existing resources → `findExisting*()` helpers
- Build mutation operations → `build*MutationOperation()` helpers

### Pattern 2: Split Large Functions
- Separate API request logic from business logic
- Extract validation/transformation logic
- Create focused helper functions for each responsibility

### Pattern 3: Reduce Complexity
- Extract conditional logic into separate functions
- Use early returns to reduce nesting
- Replace complex conditionals with strategy patterns where appropriate

### Pattern 4: Register Functions
- Extract common tool registration patterns
- Create reusable registration helpers

## Execution Strategy

1. **Phase 1**: Fix critical violations (8 functions) - 2-3 commits
2. **Phase 2**: Fix high priority violations (15 functions) - 3-4 commits
3. **Phase 3**: Fix medium priority violations (~40 functions) - 5-6 commits
4. **Phase 4**: Split test files (7 files) - 1-2 commits
5. **Phase 5**: Add missing return types (6 functions) - 1 commit

**Total Estimated Commits**: 12-16 commits

## Progress Tracking

- [x] Phase 0: Setup (remove .eslintignore, add helper functions)
- [ ] Phase 1: Critical Priority (0/8)
- [ ] Phase 2: High Priority (0/15)
- [ ] Phase 3: Medium Priority (0/40)
- [ ] Phase 4: Test Files (0/7)
- [ ] Phase 5: Missing Return Types (0/6)
