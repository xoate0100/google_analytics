# CI/CD Setup Guide

## Overview

The project uses GitHub Actions for continuous integration and continuous deployment.

## Workflows

### PR Validation (`pr-validation.yml`)

Runs on every pull request to `main` or `develop`:

- ✅ MVP Specification validation
- ✅ Architecture checks (SOLID principles)
- ✅ Linting (ESLint)
- ✅ Type checking (TypeScript)
- ✅ Tests (unit, integration, contract)
- ✅ Coverage checks
- ✅ Security scanning
- ✅ Format checking (Prettier)
- ✅ Dead code detection (ts-prune)

**Blocks PR merge if any check fails.**

### Test Matrix (`test-matrix.yml`)

Runs test suite in parallel:

- Unit tests
- Integration tests
- Contract tests

Uploads coverage reports to Codecov.

### Security Scanning (`security.yml`)

Runs security checks:

- Dependency vulnerability scanning (npm audit)
- Code security analysis
- Secret scanning (TruffleHog)
- Runtime security checks

**Runs on:**
- Every push to `main`/`develop`
- Every PR
- Weekly schedule (Sunday)
- Manual trigger

### Quality Checks (`quality.yml`)

Runs quality metrics (warnings only):

- Performance regression checks
- Complexity analysis
- Mutation testing (future)

**Does not block PRs** - warnings only.

## Setup Status

✅ All workflows are configured and ready to use.

## Local Testing

Test workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or
choco install act-cli  # Windows

# Run PR validation
act pull_request

# Run specific workflow
act -W .github/workflows/test-matrix.yml
```

## Coverage Thresholds

- **Backend**: 100%
- **Shared**: 90%

Coverage is enforced in PR validation workflow.

## Security

- All secrets are stored in GitHub Secrets
- Never commit credentials to repository
- Security scans run automatically
- Dependency updates are monitored

## Performance

- Performance regression checks warn on >10% degradation
- Complexity checks warn on functions >10 complexity
- Large changeset warnings (>20 files)

## Future Enhancements

- Mutation testing with Stryker
- Performance benchmarking
- Automated dependency updates
- Release automation

