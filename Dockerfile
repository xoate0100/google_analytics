# Multi-stage Dockerfile for MCP Google Marketing Ops Server
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy package files
COPY package.json pnpm-lock.yaml* .npmrc ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy package files
COPY package.json pnpm-lock.yaml* .npmrc ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Create directory for MCP config (will be mounted as volume)
# This directory stores encrypted credentials and configuration
RUN mkdir -p /app/.mcp/google

# Set non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# MCP servers communicate via stdio (stdin/stdout)
# No HTTP port is needed, but we expose 3000 for potential future use
EXPOSE 3000

# Health check - simple process check since MCP uses stdio
# The server process running indicates health
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD pgrep -f "node.*dist/server.js" > /dev/null || exit 1

# Start the MCP server
# The server uses stdio transport, so stdin/stdout must be attached
# when running the container (e.g., docker run -i or docker-compose with stdin_open: true)
CMD ["node", "dist/server.js"]
