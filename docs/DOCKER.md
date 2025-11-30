# Docker Deployment Guide

## Overview

The MCP Google Marketing Ops server is fully containerized for easy local development and future cloud deployment. Docker support enables:

- **Consistent environments** across development and production
- **Easy local server running** without installing Node.js dependencies
- **Future cloud deployment** readiness (Kubernetes, cloud runtimes)
- **Isolation** of dependencies and configuration

## Prerequisites

- Docker >= 20.10
- Docker Compose >= 2.0
- Environment variables configured (see `.env.example`)

## Quick Start

### Development Mode

1. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

2. **Create MCP config directory** (if it doesn't exist):
   ```bash
   # Unix/Mac
   mkdir -p ~/.mcp/google
   
   # Windows (PowerShell)
   New-Item -ItemType Directory -Force -Path $env:USERPROFILE\.mcp\google
   ```

3. **Start the container**:
   ```bash
   docker-compose up
   ```

   Or run in detached mode:
   ```bash
   docker-compose up -d
   ```

4. **View logs**:
   ```bash
   docker-compose logs -f
   ```

5. **Stop the container**:
   ```bash
   docker-compose down
   ```

### Production Mode

1. **Build and run production container**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **View logs**:
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

3. **Stop the container**:
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

## Configuration

### Volume Mounts

The container mounts your local `~/.mcp/google/` (or `%USERPROFILE%\.mcp\google` on Windows) directory to persist:
- `config.json` - User configuration
- `credentials.enc.json` - Encrypted OAuth tokens
- `capabilities.json` - Discovered API capabilities

**Important**: Ensure the directory exists and has proper permissions:
```bash
# Unix/Mac
mkdir -p ~/.mcp/google
chmod 700 ~/.mcp/google

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path $env:USERPROFILE\.mcp\google
```

### Environment Variables

All environment variables from `.env` are passed to the container. See `.env.example` for required variables.

The docker-compose files use `${VARIABLE}` syntax to read from your `.env` file automatically.

### Ports

- **3000**: MCP server port (if HTTP endpoint is needed)

To change the port, modify `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Use port 3001 on host
```

## Dockerfiles

### Dockerfile (Production)

Multi-stage build optimized for production:
- **Stage 1 (builder)**: Build TypeScript and install all dependencies
- **Stage 2 (production)**: Production image with only runtime dependencies

**Features**:
- Alpine Linux base (smaller image size)
- Non-root user (security)
- Health checks
- Optimized layer caching

### Dockerfile.dev (Development)

Development image with:
- All dependencies (including dev)
- Hot reload support via volume mounts
- Source code mounted as volume for live editing

## Health Checks

The container includes health checks:
- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3
- **Start Period**: 10 seconds

Check container health:
```bash
docker-compose ps
```

## Building Images

### Development Image

```bash
docker build -f Dockerfile.dev -t mcp-google-marketing:dev .
```

Or use npm script:
```bash
pnpm docker:build:dev
```

### Production Image

```bash
docker build -t mcp-google-marketing:latest .
```

Or use npm script:
```bash
pnpm docker:build
```

## Running Commands

### Execute commands in container

```bash
# Development
docker-compose exec mcp-server pnpm test

# Production
docker-compose -f docker-compose.prod.yml exec mcp-server node dist/server.js
```

### Access container shell

```bash
docker-compose exec mcp-server sh
```

## Troubleshooting

### Permission Issues

If you encounter permission issues with mounted volumes:

**Unix/Mac**:
```bash
sudo chown -R $USER:$USER ~/.mcp/google
```

**Windows**: Usually handled automatically, but if issues occur:
```powershell
# Run PowerShell as Administrator
icacls "$env:USERPROFILE\.mcp\google" /grant "$env:USERNAME:(OI)(CI)F"
```

### Container Won't Start

1. Check logs: `docker-compose logs`
2. Verify environment variables are set in `.env`
3. Ensure `~/.mcp/google/` (or `%USERPROFILE%\.mcp\google`) directory exists
4. Check Docker daemon is running: `docker ps`

### Port Conflicts

If port 3000 is already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Use port 3001 on host
```

### Windows Path Issues

If you encounter path issues on Windows, ensure:
- Docker Desktop is using WSL2 backend (recommended)
- Or use forward slashes in paths: `/c/Users/username/.mcp/google`

## Scaling for Future Cloud Deployment

The container is designed to scale horizontally:

### Kubernetes (Future)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-google-marketing
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: mcp-server
        image: mcp-google-marketing:latest
        env:
        - name: GOOGLE_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: mcp-secrets
              key: google-client-id
        volumeMounts:
        - name: mcp-config
          mountPath: /app/.mcp/google
      volumes:
      - name: mcp-config
        persistentVolumeClaim:
          claimName: mcp-config-pvc
```

### Docker Swarm (Future)

```yaml
version: '3.8'
services:
  mcp-server:
    image: mcp-google-marketing:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
```

## Security Considerations

1. **Secrets Management**: 
   - Use Docker secrets or environment variables (never commit)
   - Consider using Docker secrets for production
   - Use `.env` file (gitignored) for local development

2. **Non-root User**: 
   - Container runs as `nodejs` user (UID 1001)
   - Reduces security attack surface

3. **Read-only Volumes**: 
   - Production uses read-only mounts where possible
   - Config directory mounted read-only in production

4. **Network Isolation**: 
   - Use Docker networks to isolate services
   - Default network: `mcp-network` (bridge)

5. **Image Scanning**: 
   - Regularly scan images for vulnerabilities
   - Use `docker scan mcp-google-marketing:latest`

## Best Practices

1. **Use .env file**: Never hardcode secrets in docker-compose.yml
2. **Volume Persistence**: Config directory is mounted to persist credentials
3. **Health Checks**: Monitor container health in production
4. **Resource Limits**: Set appropriate CPU/memory limits (see docker-compose.prod.yml)
5. **Logging**: Use structured logging (pino) for container logs
6. **Multi-stage Builds**: Use production Dockerfile for smaller images
7. **Layer Caching**: Order Dockerfile commands to maximize cache hits

## NPM Scripts

Added to `package.json` for convenience:

- `pnpm docker:build` - Build production image
- `pnpm docker:build:dev` - Build development image
- `pnpm docker:up` - Start development container
- `pnpm docker:up:prod` - Start production container
- `pnpm docker:down` - Stop containers
- `pnpm docker:logs` - View container logs

## Future Enhancements

- Kubernetes manifests
- Helm charts
- Cloud deployment guides (AWS ECS, GCP Cloud Run, Azure Container Instances)
- CI/CD integration for container builds
- Multi-architecture support (ARM64, AMD64)
- Docker Compose profiles for different environments
- Development vs production optimizations
