# MCP Google Marketing Ops

A reusable, project-agnostic MCP (Model Context Protocol) server that exposes safe, idempotent, full-fidelity tools for **Google Ads**, **Google Tag Manager**, and **Google Analytics 4** from inside Cursor IDE.

## Overview

This MCP server provides 75+ atomic tools covering full API capabilities:
- **GA4:** 35+ tools (Data API, Admin API, Measurement Protocol, Data Filters, Integrations, Explorations)
- **GTM:** 20+ tools (containers, workspaces, tags, triggers, variables, data layer, versions)
- **Google Ads:** 15+ tools (reporting, campaigns, conversions, audiences, budgets)

## Features

- ✅ **Read/Write/Create/Delete** operations with stateful verification
- ✅ **Idempotent** write operations with automatic rollback
- ✅ **Pre/post validation** for all operations
- ✅ **Strong observability** with structured logging (pino)
- ✅ **Security best practices** (OAuth, encryption, minimal scopes)
- ✅ **TDD-first** delivery with comprehensive test coverage
- ✅ **Full support** for custom event tracking, data layer management, and conversion setup

## Quick Start

### Prerequisites

- Node.js >= 18.0.0 (for local development)
- Docker >= 20.10 & Docker Compose >= 2.0 (for containerized deployment)
- pnpm (recommended) or npm
- Google Cloud Project with APIs enabled
- Google Ads API developer token

### Installation

#### Option 1: Docker (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd google_analytics
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Start the container**:
   ```bash
   docker-compose up
   ```

4. **Authenticate** (in container or via MCP tools):
   ```bash
   # Use auth.login tool via MCP interface
   ```

See [Docker Guide](docs/DOCKER.md) for detailed Docker instructions.

#### Option 2: Local Development

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd google_analytics
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Authenticate**:
   ```bash
   # Run the MCP server and use auth.login tool
   pnpm dev
   ```

5. **Discover capabilities**:
   ```bash
   # Use capabilities.refresh tool to discover available resources
   ```

## Configuration

See [Configuration Guide](docs/CONFIGURATION.md) for detailed setup instructions.

Configuration files are stored in `~/.mcp/google/`:
- `config.json` - User configuration and settings
- `credentials.enc.json` - Encrypted OAuth tokens
- `capabilities.json` - Discovered API capabilities

## Development

### Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Compile TypeScript
- `pnpm test` - Run all tests
- `pnpm test:unit` - Run unit tests
- `pnpm test:integration` - Run integration tests
- `pnpm test:contract` - Run contract tests
- `pnpm test:coverage` - Generate coverage report
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm type-check` - TypeScript type checking

### Testing

The project follows TDD (Test-Driven Development) principles:
- **Unit tests**: Pure functions, schemas, adapters
- **Integration tests**: Mocked Google clients with replay fixtures
- **Contract tests**: Pact-style against live sandbox

Coverage thresholds:
- Backend: 100%
- Shared: 90%

### Code Quality

- **ESLint**: TypeScript linting with SOLID principles enforcement
- **Prettier**: Code formatting (100 character line length)
- **TypeScript**: Strict mode with comprehensive type checking
- **ts-prune**: Dead code detection

## Documentation

- [Configuration Guide](docs/CONFIGURATION.md)
- [Pre-commit Setup](docs/PRE_COMMIT_SETUP.md)
- [Tools Documentation](docs/tools.md) - Complete tool reference
- [Authentication Guide](docs/auth.md) - OAuth setup and token management
- [Error Catalog](docs/errors.md) - Error types and remediation
- [Observability](docs/observability.md) - Logging and metrics
- [Data Layer Guide](docs/datalayer.md) - Data layer schema and validation
- [Custom Events](docs/custom-events.md) - Event tracking workflows
- [Conversions](docs/conversions.md) - Conversion setup and linking

## Architecture

```
mcp-google-marketing/
├── src/
│   ├── server.ts          # MCP bootstrap & tool registration
│   ├── core/              # Logging, cache, limiter, validation, capabilities
│   ├── auth/              # OAuth, token management, encryption
│   ├── ga4/               # GA4 Data API, Admin API, Measurement Protocol
│   ├── gtm/               # GTM API v2 (containers, tags, triggers, variables)
│   ├── ads/               # Google Ads API (gRPC/REST)
│   └── docs/examples/     # Example MCP prompts & flows
├── test/                  # Unit, integration, contract tests
├── scripts/               # Development scripts
└── docs/                  # Documentation
```

## Security

- OAuth 2.0 with offline access
- Encrypted token storage (libsodium)
- Minimal required scopes per tool
- Automatic token refresh
- PII redaction in logs
- HTTPS only

## License

MIT

## Contributing

See [Contribution Guidelines](docs/contrib.md) for details.

---

**Note**: This project uses the Master Git Meta-Framework (L2.5 Single-Agent Sandbox). See the main [README.md](README.md) for meta-framework information.
