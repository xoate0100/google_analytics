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

Use the `auth.login` tool to start the OAuth device flow. The authentication process has two steps:

#### Step 2a: Initiate Device Flow

Call `auth.login()` without any parameters:

```bash
# In Cursor, use the MCP tool:
auth.login()
```

This will:
1. Initiate OAuth 2.0 device flow
2. Return a user code (e.g., `ABCD-EFGH`) and verification URL
3. Request necessary scopes for GA4, GTM, and Google Ads
4. Return a `deviceCode` that you'll use in the next step

**Example response:**
```json
{
  "userCode": "ABCD-EFGH",
  "verificationUrl": "https://www.google.com/device",
  "deviceCode": "4/0AeanS...",
  "expiresIn": 1800,
  "message": "Please visit https://www.google.com/device and enter code ABCD-EFGH",
  "nextStep": "After authorizing, call auth.login again with deviceCode parameter"
}
```

#### Step 2b: Complete Authorization

1. **Visit the verification URL** (e.g., `https://www.google.com/device`)
2. **Enter the user code** (e.g., `ABCD-EFGH`)
3. **Authorize the application** in your Google account
4. **Poll for tokens** by calling `auth.login()` again with the `deviceCode`:

```bash
# In Cursor, use the MCP tool with deviceCode:
auth.login({ deviceCode: "4/0AeanS..." })
```

This will:
1. Poll Google's OAuth token endpoint (with automatic retry and exponential backoff)
2. Handle `authorization_pending`, `slow_down`, and `expired_token` errors automatically
3. Store encrypted tokens in `~/.mcp/google/credentials.enc.json` once authorization is complete
4. Return a success message when authentication is complete

**Note:** The polling process will automatically retry up to 60 times with exponential backoff. If the device code expires (typically after 30 minutes), you'll need to start over with a new `auth.login()` call.

### Device Flow Implementation Details

The OAuth device flow is implemented using Google's OAuth 2.0 device flow endpoints:

1. **Device Code Request**: POST to `https://oauth2.googleapis.com/device/code`
   - Sends `client_id` and `scope` parameters
   - Returns `device_code`, `user_code`, `verification_url`, `expires_in`, and `interval`
   - The `expires_in` value is typically 1800 seconds (30 minutes)

2. **Token Polling**: POST to `https://oauth2.googleapis.com/token`
   - Sends `device_code`, `client_id`, `client_secret`, and `grant_type=urn:ietf:params:oauth:grant-type:device_code`
   - **Automatic Retry Logic**:
     - Initial polling interval: 5 seconds
     - Maximum attempts: 60
     - Exponential backoff on `slow_down` errors
     - Automatic interval adjustment based on server responses
   - **Error Handling**:
     - `authorization_pending`: Continues polling (expected during authorization)
     - `slow_down`: Increases polling interval and continues
     - `expired_token`: Stops polling and requires new device flow initiation
   - Returns `access_token`, `refresh_token`, `expires_in`, and `scope` on success

The implementation includes comprehensive error handling for all device flow error conditions and follows OAuth 2.0 device flow best practices with automatic retry and backoff mechanisms.

## Token Management

### Automatic Refresh

Tokens are automatically refreshed when they expire. The server handles this transparently.

### Manual Token Rotation

To rotate tokens (useful for security or when tokens are compromised):

```bash
# Step 1: Initiate rotation (revokes existing tokens and starts new device flow)
auth.rotate()

# Step 2: After authorizing, complete the rotation
auth.rotate({ deviceCode: "4/0AeanS..." })
```

This will:
1. **Revoke existing tokens**: Attempts to revoke both refresh token and access token (if available)
2. **Initiate new device flow**: Starts a fresh OAuth device flow (same as `auth.login()`)
3. **Store new tokens**: Updates encrypted storage with new credentials

**Note:** The rotation process follows the same two-step flow as initial authentication. If token revocation fails (e.g., tokens already expired), the rotation will still proceed with the new device flow.

### Check Authentication Status

```bash
auth.status()
```

Returns:
- **Authenticated status**: `true` if tokens are available, `false` otherwise
- **Products**: List of authenticated products (e.g., `["google"]`)
- **Token information**: If authenticated, includes token expiration and scope details

**Example response when authenticated:**
```json
{
  "authenticated": true,
  "products": ["google"]
}
```

**Example response when not authenticated:**
```json
{
  "authenticated": false,
  "products": []
}
```

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
- **Default location**: `~/.mcp/google/credentials.enc.json` (Unix/macOS) or `C:\Users\YourUsername\.mcp\google\credentials.enc.json` (Windows)
- **Custom location**: Set `MCP_CREDENTIALS_PATH` environment variable to override

**Stored data:**
- `accessToken`: Current access token
- `refreshToken`: Refresh token for obtaining new access tokens
- `expiresAt`: Unix timestamp when access token expires
- `scopes`: Array of granted OAuth scopes

**Never commit this file to version control.** The file is automatically added to `.gitignore`.

### Encryption

- **Algorithm**: Uses libsodium (ChaCha20-Poly1305) for encryption-at-rest
- **Key Management**:
  - Encryption key must be provided via `MCP_ENCRYPTION_KEY` environment variable
  - Key must be a 32-byte base64-encoded string
  - Generate a key using: `node -e "require('libsodium-wrappers').ready.then(s => console.log(s.to_base64(s.randombytes_buf(32), s.base64_variants.ORIGINAL)))"`
- **Security**: Tokens are encrypted before being written to disk and decrypted when read

### Scope Minimization

The server requests minimal required scopes per tool. Scopes are escalated only on demand.

## Troubleshooting

### Authentication Errors

1. **"The OAuth client was not found"** or **"GOOGLE_CLIENT_ID is required"**
   - **Cause**: Missing or invalid OAuth credentials
   - **Solution**:
     - Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in environment variables
     - Check that credentials are correctly configured in Google Cloud Console
     - Ensure the OAuth client is configured for "Desktop application" type

2. **"Invalid Grant"** or **"Token expired"**
   - **Cause**: Access token expired or refresh token invalid
   - **Solution**: Run `auth.login()` again to obtain new tokens

3. **"Expired Token"** during device flow
   - **Cause**: Device code expired (typically after 30 minutes) before authorization completed
   - **Solution**: Start over with a new `auth.login()` call

4. **"Authorization Pending"** (during polling)
   - **Cause**: User hasn't completed authorization yet (this is normal)
   - **Solution**: Wait for user to complete authorization, polling will continue automatically

5. **"Slow Down"** (during polling)
   - **Cause**: Polling too frequently
   - **Solution**: The system automatically adjusts polling interval, no action needed

6. **"Token Not Found"** or **"No stored credentials"**
   - **Cause**: No tokens stored in credentials file
   - **Solution**: Run `auth.login()` to authenticate

7. **"Encryption failed"** or **"MCP_ENCRYPTION_KEY is required"**
   - **Cause**: Missing or invalid encryption key
   - **Solution**:
     - Set `MCP_ENCRYPTION_KEY` environment variable
     - Ensure key is a valid 32-byte base64-encoded string
     - Generate a new key if needed (see Encryption section above)

8. **"Insufficient Scope"**
   - **Cause**: Missing required OAuth scopes for the requested operation
   - **Solution**: Re-authenticate with `auth.login()` or `auth.rotate()` to request additional scopes

### Google Ads Authentication

Google Ads requires additional setup beyond OAuth:

1. **Developer Token**: Obtain from [Google Ads API Center](https://ads.google.com/aw/apicenter)
   - Set `GOOGLE_ADS_DEV_TOKEN` environment variable
   - Token must be approved for production use (test tokens work in sandbox)

2. **OAuth Client**: Configure in Google Cloud Console
   - Must be configured for "Desktop application" type
   - Must have Google Ads API enabled

3. **Login Customer ID**: Set `LOGIN_CUSTOMER_ID` environment variable
   - Use your MCC (Manager) ID or account ID
   - Format: `1234567890` (no dashes)

4. **Optional**: GA4 Measurement Protocol Secret
   - Set `GA4_MEASUREMENT_PROTOCOL_SECRET` if using Measurement Protocol tools
   - Obtain from GA4 Admin → Data Streams → Measurement Protocol API secrets

See [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs/oauth/overview) for detailed setup instructions.
