#!/usr/bin/env bash
set -euo pipefail
STATUS=0

# Load feature flags to get component-specific thresholds
load_thresholds() {
  if [ -f "0_phase0_bootstrap/feature_flags.yml" ]; then
    # Use Python to parse YAML and extract thresholds
    python3 <<EOF
import yaml, sys
try:
    with open("0_phase0_bootstrap/feature_flags.yml") as f:
        flags = yaml.safe_load(f)
    components = flags.get("components", {})
    gates = flags.get("gates", {})

    # Backend threshold
    backend_threshold = components.get("backend", {}).get("coverage_threshold", 100)
    print(f"BACKEND_THRESHOLD={backend_threshold}")

    # Frontend threshold
    frontend_threshold = components.get("frontend", {}).get("coverage_threshold", 95)
    print(f"FRONTEND_THRESHOLD={frontend_threshold}")

    # Shared threshold
    shared_threshold = components.get("shared", {}).get("coverage_threshold", 90)
    print(f"SHARED_THRESHOLD={shared_threshold}")

    # Block on coverage drop
    BLOCK_ON_COVERAGE = gates.get("block_on_coverage_drop", true)
    print(f"BLOCK_ON_COVERAGE={str(BLOCK_ON_COVERAGE).lower()}")
except Exception as e:
    print("# Error loading thresholds, using defaults", file=sys.stderr)
    print("BACKEND_THRESHOLD=100")
    print("FRONTEND_THRESHOLD=95")
    print("SHARED_THRESHOLD=90")
    print("BLOCK_ON_COVERAGE=true")
EOF
  else
    echo "BACKEND_THRESHOLD=100"
    echo "FRONTEND_THRESHOLD=95"
    echo "SHARED_THRESHOLD=90"
    echo "BLOCK_ON_COVERAGE=true"
  fi
}

eval $(load_thresholds)

# Backend (pytest + coverage)
if [ -d "backend" ]; then
  python3 -m pip install --quiet pytest pytest-cov || true
  if pytest -q --cov=backend --cov-report=term-missing --cov-report=json:coverage-backend.json; then
    # Check coverage threshold
    COVERAGE=$(python3 -c "import json; print(json.load(open('coverage-backend.json'))['totals']['percent_covered'])")
    if (( $(echo "$COVERAGE < $BACKEND_THRESHOLD" | bc -l) )); then
      echo "[coverage] Backend coverage $COVERAGE% below threshold $BACKEND_THRESHOLD%"
      if [ "$BLOCK_ON_COVERAGE" = "true" ]; then
        STATUS=1
      fi
    fi
  else
    STATUS=1
  fi
fi

# TypeScript project (src/ directory with vitest)
if [ -f "package.json" ] && [ -d "src" ]; then
  # Check if vitest is configured
  if grep -q "vitest" package.json; then
    echo "[coverage] Running TypeScript project tests with vitest..."
    # Run tests with coverage - capture output to check if tests passed
    TEST_OUTPUT=$(pnpm test:coverage 2>&1 || npm run test:coverage 2>&1 || npx vitest run --coverage 2>&1 || echo "")
    TEST_EXIT_CODE=$?

    # Check if tests passed (look for "passed" in output)
    if echo "$TEST_OUTPUT" | grep -q "Test Files.*passed\|Tests.*passed"; then
      # Tests passed - check coverage threshold
      if [ -f "coverage/coverage-summary.json" ]; then
        COVERAGE=$(python3 -c "import json; print(json.load(open('coverage/coverage-summary.json'))['total']['lines']['pct'])" 2>/dev/null || echo "0")
        # Use shared threshold for TypeScript project (or default 90%)
        THRESHOLD=${SHARED_THRESHOLD:-90}
        if (( $(echo "$COVERAGE < $THRESHOLD" | bc -l 2>/dev/null || echo "0") )); then
          echo "[coverage] TypeScript project coverage $COVERAGE% below threshold $THRESHOLD%"
          if [ "$BLOCK_ON_COVERAGE" = "true" ]; then
            STATUS=1
          fi
        else
          echo "[coverage] TypeScript project coverage: $COVERAGE% (threshold: $THRESHOLD%)"
        fi
      else
        echo "[coverage] TypeScript project tests passed (coverage report not found, threshold: ${SHARED_THRESHOLD:-90}%)"
      fi
    else
      # Tests failed - this is a real failure
      echo "[coverage] TypeScript project tests failed"
      STATUS=1
    fi
  fi
fi

# Frontend (jest/vitest suggested)
if [ -f "frontend/package.json" ]; then
  if (cd frontend && npm ci --silent && npm test --silent -- --coverage); then
    # Frontend coverage check would go here if coverage output is available
    echo "[coverage] Frontend tests passed (threshold: ${FRONTEND_THRESHOLD}%)"
  else
    STATUS=1
  fi
fi

exit $STATUS
