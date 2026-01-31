#!/usr/bin/env bash
# Sync from project-initializer (meta-framework upstream)
# Pulls latest framework updates and re-initializes dev environment.
# Usage:
#   META_FRAMEWORK_UPSTREAM=https://github.com/your-org/project-initializer.git bash scripts/sync_from_project_initializer.sh
#   bash scripts/sync_from_project_initializer.sh https://github.com/your-org/project-initializer.git
set -e

REMOTE_NAME="project-initializer"
UPSTREAM_BRANCH="${META_FRAMEWORK_BRANCH:-main}"
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# Resolve upstream URL: arg, then env
UPSTREAM_URL="$1"
if [ -z "$UPSTREAM_URL" ]; then
  UPSTREAM_URL="${META_FRAMEWORK_UPSTREAM:-$PROJECT_INITIALIZER_REPO}"
fi
if [ -z "$UPSTREAM_URL" ]; then
  echo "Usage: META_FRAMEWORK_UPSTREAM=<git-url> $0"
  echo "   or: $0 <git-url>"
  echo "Example: $0 https://github.com/your-org/project-initializer.git"
  exit 1
fi

echo "[sync] Adding or updating remote '$REMOTE_NAME'..."
if git remote get-url "$REMOTE_NAME" 2>/dev/null; then
  git remote set-url "$REMOTE_NAME" "$UPSTREAM_URL"
else
  git remote add "$REMOTE_NAME" "$UPSTREAM_URL"
fi

echo "[sync] Fetching from $REMOTE_NAME..."
git fetch "$REMOTE_NAME"

echo "[sync] Merging $REMOTE_NAME/$UPSTREAM_BRANCH into current branch..."
if git merge "$REMOTE_NAME/$UPSTREAM_BRANCH" -m "chore: sync from project-initializer ($UPSTREAM_BRANCH)" --no-edit 2>/dev/null; then
  echo "[sync] Merge completed."
else
  echo "[sync] Merge had conflicts or failed. Resolve manually and run: git add . && git commit"
  exit 1
fi

echo "[sync] Installing dependencies..."
if [ -f "package.json" ]; then
  if command -v pnpm &>/dev/null; then
    pnpm install
  else
    npm install
  fi
fi
if [ -f "requirements.txt" ]; then
  pip install -r requirements.txt 2>/dev/null || true
fi

echo "[sync] Installing pre-commit hooks..."
pre-commit install 2>/dev/null || true

echo "[sync] Running full validation..."
python3 3_bootstrap_scripts/cli.py validate 2>/dev/null || pre-commit run --all-files || true

echo "[sync] Done. Dev environment is up to date with project-initializer."
