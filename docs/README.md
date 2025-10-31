# NetADX AI-CORE - Documentation

Welcome to the NetADX AI-CORE MCP API Boilerplate documentation.

## Overview

NetADX AI-CORE is a minimal, production-ready boilerplate for building MCP (Model Context Protocol) compliant API servers with TypeScript, MongoDB, and JWT authentication.

## Documentation Structure

### Getting Started
- **[Main README](../README.md)** - Start here! Quick start, installation, and usage
- **[Development Setup](./development-setup.md)** - Set up your development environment
- **[Core Concepts](./core-concepts.md)** - Understanding the MCP architecture

### Development Guides
- **[MCP Tool Pattern Guide](./mcp-tool-pattern-guide.md)** - How to create MCP tools
- **[HTTP Transport](./HTTP_TRANSPORT.md)** - HTTP transport layer details
- **[Project Structure](./project-structure.md)** - Understanding the codebase organization

### Integration
- **[Claude Desktop Integration](./claude-desktop-integration.md)** - Connect to Claude Desktop with stdio wrapper

### Deployment
- **[Deployment Guide](../deployment/README.md)** - Deploy with PM2, Docker, or systemd
- **[Nginx Configuration](../deployment/nginx/README.md)** - Reverse proxy setup with CORS

### Testing
- **[Testing and Validation](./testing-and-validation.md)** - Testing strategies and tools

## Quick Links

### For Beginners
1. Read the [Main README](../README.md)
2. Follow [Development Setup](./development-setup.md)
3. Study the example tool at `src/tools/example-tool.ts`
4. Read [MCP Tool Pattern Guide](./mcp-tool-pattern-guide.md)
5. Create your first tool

### For Deploying
1. Configure `.env` file
2. Read [Deployment Guide](../deployment/README.md)
3. Use `./deploy-quick.sh` for quick deployment
4. Set up [Nginx](../deployment/nginx/README.md) for production

### For Claude Desktop Integration
1. Deploy your MCP server or run locally
2. Read [Claude Desktop Integration](./claude-desktop-integration.md)
3. Configure `claude_desktop_config.json`
4. Restart Claude Desktop
5. Start using your tools in Claude

## Key Features

- **Direct TypeScript Execution** - No build step with `tsx`
- **MCP Protocol Compliant** - Official SDK v1.0.0
- **MongoDB Integration** - Production-ready database setup
- **JWT Authentication** - Secure API access
- **Example Tool** - Learn from working code
- **Deployment Ready** - Scripts for PM2, Docker, Nginx
- **Claude Desktop Integration** - Built-in stdio wrapper support

## Architecture Overview

```
┌─────────────────┐
│   MCP Client    │  (Claude Desktop, Custom clients)
└────────┬────────┘
         │ HTTP/stdio
         ▼
┌─────────────────┐
│  NetADX Server  │  (src/index.ts)
│  ├─ HTTP Layer  │  (src/transport/http.ts)
│  ├─ Auth Layer  │  (src/utils/auth.ts)
│  └─ Tools       │  (src/tools/*.ts)
└────────┬────────┘
         │ MongoDB Driver
         ▼
┌─────────────────┐
│    MongoDB      │  (Database)
└─────────────────┘
```

## Environment Variables

See [.env.example](../.env.example) for all configuration options.

**Essential variables:**
```bash
NODE_ENV=development
PORT=8005
MONGODB_URI=mongodb://localhost:27017/netadx_aicore
JWT_SECRET=your-secret-here
```

## Project Structure

```
mcp_aicore_boilerplate/
├── src/
│   ├── index.ts           # Main entry point
│   ├── tools/             # Your MCP tools here
│   ├── utils/             # Utilities (auth, logger, mongodb)
│   ├── transport/         # HTTP/stdio transport
│   └── types/             # TypeScript types
├── deployment/            # Deployment scripts and configs
├── docs/                  # This documentation
└── README.md              # Main documentation
```

## Common Tasks

### Run Development Server
```bash
npm run dev
```

### Deploy to Production
```bash
./deploy-quick.sh
```

### Create a New Tool
See [MCP Tool Pattern Guide](./mcp-tool-pattern-guide.md)

### Run Tests
```bash
npm test
```

## Support

- Check the [Main README](../README.md) for FAQs
- Review example tool: `src/tools/example-tool.ts`
- Read deployment guides in `deployment/`

## Contributing

This is a boilerplate template. Fork it and customize for your needs!

## License

MIT License - NetADX AI-CORE Team

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-10-31  
**Maintained by:** NetADX AI-CORE Team
