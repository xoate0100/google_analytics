# Contribution Guidelines

## Development Workflow

1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Follow TDD**: Write tests first (Red → Green → Refactor)
3. **Run Quality Checks**: `pnpm lint`, `pnpm format`, `pnpm test`
4. **Commit with Plan Tags**: `plan:<plan_id> component:<component> task:<id> <description>`
5. **Create PR**: All checks must pass

## Code Standards

### TypeScript

- **Strict Mode**: Always enabled
- **No `any`**: Use proper types
- **Function Length**: Max 50 lines (SRP)
- **Complexity**: Max 10 (cyclomatic complexity)

### SOLID Principles

- **SRP**: Single Responsibility Principle
- **ISP**: Interface Segregation Principle
- **DIP**: Dependency Inversion Principle

### Testing

- **Coverage**: Backend 100%, Shared 90%
- **TDD**: Write tests first
- **Test Types**: Unit, Integration, Contract

### Documentation

- **JSDoc**: Document all public symbols
- **AI-First Notes**: Include "For AI agents" blocks
- **Examples**: Provide working examples

## Commit Message Format

```
plan:<plan_id> component:<component> task:<id> <description>
```

Example:
```
plan:phase0-bootstrap component:shared task:2.1 Create package.json
```

## Pre-commit Hooks

Hooks run automatically on commit:
- Syntax validation
- Formatting (Prettier)
- Linting (ESLint)
- Type checking
- Tests
- Coverage checks
- Documentation sync

## Pull Request Process

1. **All Checks Pass**: CI must be green
2. **Code Review**: At least one approval
3. **Merge Strategy**: Squash and merge to `develop`

## Adding New Tools

1. Create tool in appropriate module (`ga4/`, `gtm/`, `ads/`)
2. Add Zod schema for args/response
3. Implement pre/post validation
4. Add idempotency support
5. Write tests (unit + integration)
6. Update documentation
7. Add to tool registry

## Questions?

See [Documentation Index](DOCUMENTATION_INDEX.md) for more information.
