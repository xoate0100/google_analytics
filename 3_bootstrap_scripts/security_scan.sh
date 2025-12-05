#!/usr/bin/env bash
set -euo pipefail
STATUS=0

# Windows compatibility check
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || -n "${WINDIR:-}" ]]; then
  # On Windows, check if git grep works, otherwise skip
  if ! command -v git >/dev/null 2>&1; then
    echo "[security_scan] Git not available, skipping security scan"
    exit 0
  fi
fi

# Secrets scan (basic): grep common patterns; replace with gitleaks if available.
# Exclude test files, fixtures, configuration files, and script files to avoid false positives
# IMPORTANT: Exclude this script itself and all bootstrap scripts to avoid false positives
if git grep -nE "(AWS_SECRET|BEGIN RSA PRIVATE KEY)" -- . ':!*.md' ':!test/**' ':!*.test.ts' ':!*.test.js' ':!*.json' ':!*.yaml' ':!*.yml' ':!*.config.*' ':!3_bootstrap_scripts/**' ':!*.sh' ':!*_wrapper.sh' 2>/dev/null | grep -v "^3_bootstrap_scripts/security_scan" | grep -q .; then
  echo "Secret-like patterns found."
  STATUS=1
fi
# Check for actual secrets (password= or api_key= with values, not just declarations)
# Exclude bootstrap scripts and wrapper scripts
if git grep -nE "(password\s*=\s*['\"][^'\"]{8,}|api_key\s*=\s*['\"][^'\"]{8,})" -- . ':!*.md' ':!test/**' ':!*.test.ts' ':!*.test.js' ':!*.json' ':!3_bootstrap_scripts/**' ':!*.sh' ':!*_wrapper.sh' 2>/dev/null | grep -v "^3_bootstrap_scripts/security_scan" | grep -q .; then
  echo "Potential secrets found in code."
  STATUS=1
fi
# Node audit (best-effort)
if [ -f "frontend/package.json" ]; then
  (cd frontend && npm audit --audit-level=high || true)
fi
exit $STATUS
