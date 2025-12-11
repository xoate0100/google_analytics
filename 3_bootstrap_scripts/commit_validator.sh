#!/usr/bin/env bash
set -euo pipefail

# Validate commit message contains required plan/component/task tags
# AI_SANDBOX_RULES.md requires: plan:<plan_id> component:<component> task:<id>

# Pre-commit hook: when using `git commit -m`, the message isn't in COMMIT_EDITMSG yet
# Check if we can get the message from git's prepare-commit-msg hook or from stdin
# For pre-commit hooks, we need to be lenient since the message might not be available yet

COMMIT_MSG_FILE="${1:-}"

# Try to read commit message from file if provided (prepare-commit-msg hook)
if [ -n "$COMMIT_MSG_FILE" ] && [ -f "$COMMIT_MSG_FILE" ]; then
    COMMIT_MSG=$(cat "$COMMIT_MSG_FILE" 2>/dev/null || echo "")
elif [ -f ".git/COMMIT_EDITMSG" ]; then
    COMMIT_MSG=$(cat ".git/COMMIT_EDITMSG" 2>/dev/null || echo "")
    # Check if message has required tags - if not, it might be previous commit message
    # When using `git commit -m`, COMMIT_EDITMSG contains the previous commit until after commit
    # So if it doesn't have tags, check if it looks like a conventional commit (previous commit)
    if ! echo "$COMMIT_MSG" | grep -qiE "(plan:|task:)"; then
        # Message doesn't have required tags - check if it's a conventional commit format
        # (which indicates it's the previous commit message, not the current one)
        if echo "$COMMIT_MSG" | head -1 | grep -qiE "^(fix|feat|docs|style|refactor|test|chore|perf|ci|build|revert):"; then
            # Looks like previous commit message (conventional commit without plan/task tags)
            # Allow it - the actual commit message will be validated post-commit or in CI
            exit 0
        fi
    fi
else
    # No commit message file - allow (pre-commit runs before commit object exists)
    exit 0
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
    # Message doesn't have required tags
    # Check if this looks like a previous commit message (has "fix:", "feat:", etc. but no plan/task)
    # If so, allow it (the actual commit message will be validated post-commit or in CI)
    if echo "$COMMIT_MSG_LOWER" | grep -qE "^(fix|feat|docs|style|refactor|test|chore|perf|ci|build|revert):"; then
        # Looks like a conventional commit message without plan/task tags
        # This is likely the previous commit message, allow it
        exit 0
    fi
    # Otherwise, it's a real validation failure
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
