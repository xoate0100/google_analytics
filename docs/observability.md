# Observability Guide

## Logging

### Logger

The server uses **pino** for structured JSON logging.

### Log Levels

- `debug` - Detailed debugging information
- `info` - General informational messages
- `warn` - Warning messages
- `error` - Error messages

### Log Format

All logs are JSON-formatted for easy parsing:

```json
{
  "level": "info",
  "time": 1234567890,
  "op_id": "uuid-v7",
  "op_name": "gtm.create_tag",
  "idempotency_key": "hash...",
  "trace_id": "trace-uuid",
  "message": "Operation completed",
  "context": {...}
}
```

### Correlation IDs

Every log entry includes:
- `op_id` - Operation ID (UUID v7)
- `idempotency_key` - Idempotency key for the operation
- `trace_id` - Distributed tracing ID

## Metrics

### Internal Counters

- `success` - Successful operations
- `retries` - Retry attempts
- `rate_limited` - Rate limit hits
- `rollback_count` - Rollback operations
- `p50/p95 latency` - Latency percentiles by tool

### Metrics Collection

Metrics are collected internally and can be exported to:
- Prometheus (future)
- Cloud monitoring (future)
- Log aggregation systems

## Operation Envelope

Every operation is wrapped in an operation envelope that logs:

```json
{
  "op_id": "uuid-v7",
  "op_name": "gtm.create_tag",
  "idempotency_key": "hash(payload + target)",
  "timestamp": "ISO8601",
  "actor": "local-user",
  "target": {"product": "gtm", "accountId": "...", "containerId": "..."},
  "request": {"args": {...}},
  "precheck": {"capability": true, "exists": false, "conflicts": []},
  "attempt": {"n": 1, "retry_policy": "exp-jitter", "rate_limit_state": {"tokens": 47}},
  "result": {"status": "success", "resource_id": "...", "etag": "..."},
  "postcheck": {"read_back": true, "state_match": true},
  "rollback": {"needed": false, "action": null},
  "latency_ms": 312,
  "warnings": [],
  "notes": ""
}
```

## Logging Best Practices

1. **Structured Logging**: Always use structured JSON logs
2. **Correlation**: Include op_id, idempotency_key, trace_id
3. **Context**: Include relevant context in each log entry
4. **PII Redaction**: Never log sensitive data (use hashes)
5. **Level Appropriateness**: Use appropriate log levels

## Monitoring

### Health Checks

Use `core.healthcheck` to check server health:

```bash
core.healthcheck()
```

Returns:
- Server status
- Service availability
- Token status
- Capability registry status

### Performance Monitoring

Monitor:
- Operation latency (p50, p95, p99)
- Error rates by type
- Rate limit hits
- Rollback frequency

## Debugging

### Enable Debug Logging

Set environment variable:
```bash
LOG_LEVEL=debug
```

### Trace Operations

Every operation includes a trace_id for distributed tracing across services.

### Operation History

Operation envelopes are logged for every call, providing full audit trail.

