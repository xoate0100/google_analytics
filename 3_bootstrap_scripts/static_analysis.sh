#!/usr/bin/env bash
set -euo pipefail
STATUS=0
if [ -d "backend" ]; then
  # Check if there are any Python files in backend
  if find backend -name "*.py" -o -name "*.pyi" 2>/dev/null | grep -q .; then
    python3 -m pip install --quiet flake8 mypy || true
    flake8 backend || STATUS=1
    mypy backend || STATUS=1
  else
    # No Python files in backend, skip static analysis
    echo "[static-analysis] No Python files found in backend/, skipping"
  fi
fi
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  (cd frontend && npm ci --silent && npm run -s typecheck || npm run -s build --if-present) || STATUS=1
fi
exit $STATUS
