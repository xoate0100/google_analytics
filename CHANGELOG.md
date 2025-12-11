# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-17

### Added

#### Core Infrastructure
- **Error Handling**: Comprehensive error model with typed errors (AuthError, ValidationError, QuotaError, PreconditionError, etc.)
- **Logging**: Structured logging with Pino, including child contexts and log levels
- **Caching**: LRU cache implementation with TTL support and ETag validation
- **Rate Limiting**: Token bucket rate limiter with adaptive backoff
- **Circuit Breaker**: Circuit breaker pattern for fault tolerance
- **Validation**: Schema validation utilities with Zod integration
- **Operation Envelope**: Metadata wrapper for all operations with pre-check, post-check, and rollback support
- **Capabilities Registry**: Dynamic capability discovery and registration system
- **Authentication**: OAuth 2.0 client with device flow and encrypted token storage
- **MCP Server Bootstrap**: Core MCP server infrastructure with tool registration

#### Google Analytics 4 (GA4) Tools
- **Data API**:
  - `ga4.report.run` - Run standard reports
  - `ga4.report.batch` - Batch run multiple reports
  - `ga4.report.pivot` - Run pivot reports
  - `ga4.report.realtime` - Run realtime reports
  - `ga4.exploration.create` - Create exploration queries
  - `ga4.exploration.get` - Get exploration results
- **Admin API**:
  - `ga4.property.*` - Property management (list, get, upsert, delete)
  - `ga4.datastream.*` - Data stream management (list, get, upsert, delete)
  - `ga4.customDimension.*` - Custom dimension management
  - `ga4.customMetric.*` - Custom metric management
  - `ga4.event.*` - Event management (list, get, upsert)
  - `ga4.conversion.*` - Conversion event management
  - `ga4.audience.*` - Audience management
  - `ga4.attribution.*` - Attribution settings management
  - `ga4.integration.googleAds.*` - Google Ads integration management
  - `ga4.integration.bigquery.*` - BigQuery integration management
  - `ga4.settings.*` - Property settings management
- **Measurement Protocol**: Event tracking via HTTP API
- **Data Filters**: Data filter management for GA4 properties

#### Google Tag Manager (GTM) Tools
- **Containers**:
  - `gtm.container.list` - List containers
  - `gtm.container.get` - Get container details
  - `gtm.container.upsert` - Create or update container
- **Workspaces**:
  - `gtm.workspace.list` - List workspaces
  - `gtm.workspace.get` - Get workspace details
  - `gtm.workspace.create` - Create workspace
  - `gtm.workspace.merge` - Merge workspaces
  - `gtm.workspace.publish` - Publish workspace
- **Tags**:
  - `gtm.tag.list` - List tags
  - `gtm.tag.get` - Get tag details
  - `gtm.tag.upsert` - Create or update tag
  - `gtm.tag.delete` - Delete tag
- **Triggers**:
  - `gtm.trigger.list` - List triggers
  - `gtm.trigger.get` - Get trigger details
  - `gtm.trigger.upsert` - Create or update trigger
  - `gtm.trigger.delete` - Delete trigger
- **Variables**:
  - `gtm.variable.list` - List variables
  - `gtm.variable.get` - Get variable details
  - `gtm.variable.upsert` - Create or update variable
  - `gtm.variable.delete` - Delete variable
- **Data Layer**:
  - `gtm.datalayer.schema.generate` - Generate data layer schema from GTM variables
  - `gtm.datalayer.validate` - Validate data layer against schema
  - `gtm.datalayer.monitor` - Monitor data layer events
  - `gtm.datalayer.events.list` - List data layer events
- **Organization**:
  - `gtm.folder.list` - List folders
  - `gtm.folder.get` - Get folder details
  - `gtm.folder.upsert` - Create or update folder
  - `gtm.folder.delete` - Delete folder
- **Versioning**:
  - `gtm.version.list` - List container versions
  - `gtm.version.get` - Get version details
  - `gtm.version.create` - Create new version
  - `gtm.version.restore` - Restore previous version
- **Publishing**:
  - `gtm.workspace.publish` - Publish workspace to container
  - `gtm.preview.create` - Create preview environment
  - `gtm.preview.get` - Get preview details
- **Advanced Configuration**:
  - `gtm.consent.mode.configure` - Configure consent mode
  - `gtm.consent.mode.get` - Get consent mode settings
  - `gtm.tag.sequence.update` - Update tag sequencing
  - `gtm.tag.priority.update` - Update tag priority

#### Google Ads Tools
- **Reporting**:
  - `ads.report.gaql` - Execute GAQL query
  - `ads.report.gaql.batch` - Execute batch GAQL queries
  - `ads.report.gaql.stream` - Stream GAQL query results
- **Campaigns**:
  - `ads.campaign.list` - List campaigns
  - `ads.campaign.get` - Get campaign details
  - `ads.campaign.upsert` - Create or update campaign
  - `ads.campaign.pause` - Pause campaign
- **Ad Groups**:
  - `ads.adgroup.list` - List ad groups
  - `ads.adgroup.get` - Get ad group details
  - `ads.adgroup.upsert` - Create or update ad group
- **Keywords**:
  - `ads.keyword.list` - List keywords
  - `ads.keyword.upsert` - Create or update keyword
  - `ads.keyword.delete` - Delete keyword
- **Conversions**:
  - `ads.conversion.list` - List conversion actions
  - `ads.conversion.get` - Get conversion action details
  - `ads.conversion.upsert` - Create or update conversion action
  - `ads.conversion.delete` - Delete conversion action
  - `ads.conversion.offline.import` - Import offline conversions
  - `ads.conversion.enhanced` - Configure enhanced conversions
- **Audiences**:
  - `ads.audience.list` - List audiences
  - `ads.audience.get` - Get audience details
  - `ads.audience.upsert` - Create or update audience
  - `ads.audience.attach` - Attach audience to campaign/ad group
- **Budgets**:
  - `ads.budget.list` - List budgets
  - `ads.budget.get` - Get budget details
  - `ads.budget.upsert` - Create or update budget
- **Bidding Strategies**:
  - `ads.bidding.list` - List bidding strategies
  - `ads.bidding.get` - Get bidding strategy details
  - `ads.bidding.upsert` - Create or update bidding strategy

#### Cross-Product Workflows
- `workflow.ga4-ads.conversionLink` - Link GA4 conversions to Google Ads conversion actions

#### Performance Optimizations
- **Batch Processing**: Optimized batch operation processor with configurable batch size, concurrency control, and timeout handling
- **Connection Pooling**: Connection pool manager for API client connections with reuse, pool size management, and idle connection cleanup

#### Testing Infrastructure
- **Unit Tests**: Comprehensive unit test coverage (>90%) for all modules
- **Integration Tests**: Integration tests for API interactions with mocked HTTP requests
- **Contract Tests**: Framework for contract tests against live sandbox environments
- **Test Fixtures**: Reusable test fixtures for common API responses and error scenarios

#### Developer Experience
- **TypeScript**: Full TypeScript support with strict type checking
- **ESLint**: Comprehensive linting rules with SOLID principle enforcement
- **Pre-commit Hooks**: Automated quality gates (syntax, formatting, linting, type checking, security, architecture, tests, coverage, documentation)
- **Docker Support**: Docker containerization for easy deployment
- **Documentation**: Comprehensive documentation including:
  - API tool reference
  - Authentication guide
  - Error handling guide
  - Observability guide
  - Data layer guide
  - Custom events guide
  - Conversions guide
  - Contributing guide

### Changed

- **SOLID Principles**: All code refactored to comply with SOLID principles:
  - Single Responsibility: Functions ≤50 lines
  - Interface Segregation: Interfaces ≤10 methods/properties
  - Dependency Inversion: Depend on abstractions, not concrete implementations
- **Code Quality**: All linting and type-checking passing with acceptable warnings
- **Test Coverage**: Maintained >90% test coverage throughout development

### Security

- **Encrypted Token Storage**: OAuth tokens stored with encryption
- **Secrets Management**: Secure handling of API credentials
- **Security Scanning**: Automated security scanning in pre-commit hooks

### Performance

- **Caching**: LRU cache with TTL for API response caching
- **Rate Limiting**: Token bucket algorithm with adaptive backoff
- **Circuit Breaker**: Fault tolerance for API failures
- **Batch Operations**: Optimized batch processing with concurrency control
- **Connection Pooling**: Reusable connections for improved performance

### Documentation

- **API Reference**: Complete documentation for all 75+ tools
- **Workflow Guides**: Step-by-step guides for common workflows
- **Error Handling**: Comprehensive error handling documentation
- **Contributing Guide**: Guidelines for contributing to the project

## [Unreleased]

### Planned
- Kubernetes manifests and Helm charts
- Terraformable secrets & config
- Scheduled jobs via MCP cron companion
- Cross-product audits with fix-it PRs
- Opinionated playbooks for budget pacing and bidding strategies
- UI companion in VSCode/Cursor sidebar

[0.1.0]: https://github.com/your-org/mcp-google-marketing/releases/tag/v0.1.0
