# Troubleshooting Plan Context

## Situation

During comprehensive meta-framework audit, critical enforcement gaps were identified:

1. **Pre-commit hooks were not installed** during Sprint 1 and partial Sprint 2
2. **Architecture checks were not scanning `src/` directory** (only checked `frontend/`, `backend/`, `shared/`)
3. **Test coverage was not checking TypeScript project** (only checked Python backend)
4. **Commit message validator was a stub** (always passed)
5. **Result**: 66+ SRP violations accumulated in `src/ads/tools.ts` and potentially other files

## Impact

- **66+ SRP violations** in `src/ads/tools.ts` (functions >50 lines)
- These violations should have been **blocked** by pre-commit hooks
- Development proceeded without proper enforcement
- Codebase not compliant with meta-framework standards

## Resolution Strategy

1. **Suspend main plan** (`mcp-google-marketing-mvp`, Sprint 3)
2. **Create troubleshooting plan** (`meta-framework-compliance-fix`)
3. **Fix all enforcement mechanisms** (Phase T.1 - COMPLETED)
4. **Refactor all SRP violations** (Phase T.2-T.3)
5. **Validate test coverage** (Phase T.4)
6. **Document and verify** (Phase T.5)
7. **Resume main plan** when all fixes complete

## Current Status

- ✅ **Phase T.1 Complete**: All enforcement mechanisms fixed
- 🔄 **Phase T.2 In Progress**: SRP violations analysis and refactoring
- ⏸️ **Main Plan Suspended**: Sprint 3 paused at task 3.5.4

## Files Modified (Troubleshooting)

### Enforcement Scripts (Allowed - meta-framework updates)
- `3_bootstrap_scripts/architecture_check.py` - Now scans `src/`
- `3_bootstrap_scripts/tests_coverage.sh` - Now checks TypeScript
- `3_bootstrap_scripts/commit_validator.sh` - Now validates commit messages
- `3_bootstrap_scripts/guardrail_enforcement.py` - Fixed path handling, allows feedback log
- `.husky/pre-commit` - Integrated pre-commit framework
- `package.json` - Added prepare script

### Troubleshooting Plan Files (Allowed - runtime context)
- `6_ai_runtime_context/TROUBLESHOOTING_PLAN.yaml` - Troubleshooting plan
- `6_ai_runtime_context/TROUBLESHOOTING_CONTEXT.md` - This file
- `6_ai_runtime_context/ACTIVE_PLAN.yaml` - Suspended main plan
- `6_ai_runtime_context/ACTIVE_TASK_POINTER.yaml` - Points to troubleshooting tasks
- `6_ai_runtime_context/ai_feedback_log.json` - Updated with troubleshooting context

### Documentation (Allowed - docs/)
- `META_FRAMEWORK_AUDIT_REPORT.md` - Comprehensive audit
- `META_FRAMEWORK_VALIDATION_SUMMARY.md` - Fix summary

## Next Steps

1. **Task T.2.1**: Analyze and document all SRP violations
2. **Task T.2.2-T.2.5**: Refactor `src/ads/tools.ts` systematically
3. **Task T.3.1-T.3.2**: Check and fix any other violations
4. **Task T.4.1-T.4.2**: Validate test coverage
5. **Task T.5.1-T.5.2**: Document and resume main plan

## Resumption Criteria

Main plan can resume when:
- ✅ All SRP violations resolved
- ✅ All tests passing with >90% coverage
- ✅ All pre-commit hooks enforcing
- ✅ Architecture checks passing
- ✅ Documentation updated

## Notes

- Troubleshooting plan follows same structure as main plan
- All troubleshooting files in allowed directories (`6_ai_runtime_context/`, `docs/`, `3_bootstrap_scripts/`)
- Meta-framework blocking avoided by using allowed paths
- Stateful tracking maintained through ACTIVE_TASK_POINTER.yaml
