# Cursor IDE Setup Guide

This guide explains how to configure Cursor IDE to connect to the MCP Google Marketing Ops server.

## Prerequisites

1. **Build the MCP server**:
   ```bash
   pnpm install
   pnpm build
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env` and fill in your credentials
   - See [Authentication Guide](./auth.md) for details on obtaining OAuth credentials

3. **Authenticate with Google**:
   - Run the server and use `auth.login` tool to complete OAuth device flow
   - Credentials will be stored at `~/.mcp/google/credentials.enc.json`

## Configuration Methods

### Method 1: Local Installation (Recommended for Development)

This method runs the MCP server directly on your machine.

#### Step 1: Locate Cursor Configuration Directory

The MCP configuration file location depends on your operating system:

- **macOS/Linux**: `~/.cursor/mcp.json`
- **Windows**: `C:\Users\YourUsername\.cursor\mcp.json`

If the `.cursor` directory or `mcp.json` file doesn't exist, create them.

#### Step 2: Create or Update MCP Configuration

1. Open or create the `mcp.json` file in your Cursor configuration directory
2. Copy the configuration from `cursor-mcp-config.json.example`
3. Update the configuration with your actual values:

```json
{
  "mcpServers": {
    "google-marketing": {
      "command": "node",
      "args": [
        "/absolute/path/to/your/project/dist/server.js"
      ],
      "env": {
        "GOOGLE_CLIENT_ID": "your-actual-client-id",
        "GOOGLE_CLIENT_SECRET": "your-actual-client-secret",
        "MCP_ENCRYPTION_KEY": "your-actual-encryption-key",
        "GOOGLE_ADS_DEV_TOKEN": "your-actual-dev-token",
        "LOGIN_CUSTOMER_ID": "1234567890",
        "GA4_MEASUREMENT_PROTOCOL_SECRET": "your-actual-secret",
        "LOG_LEVEL": "info",
        "MCP_MARKETING_DRY_RUN": "0",
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Important Notes**:
- Use **absolute paths** for the `args` array (e.g., `/Users/username/projects/google_analytics/dist/server.js`)
- Replace all placeholder values with your actual credentials
- The `MCP_ENCRYPTION_KEY` should be a strong, randomly generated key (32+ characters)
- Optional environment variables can be omitted if not needed

#### Step 3: Restart Cursor

1. Completely quit Cursor (not just close the window)
2. Restart Cursor
3. The MCP server should now be available in Cursor Chat

### Method 2: Docker Container (Recommended for Production)

This method runs the MCP server in a Docker container, which is more isolated and easier to manage.

#### Step 1: Build Docker Image

```bash
pnpm docker:build
```

#### Step 2: Create Docker-based MCP Configuration

Update your `mcp.json` file:

```json
{
  "mcpServers": {
    "google-marketing": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-v",
        "${HOME}/.mcp/google:/app/.mcp/google",
        "--env-file",
        "/absolute/path/to/your/.env",
        "mcp-google-marketing:latest",
        "node",
        "dist/server.js"
      ]
    }
  }
}
```

**Alternative using docker-compose**:

```json
{
  "mcpServers": {
    "google-marketing": {
      "command": "docker-compose",
      "args": [
        "-f",
        "/absolute/path/to/your/docker-compose.prod.yml",
        "run",
        "--rm",
        "mcp-server"
      ],
      "cwd": "/absolute/path/to/your/project"
    }
  }
}
```

**Important Notes**:
- Replace `/absolute/path/to/your/.env` with the actual path to your `.env` file
- Replace `/absolute/path/to/your/project` with the actual project path
- The volume mount (`-v`) ensures credentials persist between container runs
- Use `-i` flag to enable interactive mode (required for stdio transport)

#### Step 3: Restart Cursor

1. Completely quit Cursor
2. Restart Cursor
3. The MCP server should now be available in Cursor Chat

## Verification

After configuring and restarting Cursor, verify the setup:

1. **Open Cursor Chat** (Cmd/Ctrl + L)
2. **Check for MCP server connection**:
   - The server should appear in the MCP servers list
   - No connection errors should be displayed

3. **Test with a simple query**:
   ```
   What tools are available from the google-marketing MCP server?
   ```

4. **Test authentication status**:
   ```
   Check my authentication status with Google services
   ```

If the server is working correctly, Cursor should be able to:
- List available tools
- Execute authentication commands
- Access Google Marketing APIs through the MCP server

## Troubleshooting

### Server Not Appearing in Cursor

1. **Check file paths**: Ensure all paths in `mcp.json` are absolute and correct
2. **Check permissions**: Ensure the server file is executable
3. **Check logs**: Look for error messages in Cursor's developer console (Help → Toggle Developer Tools)
4. **Verify build**: Ensure `pnpm build` completed successfully and `dist/server.js` exists

### Authentication Errors

1. **Check environment variables**: Ensure all required variables are set in `mcp.json`
2. **Verify credentials file**: Check that `~/.mcp/google/credentials.enc.json` exists
3. **Re-authenticate**: Use `auth.login` tool to complete OAuth flow again

### Docker Issues

1. **Check Docker is running**: `docker ps` should work without errors
2. **Check image exists**: `docker images | grep mcp-google-marketing`
3. **Test container manually**:
   ```bash
   docker run -i --rm mcp-google-marketing:latest node dist/server.js
   ```
4. **Check volume mounts**: Ensure the credentials directory is accessible

### Common Errors

**Error: "Cannot find module 'dist/server.js'"**
- Solution: Run `pnpm build` to compile TypeScript

**Error: "GOOGLE_CLIENT_ID is required"**
- Solution: Ensure environment variables are set in `mcp.json`

**Error: "Not connected"**
- Solution: Ensure `stdin_open: true` and `tty: true` are set in docker-compose (for Docker method)

## Advanced Configuration

### Using Environment File

Instead of setting environment variables directly in `mcp.json`, you can reference a `.env` file:

```json
{
  "mcpServers": {
    "google-marketing": {
      "command": "node",
      "args": [
        "-r",
        "dotenv/config",
        "dist/server.js"
      ],
      "env": {
        "DOTENV_CONFIG_PATH": "/absolute/path/to/your/.env"
      }
    }
  }
}
```

### Multiple Server Instances

You can configure multiple instances with different profiles:

```json
{
  "mcpServers": {
    "google-marketing-dev": {
      "command": "node",
      "args": ["dist/server.js"],
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug"
      }
    },
    "google-marketing-prod": {
      "command": "node",
      "args": ["dist/server.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## Next Steps

After successful setup:

1. **Complete authentication**: Use `auth.login` tool to authenticate with Google
2. **Explore available tools**: Ask Cursor Chat to list all available tools
3. **Read tool documentation**: See [Tools Documentation](./tools.md) for detailed tool descriptions
4. **Start using the server**: Begin making requests to Google Marketing APIs through Cursor Chat

## Additional Resources

- [Authentication Guide](./auth.md) - Detailed OAuth setup instructions
- [Tools Documentation](./tools.md) - Complete list of available MCP tools
- [Configuration Guide](./CONFIGURATION.md) - Server configuration options
- [Docker Guide](./DOCKER.md) - Docker setup and usage
