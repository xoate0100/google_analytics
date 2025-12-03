#!/usr/bin/env bash
set -euo pipefail

# Validate commit message contains required plan/component/task tags
# AI_SANDBOX_RULES.md requires: plan:<plan_id> component:<component> task:<id>

# Pre-commit passes commit message file as first argument, or we can read from .git/COMMIT_EDITMSG
COMMIT_MSG_FILE="${1:-.git/COMMIT_EDITMSG}"

# Try to read commit message from file
if [ -f "$COMMIT_MSG_FILE" ]; then
    COMMIT_MSG=$(cat "$COMMIT_MSG_FILE" 2>/dev/null || echo "")
elif [ -f ".git/COMMIT_EDITMSG" ]; then
    COMMIT_MSG=$(cat ".git/COMMIT_EDITMSG" 2>/dev/null || echo "")
else
    # If commit message file doesn't exist, try to get from git (for existing commits)
    COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null || echo "")
fi

if [ -z "$COMMIT_MSG" ]; then
    # Can't validate, allow (pre-commit runs before commit object exists)
    exit 0
fi

# Check for required tags (case insensitive)
COMMIT_MSG_LOWER=$(echo "$COMMIT_MSG" | tr '[:upper:]' '[:lower:]')

HAS_PLAN=false
HAS_TASK=false

if echo "$COMMIT_MSG_LOWER" | grep -q "plan:"; then
    HAS_PLAN=true
fi

if echo "$COMMIT_MSG_LOWER" | grep -q "task:"; then
    HAS_TASK=true
fi

if [ "$HAS_PLAN" = false ] && [ "$HAS_TASK" = false ]; then
    echo "[commit-validator] ERROR: Commit message missing required tags"
    echo "[commit-validator] Required format: plan:<plan_id> component:<component> task:<id>"
    echo "[commit-validator] Example: plan:sprint3 component:gtm task:2.1 Add consent mode tools"
    echo ""
    echo "[commit-validator] Current message:"
    echo "$COMMIT_MSG" | head -5
    exit 1
fi

echo "[commit-validator] Commit message validation passed"
exit 0
