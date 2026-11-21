# RATCHET_RECEIPT

**Repository:** `xoate0100/google_analytics`


## Fleet normalization task 6 (2026-09-23T22:25:59Z)

**Plan:** `fleet-normalization-v1`  
**Repo:** `xoate0100/google_analytics`  
**Change:** un-neuter / spoke_partial gap close

### Files

- `.github/workflows/pr-validation.yml`
- `.github/workflows/pr_checks.yml`
- `.github/workflows/quality.yml`
- `.github/workflows/security.yml`
- `RATCHET_RECEIPT.md`

### Notes

- pr-validation.yml: stripped 2 swallows
- pr_checks.yml: stripped 4 swallows
- pr_checks.yml: added mkdir -p ai_reports
- quality.yml: stripped 3 swallows
- security.yml: stripped 1 swallows
- No `--no-verify`; no force-merge; no swallowed steps restored.


## Close-the-stalls task 4 (2026-11-21T01:12:00Z)

**Plan:** `close-the-stalls-v1`  
**Repo:** `xoate0100/google_analytics`  
**PR:** #13 (`normalize/un-neuter-task6-20260923`)

### Evidence

- EV-GA-PNPM-ORDER: pnpm/action-setup before setup-node cache:pnpm
- EV-GA-PNPM9: action-setup version 9 for lockfileVersion 9.0
- EV-GA-BASH-SCANS: invoke .sh bootstrap scans with bash (not python3)
- EV-GA-COV-RATCHET: vitest coverage include src/; thresholds lines/funcs/stmts 80/83/80 branches 67
- EV-GA-PRETTIER-IGNORE: ignore 6_ai_runtime_context (invalid historical YAML keys)
- EV-GA-FORMAT-SCOPE: format:check limited to src/test/scripts + root ts/json configs
- EV-GA-AUDIT-CRITICAL: audit-level=critical (blocking); moderate/high deferred (zod@3 + google transitive)
- EV-GA-DEPS: sdk>=1.32, vitest>=3.2.6, pnpm overrides for patched transitive CVEs
- EV-GA-POOL-RACE: connection-pool tests wait for async minSize init
- No `--no-verify`; no swallows (`|| true` / continue-on-error) restored; do not merge.
