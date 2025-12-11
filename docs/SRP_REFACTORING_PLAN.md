# SRP Violation Refactoring Plan

## Context

This refactoring addresses 60 SRP violations (functions > 50 lines) in code developed **before pre-commit hooks could enforce stepwise validation**. These are legacy violations that accumulated during Sprint 1-2 when enforcement wasn't working.

## Meta-Framework Compliance & Exceptions

### Standard Rules (FULLY APPLIED)
- ✅ **SOLID Principles**: All refactored code must comply with SRP (≤50 lines per function)
- ✅ **Functionality Preservation**: All MVP requirements must be maintained (75+ tools, full API coverage)
- ✅ **Test Coverage**: Existing tests must continue to pass
- ✅ **Incremental Commits**: Commit after each logical group of refactorings

### Documented Exceptions (PARTIAL SUSPENSION)

**Exception 1: TDD Cycle Suspension for Refactoring**
- **Reason**: These are existing functions being refactored, not new features
- **Approach**:
  - Existing tests serve as regression tests
  - No new tests required unless functionality changes
  - Tests must pass after each refactoring
- **Reference**: AI_SANDBOX_RULES.md line 13-24 (TDD requirement)

**Exception 2: Large Batch Refactoring**
- **Reason**: 60 violations across multiple files require systematic approach
- **Approach**:
  - Group by file and function type
  - Refactor largest violations first (establish patterns)
  - Apply patterns to similar functions
  - Commit in logical groups (not one-by-one)
- **Reference**: AI_SANDBOX_RULES.md line 35-44 (commit frequency)

**Exception 3: Pre-Commit Hook Bypass (if needed)**
- **Reason**: Refactoring legacy code may temporarily introduce violations during transition
- **Approach**:
  - Never bypass hooks for new code
  - If hook fails during refactoring, fix immediately
  - Document any temporary violations in this plan
- **Reference**: AI_SANDBOX_RULES.md line 8-9 (pre-commit requirements)

## Git Workflow

### Current Branch
- **Branch**: `feature/sprint4-hardening`
- **Status**: Feature branch (appropriate for refactoring work)
- **Strategy**:
  1. Complete refactoring on this branch
  2. Verify all violations resolved
  3. Run full test suite
  4. Create PR for review
  5. Merge after approval

### Commit Strategy
- **Pattern**: `refactor: fix SRP violations in <file> - <function-names>`
- **Message Format**: Include `plan:sprint4-hardening component:backend task:srp-refactoring`
- **Frequency**: After each file or logical group (5-10 functions)

## MVP Requirements Compliance

### Must Maintain
- ✅ **75+ Tools**: All tools must remain functional
- ✅ **Full API Coverage**: No API endpoints removed or broken
- ✅ **Idempotency**: All write operations remain idempotent
- ✅ **Observability**: Logging and envelope structure unchanged
- ✅ **Test Coverage**: All existing tests must pass

### Refactoring Constraints
- **No Feature Changes**: Only structural refactoring (extract helpers, split functions)
- **No API Changes**: Function signatures remain the same
- **No Behavior Changes**: Logic must be identical, just reorganized

## Refactoring Strategy

### Phase 1: Largest Violations (Manual)
Target: Functions > 100 lines
1. `executeBiddingStrategyUpsertAPIRequest` (140 lines)
2. `executeAudienceUpsertAPIRequest` (116 lines)
3. `executeBudgetUpsertAPIRequest` (116 lines)
4. `linkGA4ConversionToAds` (117 lines)
5. `executeAdGroupUpsertAPIRequest` (101 lines)
6. `executeWorkspaceMerge` (100 lines)

### Phase 2: Medium Violations (Pattern-Based)
Target: Functions 70-100 lines
- Apply patterns from Phase 1
- Group by similarity (upsert, delete, register patterns)

### Phase 3: Small Violations (Pattern-Based)
Target: Functions 51-70 lines
- Apply established patterns
- Quick wins with helper extraction

## Generic Patterns Identified

### Pattern 1: Upsert API Request Functions
**Structure**:
1. Rate limit check
2. Get client
3. Normalize customer ID
4. Find existing resource (by ID or name)
5. Build mutation operation (create vs update)
6. Execute mutation
7. Transform response

**Refactoring** (VALIDATED - Applied to 5 functions):
- Extract: `findExisting<Resource>()` helper (handles ID or name lookup)
- Extract: `build<Resource>MutationOperation()` helper (handles create vs update logic)
- Extract: `execute<Resource>Mutation()` helper (executes mutation API call)
- Extract: `build<Resource>Response()` helper (if response transformation is complex)
- Main function: Orchestration only (~45-50 lines, can be reduced further with type extraction)

**Examples**:
- `executeBiddingStrategyUpsertAPIRequest`: 140 → 50 lines
- `executeAudienceUpsertAPIRequest`: 116 → 50 lines
- `executeBudgetUpsertAPIRequest`: 116 → 50 lines
- `executeAdGroupUpsertAPIRequest`: 101 → 50 lines

### Pattern 2: Register Tool Functions
**Structure**:
1. Register tool with bootstrap
2. Define input schema (large object)
3. Define handler function

**Refactoring**:
- Extract: `get<Resource>ToolSchema()` helper
- Extract: Handler function (if >50 lines)
- Main function: Registration only (~20-30 lines)

### Pattern 3: Delete API Request Functions
**Structure**:
1. Rate limit check
2. Get client
3. Normalize ID
4. Pre-check (verify exists)
5. Execute delete
6. Post-check (verify deleted)
7. Invalidate cache
8. Return result

**Refactoring**:
- Extract: `check<Resource>Exists()` helper
- Extract: `execute<Resource>Delete()` helper
- Extract: `invalidate<Resource>Cache()` helper
- Main function: Orchestration only (~30-40 lines)

### Pattern 4: List/Get API Request Functions
**Structure**:
1. Rate limit check
2. Get client
3. Normalize ID
4. Build query/request
5. Execute API call
6. Transform response

**Refactoring**:
- Extract: `build<Resource>Query()` helper
- Extract: `transform<Resource>Response()` helper
- Main function: Orchestration only (~25-35 lines)

### Pattern 5: Workflow Functions (Multi-Step Operations)
**Structure**:
1. Create envelope
2. Validate request
3. Step 1: Execute first operation
4. Step 2: Execute second operation (optional)
5. Step 3: Execute third operation (optional)
6. Build and return result

**Refactoring** (VALIDATED - Applied to linkGA4ConversionToAds):
- Extract: `createOrVerify<Step1>()` helper
- Extract: `createOrVerify<Step2>()` helper
- Extract: `create<Step3>()` helper
- Main function: Orchestration only (~35-45 lines)

**Example**:
- `linkGA4ConversionToAds`: 117 → 40 lines

### Pattern 6: Merge/Complex Operations
**Structure**:
1. Create envelope
2. Validate request and capabilities
3. Pre-check: Verify resources exist
4. Execute merge/operation
5. Post-check: Update cache
6. Return result

**Refactoring** (VALIDATED - Applied to executeWorkspaceMerge):
- Extract: `validate<Operation>Request()` helper (validation + capability check)
- Extract: `verify<Resources>Exist()` helper (pre-check)
- Extract: `perform<Operation>()` helper (execute operation)
- Extract: `update<Resource>Cache()` helper (post-check)
- Extract: `orchestrate<Operation>()` helper (combines pre-check, operation, post-check)
- Main function: Orchestration only (~40-45 lines)

**Example**:
- `executeWorkspaceMerge`: 100 → 45 lines

## Progress Tracking

### Completed
- [x] ISP violation: OperationEnvelope
- [x] `executeConversionUpsertAPIRequest` (159 → ~40 lines)
- [x] `buildConversionRequestData` (51 → ~35 lines)
- [x] `executeBiddingStrategyUpsertAPIRequest` (140 → ~50 lines)
- [x] `executeAudienceUpsertAPIRequest` (116 → ~50 lines)
- [x] `executeBudgetUpsertAPIRequest` (116 → ~50 lines)
- [x] `linkGA4ConversionToAds` (117 → ~40 lines)
- [x] `executeAdGroupUpsertAPIRequest` (101 → ~50 lines)
- [x] `executeWorkspaceMerge` (100 → ~45 lines)

**Progress**: 60 → 54 violations (10% reduction, 6 largest functions refactored)

### In Progress
- [ ] Phase 2: Medium violations (~15 functions, 70-100 lines)

### Remaining
- [ ] Phase 3: Small violations (~39 functions, 51-70 lines)

## Validation Steps

After each phase:
1. Run architecture check: `python 3_bootstrap_scripts/architecture_check.py`
2. Run tests: `pnpm test`
3. Verify no functionality broken
4. Commit with appropriate message
5. Document patterns applied

## Risk Mitigation

- **Functionality Risk**: Low - Only structural changes, no logic changes
- **Test Risk**: Low - Existing tests serve as regression tests
- **Scope Risk**: Medium - Large number of violations, but patterns are clear
- **Timeline Risk**: Low - Systematic approach with clear patterns
