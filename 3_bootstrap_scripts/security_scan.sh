#!/usr/bin/env bash
set -euo pipefail
STATUS=0
# Secrets scan (basic): grep common patterns; replace with gitleaks if available.
# Exclude test files, fixtures, configuration files, and script files to avoid false positives
if git grep -nE "(AWS_SECRET|BEGIN RSA PRIVATE KEY)" -- . ':!*.md' ':!test/**' ':!*.test.ts' ':!*.test.js' ':!*.json' ':!*.yaml' ':!*.yml' ':!*.config.*' ':!3_bootstrap_scripts/**' ':!*.sh' ; then
  echo "Secret-like patterns found."
  STATUS=1
fi
# Check for actual secrets (password= or api_key= with values, not just declarations)
if git grep -nE "(password\s*=\s*['\"][^'\"]{8,}|api_key\s*=\s*['\"][^'\"]{8,})" -- . ':!*.md' ':!test/**' ':!*.test.ts' ':!*.test.js' ':!*.json' ; then
  echo "Potential secrets found in code."
  STATUS=1
fi
# Node audit (best-effort)
if [ -f "frontend/package.json" ]; then
  (cd frontend && npm audit --audit-level=high || true)
fi
exit $STATUS
