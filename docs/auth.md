# Authentication Guide

## Overview

The MCP server uses OAuth 2.0 with offline access to authenticate with Google services (GA4, GTM, Google Ads).

## Initial Authentication

### Step 1: Set Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Step 2: Run Authentication

Use the `auth.login` tool to start the OAuth flow:

```bash
# In Cursor, use the MCP tool:
auth.login()
```

This will:
1. Open a browser window for Google OAuth consent
2. Request necessary scopes for GA4, GTM, and Google Ads
3. Store encrypted refresh tokens in `~/.mcp/google/credentials.enc.json`

## Token Management

### Automatic Refresh

Tokens are automatically refreshed when they expire. The server handles this transparently.

### Manual Token Rotation

To rotate tokens:

```bash
auth.rotate()
```

This will:
1. Revoke existing tokens
2. Request new tokens
3. Update encrypted storage

### Check Authentication Status

```bash
auth.status()
```

Returns:
- Authentication status
- Token expiration times
- Available scopes
- Service availability

## Scopes

### GA4 Scopes

- `https://www.googleapis.com/auth/analytics.readonly` - Read-only access
- `https://www.googleapis.com/auth/analytics.edit` - Edit access
- `https://www.googleapis.com/auth/analytics.manage.users` - User management

### GTM Scopes

- `https://www.googleapis.com/auth/tagmanager.readonly` - Read-only access
- `https://www.googleapis.com/auth/tagmanager.edit.containers` - Edit containers
- `https://www.googleapis.com/auth/tagmanager.publish` - Publish containers
- `https://www.googleapis.com/auth/tagmanager.manage.accounts` - Account management

### Google Ads

Uses OAuth 2.0 with developer token authentication. Requires:
- Developer token (from Google Ads API Center)
- OAuth client credentials
- Login customer ID

## Security

### Token Storage

Tokens are encrypted using libsodium and stored in:
- `~/.mcp/google/credentials.enc.json`

**Never commit this file to version control.**

### Encryption

- Uses libsodium for encryption-at-rest
- OS keychain fallback available
- Automatic key rotation

### Scope Minimization

The server requests minimal required scopes per tool. Scopes are escalated only on demand.

## Troubleshooting

### Authentication Errors

1. **Invalid Grant**: Token expired or revoked
   - Solution: Run `auth.login()` again

2. **Insufficient Scope**: Missing required permissions
   - Solution: Re-authenticate with additional scopes

3. **Token Not Found**: No stored credentials
   - Solution: Run `auth.login()` to authenticate

### Google Ads Authentication

Google Ads requires additional setup:
1. Developer token from Google Ads API Center
2. OAuth client configured in Google Cloud Console
3. Login customer ID (MCC or account ID)

See [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs/oauth/overview) for details.

