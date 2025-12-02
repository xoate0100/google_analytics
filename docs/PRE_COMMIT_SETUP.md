# Pre-commit Hook Setup

## Existing Meta-Framework Hooks

The project uses the meta-framework's pre-commit configuration located at `.pre-commit-config.yaml`.

## Project-Specific Hooks

The following hooks are configured in the meta-framework and will run automatically:

1. **Syntax Validation** - Validates file syntax
2. **Formatting** - Runs Prettier (configured in `.prettierrc.json`)
3. **Linting** - Runs ESLint (configured in `.eslintrc.json`)
4. **Type Checking** - Runs TypeScript type checking
5. **Security Scanning** - Scans for security issues
6. **Architecture Checks** - Validates SOLID principles and architecture rules
7. **Test Execution** - Runs tests (if code files are modified)
8. **Coverage Checks** - Validates test coverage thresholds
9. **Documentation Sync** - Ensures documentation is up to date

## Installation

Pre-commit hooks are installed automatically via the `prepare` script in `package.json`:

```bash
npm install
# or
pnpm install
```

This will run `husky install` if husky is configured, or use the meta-framework's pre-commit setup.

## Manual Setup (if needed)

If pre-commit hooks are not working, install pre-commit:

```bash
pip install pre-commit
pre-commit install
```

## Verification

To verify hooks are working:

```bash
pre-commit run --all-files
```

## Bypassing Hooks (Not Recommended)

Only bypass hooks in emergencies:

```bash
git commit --no-verify
```

**Note**: This bypasses all quality gates and should only be used in exceptional circumstances.

