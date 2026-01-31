# Meta-Framework Sync (Project-Initializer Pull Flow)

This document describes how to pull the latest updates from **project-initializer** per the meta-framework flow and ensure the development environment is properly initialized with the latest framework features.

## Overview

- **Phase 0** meta-framework content lives in: `0_phase0_bootstrap`, `1_global_standards`, `2_framework_templates`, `3_bootstrap_scripts`, `4_docs_index`, `5_reference_architectures`, `7_schemas`, `8_ci`, `.github`, and related config files.
- To get updates from the canonical framework (project-initializer), add it as a git remote, fetch, and merge (or sync selected paths).
- After pulling, re-install dependencies and run validation so the dev environment matches the latest project-initializer features.

## Prerequisites

- Git remotes: `origin` = your repo; you will add `project-initializer` as upstream.
- The project-initializer repo URL (e.g. `https://github.com/your-org/project-initializer.git`).

## Sync Flow

### 1. Set the upstream URL

In `.env` (or your shell), set:

```bash
export META_FRAMEWORK_UPSTREAM=https://github.com/your-org/project-initializer.git
# optional: default branch to pull from
export META_FRAMEWORK_BRANCH=main
```

Or pass the URL when running the script (see step 2).

### 2. Run the sync script

From the repo root:

```bash
# Option A: URL from environment
META_FRAMEWORK_UPSTREAM=https://github.com/your-org/project-initializer.git bash scripts/sync_from_project_initializer.sh

# Option B: URL as argument
bash scripts/sync_from_project_initializer.sh https://github.com/your-org/project-initializer.git
```

The script will:

1. Add or update the `project-initializer` remote.
2. Fetch from `project-initializer`.
3. Merge `project-initializer/main` (or `META_FRAMEWORK_BRANCH`) into the current branch.
4. Run `pnpm install` (or `npm install`) and optionally `pip install -r requirements.txt`.
5. Run `pre-commit install`.
6. Run full validation (`cli.py validate` / pre-commit on all files).

If the merge has conflicts, resolve them, then run:

```bash
git add .
git commit -m "chore: resolve project-initializer sync conflicts"
```

### 3. Re-initialize (optional)

If project-initializer changed bootstrap scripts or structure and you want to re-run the initializer (e.g. to regenerate `ACTIVE_PLAN.yaml` or feature flags from `MVP_SPECIFICATION.yaml`):

```bash
rm -f .initialized
python3 3_bootstrap_scripts/cli.py init
```

**Caution:** Re-init can overwrite local customizations in `0_phase0_bootstrap/feature_flags.yml`, `6_ai_runtime_context/ACTIVE_PLAN.yaml`, etc. Prefer re-init only when you intend to adopt the latest template behavior.

## Manual steps (without script)

1. Add remote and fetch:
   ```bash
   git remote add project-initializer https://github.com/your-org/project-initializer.git
   git fetch project-initializer
   ```
2. Merge (or sync only framework paths):
   ```bash
   git merge project-initializer/main -m "chore: sync from project-initializer"
   ```
3. Install and validate:
   ```bash
   pnpm install && pre-commit install && pre-commit run --all-files
   ```

## Verify dev environment

After sync, confirm:

- [ ] `pnpm install` / `npm install` completes without errors.
- [ ] `pre-commit install` succeeds.
- [ ] `python3 3_bootstrap_scripts/cli.py validate` (or `pre-commit run --all-files`) passes.
- [ ] Tests: `pnpm test` (or `npm test`) passes.
- [ ] No uncommitted changes in meta-framework paths unless you intentionally customized them.

## Related

- **Initial one-time setup:** `python3 3_bootstrap_scripts/cli.py init` (see [README](../README.md)).
- **Pre-commit and CI:** [PRE_COMMIT_SETUP.md](PRE_COMMIT_SETUP.md), [CI_CD_SETUP.md](CI_CD_SETUP.md).
- **MVP spec and schema:** [MVP_SPECIFICATION_GUIDE.md](../1_global_standards/MVP_SPECIFICATION_GUIDE.md).
