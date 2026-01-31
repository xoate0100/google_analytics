# Master Git Meta-Framework (L2.5 Single-Agent Sandbox)

## Use

### Initial Setup (One Time)

1. **Customize MVP Specification** (optional but recommended):
   - Edit `0_phase0_bootstrap/MVP_SPECIFICATION.yaml` with your project details

2. **Run initialization**:
   ```bash
   python3 3_bootstrap_scripts/cli.py init
   ```

3. **Review generated plan**:
   - Check `6_ai_runtime_context/ACTIVE_PLAN.yaml`
   - Modify if needed

### Development Workflow

4. In Cursor, open `0_phase0_bootstrap/AI_SANDBOX_RULES.md` and run your plan
5. The agent commits autonomously when all hooks pass, then open a PR

**Current status:** MVP Sprints 1–4 and Auth/Docker setup completed. Next: merge `feature/auth-complete-docker-setup` via PR (see `CREATE_PR.md`), or start next feature. Active context: `6_ai_runtime_context/ACTIVE_TASK_POINTER.yaml`, `4_docs_index/DOCUMENTATION_INDEX.md`.

See `INITIALIZATION_GUIDE.md` for detailed instructions (if present).

## Multi-Component
- frontend/, backend/, shared/ with per-component routing and thresholds.
- Architecture boundaries enforced via `5_reference_architectures/LAYER_RULES.yaml`.

## Quality Gates
- Pre-commit: syntax, format, static/type, security, architecture, AI behavior, tests+coverage, docs, complexity, performance, commit schema.
- CI PR checks mirror and publish reports.

## Maturity
- Current: **L2.5** (Single-Agent Sandbox).
- Path to L3: flip flags in `feature_flags.yml` when ready (docs auto-updates, standards sync PRs, limited auto-refactors).
