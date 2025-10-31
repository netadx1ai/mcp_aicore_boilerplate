# NetADX AI-CORE - MCP API Boilerplate

[![TypeScript](https://img.shields.io/badge/typescript-5.2+-blue.svg)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-v1.0.0-green.svg)](https://github.com/modelcontextprotocol/typescript-sdk)
[![Node.js](https://img.shields.io/badge/node-18+-brightgreen.svg)](https://nodejs.org)
[![NetADX AI-CORE](https://img.shields.io/badge/NetADX-AI--CORE-purple.svg)](https://netadx.ai)

A minimal, production-ready MCP (Model Context Protocol) API server boilerplate for building scalable AI-powered backend services.

**Purpose**: Simple, extensible foundation for building MCP-compliant API servers with TypeScript, MongoDB, and JWT authentication.

**Architecture**: Clean, minimal structure - easy to understand and extend for your specific use case.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)
- [Creating Your First Tool](#creating-your-first-tool)
- [API Documentation](#api-documentation)
- [Claude Desktop Integration](#claude-desktop-integration)

## Overview

NetADX AI-CORE is a simple, clean boilerplate for building MCP API servers. It provides:

- **MCP Protocol Compliance** - Official SDK v1.0.0
- **TypeScript** - Type-safe development
- **MongoDB Integration** - Database ready with connection pooling
- **JWT Authentication** - Secure API access
- **Direct TypeScript Execution** - No build step with `tsx`
- **Production Ready** - Logging, error handling, graceful shutdown
- **Minimal and Clean** - Easy to understand and extend

### What's Included

**Core Infrastructure:**
- MCP Server setup with stdio and HTTP transports
- MongoDB connection manager
- JWT authentication manager
- Winston logging
- Environment configuration
- Example CRUD tool

**Deployment:**
- Quick deployment script (`deploy-quick.sh`)
- PM2 ecosystem configuration
- Docker support
- Nginx reverse proxy with CORS
- Comprehensive deployment documentation

**Claude Desktop Integration:**
- Built-in stdio wrapper support
- Local development with `development/mcp-stdio-wrapper`
- Production-ready npm package `@netadx1ai/mcp-stdio-wrapper`
- Complete integration documentation

## Features

### Direct TypeScript Execution

No build step required! Uses `tsx` to run TypeScript directly:

```bash
# Traditional approach (NOT used here)
npm run build        # Compile TS → JS
node dist/index.js   # Run compiled code

# NetADX AI-CORE approach
npx tsx src/index.ts  # Run TypeScript directly
```

**Benefits:**
- Faster deployments - no compilation step required
- Easier debugging - errors point to actual `.ts` source files
- Live updates - change code, restart, ready
- Simpler CI/CD - just sync TypeScript files directly

### Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.2+ (strict mode)
- **Framework**: MCP Protocol (official SDK v1.0.0)
- **Database**: MongoDB with connection pooling
- **Transport**: HTTP/HTTPS + stdio
- **Authentication**: JWT (HS256)
- **Logging**: Winston
- **Execution**: tsx (direct TypeScript execution)

## Quick Start

### Prerequisites

```bash
# Node.js 18+ required
node -v

# MongoDB (local or remote)
mongod --version
```

### Installation

```bash
# Clone or use this boilerplate
cd development/mcp_aicore_boilerplate

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Edit with your settings
```

### Configuration

Edit `.env` file:

```bash
# Server
NODE_ENV=development
PORT=8005
USE_HTTP=true

# MongoDB
MONGODB_URI=mongodb://localhost:27017/netadx_aicore

# JWT
JWT_SECRET=your-secure-random-secret-here
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=info
```

### Run

```bash
# Development mode
npm run dev

# Production mode (with tsx)
npm start

# Or directly
npx tsx src/index.ts
```

### Test

```bash
# Health check
curl http://localhost:8005/health

# List tools (requires JWT token)
curl -H "x-access-token: YOUR_JWT_TOKEN" \
     http://localhost:8005/tools

# Call example tool
curl -X POST \
  -H "x-access-token: YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"list_items"}' \
  http://localhost:8005/tools/example_tool
```

## Project Structure

```
mcp_aicore_boilerplate/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── core/                    # MCP core infrastructure
│   │   ├── server.ts           # Base MCP server
│   │   └── index.ts
│   ├── tools/                   # MCP tools (your business logic)
│   │   └── example-tool.ts     # Example CRUD tool
│   ├── transport/               # Transport layers
│   │   ├── http.ts             # HTTP transport
│   │   ├── http-server.ts      # HTTP server wrapper
│   │   └── index.ts
│   ├── utils/                   # Utilities
│   │   ├── auth.ts             # JWT authentication
│   │   ├── config.ts           # Configuration management
│   │   ├── logger.ts           # Winston logging
│   │   ├── mongodb.ts          # MongoDB manager
│   │   └── index.ts
│   └── types/                   # TypeScript type definitions
│       └── index.ts
├── deployment/                  # Deployment configurations
│   ├── deploy.sh               # Full deployment script
│   ├── pm2/                    # PM2 configs
│   ├── docker/                 # Docker configs
│   ├── nginx/                  # Nginx reverse proxy with CORS
│   └── README.md
├── docs/                        # Documentation (cleaned)
├── .env.example                 # Environment template (simplified)
├── .env.deploy.example          # Deployment config template
├── deploy-quick.sh              # Quick TypeScript deployment
├── ecosystem.config.js          # PM2 config (uses tsx)
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
└── README.md                    # This file
```

## Configuration

### Environment Variables

All configuration in `.env` file:

```bash
# Server Configuration
NODE_ENV=development          # development | staging | production
PORT=8005                     # API server port
HOST=0.0.0.0                  # Listen address
USE_HTTP=true                 # true = HTTP, false = stdio

# MongoDB
MONGODB_URI=mongodb://localhost:27017/netadx_aicore
MONGODB_MAX_POOL_SIZE=50

# JWT Authentication
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=24h
JWT_ALGORITHM=HS256

# CORS
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=info               # error | warn | info | debug
LOG_FORMAT=json
LOG_FILE=/var/log/netadx-aicore/app.log
```

### MongoDB Collections

The example tool uses `example_items` collection. Add your own collections as needed.

## Development

### Adding a New Tool

1. **Create tool file** in `src/tools/`:

```typescript
// src/tools/my-tool.ts
import { z } from 'zod';
import type { MongoDBManager } from '../utils/mongodb';
import type { Logger } from '../utils/logger';

const MyToolInputSchema = z.object({
  action: z.enum(['do_something']),
  data: z.string(),
});

export function createMyTool(mongodb: MongoDBManager, logger: Logger) {
  return {
    name: 'my_tool',
    description: 'My custom tool',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['do_something'] },
        data: { type: 'string' },
      },
      required: ['action'],
    },
    async execute(input: unknown) {
      const { action, data } = MyToolInputSchema.parse(input);
      
      // Your logic here
      const result = { success: true, message: 'Done!' };
      
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  };
}
```

2. **Register tool** in `src/index.ts`:

```typescript
import { createMyTool } from './tools/my-tool';

// In registerTools() method:
const myTool = createMyTool(this.mongodb, this.logger);

// Add to tools list
this.server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      { name: exampleTool.name, description: exampleTool.description, inputSchema: exampleTool.inputSchema },
      { name: myTool.name, description: myTool.description, inputSchema: myTool.inputSchema },
    ],
  };
});

// Add to tools/call handler
if (name === myTool.name) {
  return await myTool.execute(args);
}
```

3. **Test your tool:**

```bash
npx tsx src/index.ts

curl -X POST \
  -H "x-access-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"do_something","data":"test"}' \
  http://localhost:8005/tools/my_tool
```

### Running Tests

```bash
# Add tests in tests/ directory
npm test
```

### Code Quality

```bash
# Linting
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

## Deployment

### Quick Deployment (Recommended)

Uses `deploy-quick.sh` to sync TypeScript files directly:

```bash
# Configure deployment
cp .env.deploy.example .env.deploy
nano .env.deploy  # Set your server details

# Deploy all files
./deploy-quick.sh

# Deploy specific file
./deploy-quick.sh src/tools/my-tool.ts

# Deploy without restart
./deploy-quick.sh src/ true
```

### PM2 Deployment

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Monitor
pm2 status
pm2 logs netadx-aicore
pm2 monit
```

### Docker Deployment

```bash
cd deployment/docker
docker build -t netadx-aicore .
docker run -d -p 8005:8005 --env-file .env netadx-aicore
```

### Nginx Reverse Proxy

```bash
# Copy nginx config
sudo cp deployment/nginx/netadx-aicore-simple.conf /etc/nginx/sites-available/netadx-aicore

# Enable and reload
sudo ln -s /etc/nginx/sites-available/netadx-aicore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

See `deployment/README.md` and `deployment/nginx/README.md` for complete guides.

## Claude Desktop Integration

### Using Published Package (Production)

Configure Claude Desktop to connect to your deployed API:

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

### Using Local Development Wrapper

For local development and testing:

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

See [Claude Desktop Integration Guide](docs/claude-desktop-integration.md) for complete documentation.

## API Documentation

### Authentication

All API endpoints (except `/health`) require JWT authentication:

```bash
# Include JWT token in header
curl -H "x-access-token: YOUR_JWT_TOKEN" http://localhost:8005/tools
```

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check (no auth) |
| `/tools` | GET | List available tools |
| `/tools/{tool_name}` | POST | Execute specific tool |

### Example Tool Actions

**List items:**
```bash
curl -X POST \
  -H "x-access-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"list_items"}' \
  http://localhost:8005/tools/example_tool
```

**Create item:**
```bash
curl -X POST \
  -H "x-access-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"create_item","data":{"name":"Test","value":123}}' \
  http://localhost:8005/tools/example_tool
```

**Get item:**
```bash
curl -X POST \
  -H "x-access-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"get_data","id":"item_id"}' \
  http://localhost:8005/tools/example_tool
```

## Contributing

This is a boilerplate template. Fork it and customize for your needs!

## License

MIT License - NetADX AI-CORE Team

---

## Learning Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.io)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/)
- [JWT Introduction](https://jwt.io/introduction)

## Support

For questions or issues:
- Check the `deployment/README.md` for deployment help
- Check the `deployment/nginx/README.md` for nginx/CORS help
- Review the example tool in `src/tools/example-tool.ts`
- See [Claude Desktop Integration](docs/claude-desktop-integration.md) for MCP client setup

---

**Document Control**
- Created: 2025-10-31
- Version: 1.0.0
- Status: Boilerplate/Template
- Developed by: NetADX AI-CORE Team
- License: MIT

**What is NetADX AI-CORE?**

NetADX AI-CORE is a production-ready boilerplate for building MCP (Model Context Protocol) compliant API servers. It provides:

- Complete MCP implementation with official SDK v1.0.0
- Production-tested authentication and authorization
- Scalable MongoDB integration
- Comprehensive logging and error handling
- Direct TypeScript execution (no build step)
- Deployment scripts and configurations
- Clean, minimal, easy to extend
- Claude Desktop integration support

**Use Cases:**
- Building AI-powered backend APIs
- Creating MCP-compliant services
- Rapid API prototyping
- Learning MCP protocol implementation

---

**Get Started:**
1. Copy `.env.example` to `.env`
2. Configure MongoDB and JWT settings
3. Run `npm install && npm start`
4. Start building your tools in `src/tools/`
5. Integrate with Claude Desktop using the stdio wrapper
