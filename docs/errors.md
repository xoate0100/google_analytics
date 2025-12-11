# Error Catalog

## Error Types

All errors follow a typed error model with discriminated unions.

### AuthError

**Type**: `AuthError`

**Reasons**:
- `invalid_grant` - Token expired or revoked
- `insufficient_scope` - Missing required permissions

**Remediation**:
- Run `auth.login()` to re-authenticate
- Check scope requirements for the operation

**Example**:
```json
{
  "type": "AuthError",
  "reason": "invalid_grant",
  "message": "Token expired",
  "remediation": "Run auth.login() to refresh tokens"
}
```

### QuotaError

**Type**: `QuotaError`

**Reasons**:
- `rate_limited` - Too many requests
- `resource_exhausted` - Quota exceeded

**Remediation**:
- Reduce request rate
- Wait for quota reset
- Check `Retry-After` header

**Example**:
```json
{
  "type": "QuotaError",
  "reason": "rate_limited",
  "http_status": 429,
  "message": "Too many requests",
  "remediation": "Reduce QPS or wait per Retry-After"
}
```

### PreconditionError

**Type**: `PreconditionError`

**Reasons**:
- `conflict` - Resource conflict
- `not_found` - Resource not found
- `precheck_failed` - Pre-validation failed

**Remediation**:
- Check resource existence
- Resolve conflicts
- Verify preconditions

### ValidationError

**Type**: `ValidationError`

**Reasons**:
- `schema_mismatch` - Request doesn't match schema

**Remediation**:
- Check request format
- Verify required fields
- Review schema documentation

### TransportError

**Type**: `TransportError`

**Reasons**:
- `network` - Network error
- `tls` - TLS/SSL error

**Remediation**:
- Check network connectivity
- Verify SSL certificates
- Retry operation

### ServerError

**Type**: `ServerError`

**Reasons**:
- `5xx` - Server error

**Remediation**:
- Retry with exponential backoff
- Check service status
- Contact support if persistent

## Error Logging

All errors are logged with:
- Operation ID
- Error type and reason
- Context information
- Remediation hints

## Retry Policy

- **Safe idempotent writes only** - Never retry non-idempotent operations
- **Max attempts**: 5 with exponential jitter (starting at 250ms)
- **Partial success**: Log rollback and execute compensating action

## Error Handling Best Practices

1. Always check error type before handling
2. Follow remediation hints
3. Log errors with full context
4. Implement retry logic for transient errors
5. Use idempotency keys for write operations
