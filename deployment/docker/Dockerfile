# NetADX AI-CORE MCP API Server - Docker Image
# Uses tsx to run TypeScript directly without compilation

FROM node:20-alpine

LABEL maintainer="NetADX AI-CORE Team"
LABEL description="NetADX AI-CORE MCP API Server - Direct TypeScript Execution"
LABEL version="1.0.0"

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including tsx for TypeScript execution)
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY src ./src

# Copy environment template
COPY .env.example ./.env.example

# Create logs directory
RUN mkdir -p /var/log/netadx-aicore && \
    chown -R nodejs:nodejs /var/log/netadx-aicore

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8005/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application with tsx (direct TypeScript execution)
CMD ["npx", "tsx", "src/index.ts"]
