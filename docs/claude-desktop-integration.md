# Claude Desktop Integration Guide

## Overview

This guide explains how to integrate your NetADX AI-CORE MCP server with Claude Desktop using the local development stdio wrapper (`development/mcp-stdio-wrapper`).

## What is the MCP Stdio Wrapper?

The `@netadx1ai/mcp-stdio-wrapper` package acts as a bridge between Claude Desktop and your HTTP-based MCP API server. It:

- Converts stdio communication (used by Claude Desktop) to HTTP requests
- Handles JWT authentication automatically
- Provides transparent tool forwarding
- Enables local development and testing

## Prerequisites

1. **Claude Desktop** installed and configured
2. **NetADX AI-CORE server** running (either locally or deployed)
3. **Valid JWT token** for API authentication
4. **Node.js 18+** installed

## Configuration Methods

### Method 1: Using Published Package (Recommended for Production)

Configure Claude Desktop to use the published npm package:

**File:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "netadx-aicore": {
      "command": "npx",
      "args": ["-y", "@netadx1ai/mcp-stdio-wrapper@latest"],
      "env": {
        "API_URL": "https://your-api-domain.com",
        "JWT_TOKEN": "your-jwt-token-here",
        "LOG_FILE": "/tmp/netadx-aicore-mcp.log",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Method 2: Using Local Development Wrapper

For development and testing with the local wrapper:

**File:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "netadx-aicore-dev": {
      "command": "npx",
      "args": [
        "tsx",
        "/Volumes/T72/Work2025AI/mongodb/netadx-workspace/development/mcp-stdio-wrapper/src/index.ts"
      ],
      "env": {
        "API_URL": "http://localhost:8005",
        "JWT_TOKEN": "your-jwt-token-here",
        "LOG_FILE": "/tmp/netadx-aicore-dev-mcp.log",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

**Note:** Adjust the absolute path to match your workspace location.

### Method 3: Multiple Environments

You can configure multiple environments simultaneously:

```json
{
  "mcpServers": {
    "netadx-aicore-local": {
      "command": "npx",
      "args": ["tsx", "/path/to/development/mcp-stdio-wrapper/src/index.ts"],
      "env": {
        "API_URL": "http://localhost:8005",
        "JWT_TOKEN": "local-dev-token",
        "LOG_FILE": "/tmp/netadx-local.log",
        "LOG_LEVEL": "debug"
      }
    },
    "netadx-aicore-staging": {
      "command": "npx",
      "args": ["-y", "@netadx1ai/mcp-stdio-wrapper@latest"],
      "env": {
        "API_URL": "https://staging.your-domain.com",
        "JWT_TOKEN": "staging-token",
        "LOG_FILE": "/tmp/netadx-staging.log",
        "LOG_LEVEL": "info"
      }
    },
    "netadx-aicore-production": {
      "command": "npx",
      "args": ["-y", "@netadx1ai/mcp-stdio-wrapper@latest"],
      "env": {
        "API_URL": "https://api.your-domain.com",
        "JWT_TOKEN": "production-token",
        "LOG_FILE": "/tmp/netadx-prod.log",
        "LOG_LEVEL": "warn"
      }
    }
  }
}
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `API_URL` | URL of your MCP API server | `http://localhost:8005` or `https://api.domain.com` |
| `JWT_TOKEN` | Valid JWT token for authentication | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `LOG_FILE` | Path to log file | `/tmp/mcp-stdio.log` | `/var/log/netadx-mcp.log` |
| `LOG_LEVEL` | Logging verbosity | `info` | `debug`, `info`, `warn`, `error` |
| `REQUEST_TIMEOUT` | HTTP request timeout (ms) | `30000` | `60000` |
| `RETRY_ATTEMPTS` | Number of retry attempts | `3` | `5` |

## Configuration File Locations

### macOS
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

### Windows
```
%APPDATA%\Claude\claude_desktop_config.json
```

### Linux
```
~/.config/Claude/claude_desktop_config.json
```

## Generating JWT Tokens

### Development Token

For local development, generate a test token:

```bash
# Using Node.js
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userObjId: 'dev-user-123', email: 'dev@example.com' },
  'your-jwt-secret',
  { algorithm: 'HS256', expiresIn: '24h' }
);
console.log(token);
"
```

### Production Token

For production, obtain tokens from your authentication system. The token must include:

```json
{
  "userObjId": "user-id-from-database",
  "email": "user@domain.com",
  "iat": 1234567890,
  "exp": 1234654290
}
```

## Testing the Integration

### Step 1: Start Your MCP Server

```bash
cd /Volumes/T72/Work2025AI/mongodb/netadx-workspace/development/mcp_aicore_boilerplate
npm start
```

Verify server is running:
```bash
curl http://localhost:8005/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Step 2: Configure Claude Desktop

Edit the configuration file with your settings as shown above.

### Step 3: Restart Claude Desktop

Completely quit and restart Claude Desktop application.

### Step 4: Verify Connection

In Claude Desktop, check the server status:

1. Look for the server name in the bottom-left corner
2. Green indicator means connected successfully
3. Click to see available tools

### Step 5: Test Tool Execution

In Claude Desktop chat, try:

```
Can you list items using the example_tool?
```

Claude should execute the tool and return results.

## Troubleshooting

### Problem: Server Not Appearing in Claude Desktop

**Check:**
1. Configuration file syntax (valid JSON)
2. File location is correct for your OS
3. Claude Desktop has been restarted after config changes

**Solution:**
```bash
# Validate JSON syntax
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python -m json.tool
```

### Problem: Connection Errors

**Check:**
1. MCP server is running (`curl http://localhost:8005/health`)
2. API_URL is correct (include http:// or https://)
3. Firewall allows connections
4. No port conflicts

**Solution:**
```bash
# Check if port is in use
lsof -i :8005

# Check server logs
tail -f /tmp/netadx-aicore-dev-mcp.log
```

### Problem: Authentication Errors

**Check:**
1. JWT_TOKEN is valid and not expired
2. JWT_SECRET matches between token generation and server
3. Token includes required claims (userObjId)

**Solution:**
```bash
# Verify token (using jwt.io or decode it)
node -e "
const jwt = require('jsonwebtoken');
const token = 'YOUR_TOKEN_HERE';
console.log(jwt.decode(token));
"
```

### Problem: Tools Not Appearing

**Check:**
1. Server has tools registered (`curl -H "x-access-token: TOKEN" http://localhost:8005/tools`)
2. Stdio wrapper is forwarding tool list correctly
3. Log files for errors

**Solution:**
```bash
# Check server tool list
curl -H "x-access-token: YOUR_TOKEN" http://localhost:8005/tools

# Check stdio wrapper logs
tail -f /tmp/netadx-aicore-dev-mcp.log
```

### Problem: Tool Execution Fails

**Check:**
1. Tool input schema matches your request
2. MongoDB is connected
3. Server logs for errors

**Solution:**
```bash
# Enable debug logging
# In claude_desktop_config.json:
"LOG_LEVEL": "debug"

# Check server logs
pm2 logs netadx-aicore
# or
tail -f /var/log/netadx-aicore/app.log
```

## Development Workflow

### Local Development Setup

1. **Terminal 1: Run MCP Server**
```bash
cd development/mcp_aicore_boilerplate
npm run dev
```

2. **Terminal 2: Watch Logs**
```bash
tail -f /tmp/netadx-aicore-dev-mcp.log
```

3. **Configure Claude Desktop** with local wrapper path

4. **Restart Claude Desktop**

5. **Make code changes** in `src/tools/`

6. **Restart MCP server** (Ctrl+C, then `npm run dev`)

7. **Restart Claude Desktop** to pick up changes

### Testing Changes

```bash
# Direct API test
curl -X POST \
  -H "x-access-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"list_items"}' \
  http://localhost:8005/tools/example_tool

# Via Claude Desktop
# Just ask Claude to use the tool in chat
```

## Production Deployment

### Step 1: Deploy MCP Server

```bash
cd development/mcp_aicore_boilerplate
./deploy-quick.sh
```

### Step 2: Configure Production Environment

Update Claude Desktop config with production URL:

```json
{
  "mcpServers": {
    "netadx-aicore-prod": {
      "command": "npx",
      "args": ["-y", "@netadx1ai/mcp-stdio-wrapper@latest"],
      "env": {
        "API_URL": "https://api.your-domain.com",
        "JWT_TOKEN": "production-token-here",
        "LOG_FILE": "/var/log/netadx-mcp.log",
        "LOG_LEVEL": "warn"
      }
    }
  }
}
```

### Step 3: SSL/TLS Considerations

For production HTTPS endpoints:

```bash
# Ensure SSL certificates are valid
curl -v https://api.your-domain.com/health

# If using self-signed certificates (NOT recommended for production)
# Add to env:
"NODE_TLS_REJECT_UNAUTHORIZED": "0"
```

### Step 4: Token Management

**Production token best practices:**

1. Use short-lived tokens (1-24 hours)
2. Implement token refresh mechanism
3. Rotate tokens regularly
4. Store tokens securely (not in git)
5. Use environment-specific tokens

## Monitoring and Logging

### Log Files

**Stdio Wrapper Logs:**
```bash
tail -f /tmp/netadx-aicore-dev-mcp.log
```

**MCP Server Logs:**
```bash
# PM2
pm2 logs netadx-aicore

# Direct file
tail -f /var/log/netadx-aicore/app.log
```

### Log Levels

Set appropriate log levels for each environment:

- **Development:** `debug` - See all requests/responses
- **Staging:** `info` - See important operations
- **Production:** `warn` - Only warnings and errors

### Monitoring Integration

Monitor stdio wrapper health:

```bash
# Check wrapper process
ps aux | grep mcp-stdio-wrapper

# Watch log file size
ls -lh /tmp/netadx-aicore-dev-mcp.log

# Count errors in logs
grep ERROR /tmp/netadx-aicore-dev-mcp.log | wc -l
```

## Security Best Practices

1. **Never commit JWT tokens** to version control
2. **Use HTTPS** for production API endpoints
3. **Rotate tokens** regularly
4. **Limit token scope** to minimum required permissions
5. **Monitor logs** for unauthorized access attempts
6. **Use environment variables** for sensitive data
7. **Implement rate limiting** on API server
8. **Validate SSL certificates** in production

## Advanced Configuration

### Custom Request Headers

Modify stdio wrapper to add custom headers:

```typescript
// In development/mcp-stdio-wrapper/src/index.ts
const headers = {
  'x-access-token': JWT_TOKEN,
  'x-custom-header': 'your-value',
  'user-agent': 'NetADX-MCP-Client/1.0'
};
```

### Retry Logic

Configure retry behavior:

```json
{
  "env": {
    "RETRY_ATTEMPTS": "5",
    "RETRY_DELAY": "1000",
    "REQUEST_TIMEOUT": "60000"
  }
}
```

### Multiple API Endpoints

Configure different servers for different purposes:

```json
{
  "mcpServers": {
    "netadx-core": {
      "command": "npx",
      "args": ["-y", "@netadx1ai/mcp-stdio-wrapper@latest"],
      "env": {
        "API_URL": "https://core-api.domain.com",
        "JWT_TOKEN": "core-token"
      }
    },
    "netadx-analytics": {
      "command": "npx",
      "args": ["-y", "@netadx1ai/mcp-stdio-wrapper@latest"],
      "env": {
        "API_URL": "https://analytics-api.domain.com",
        "JWT_TOKEN": "analytics-token"
      }
    }
  }
}
```

## Reference

### Complete Example Configuration

```json
{
  "mcpServers": {
    "netadx-aicore-dev": {
      "command": "npx",
      "args": [
        "tsx",
        "/Volumes/T72/Work2025AI/mongodb/netadx-workspace/development/mcp-stdio-wrapper/src/index.ts"
      ],
      "env": {
        "API_URL": "http://localhost:8005",
        "JWT_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyT2JqSWQiOiI2NzQyZjYzZTczNjc4OTAwMTNiYTM2ZmEiLCJlbWFpbCI6ImRldkBleGFtcGxlLmNvbSIsImlhdCI6MTczMDM2MDAwMCwiZXhwIjoxNzMwNDQ2NDAwfQ.signature",
        "LOG_FILE": "/tmp/netadx-aicore-dev-mcp.log",
        "LOG_LEVEL": "debug",
        "REQUEST_TIMEOUT": "30000",
        "RETRY_ATTEMPTS": "3"
      }
    }
  }
}
```

### Environment-Specific Tokens

Generate tokens for different environments:

```bash
# Development
JWT_SECRET=netadxAPI \
JWT_EXPIRES_IN=24h \
node -e "..."

# Staging
JWT_SECRET=staging-secret \
JWT_EXPIRES_IN=8h \
node -e "..."

# Production
JWT_SECRET=production-secret \
JWT_EXPIRES_IN=1h \
node -e "..."
```

## Support and Resources

### Documentation
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Claude Desktop Documentation](https://claude.ai/desktop)
- [NetADX AI-CORE Documentation](../README.md)

### Troubleshooting Resources
- Server logs: `/var/log/netadx-aicore/app.log`
- Wrapper logs: `/tmp/netadx-aicore-dev-mcp.log`
- API health: `curl http://localhost:8005/health`

### Related Guides
- [Development Setup](./development-setup.md)
- [HTTP Transport](./HTTP_TRANSPORT.md)
- [Deployment Guide](../deployment/README.md)

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-10-31  
**Maintained by:** NetADX AI-CORE Team
