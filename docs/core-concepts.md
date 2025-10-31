# Core Concepts - NetADX AI-CORE

Understanding the fundamental concepts of the NetADX AI-CORE MCP API boilerplate.

## MCP (Model Context Protocol)

### What is MCP?

MCP (Model Context Protocol) is a standardized protocol for AI agents to interact with external tools and services. Think of it as an API standard specifically designed for AI interactions.

**Key benefits:**
- Standardized tool interface
- Type-safe tool definitions
- Built-in validation
- Multiple transport options (HTTP, stdio)

### MCP Components

1. **Server** - Hosts and exposes tools
2. **Tools** - Functions that perform actions
3. **Transport** - Communication layer (HTTP/stdio)
4. **Client** - Consumes the tools (Claude Desktop, custom apps)

## Architecture Overview

### Layer Structure

```
┌─────────────────────────────────────┐
│         Application Layer           │
│    (Your business logic/tools)      │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│          MCP Protocol Layer         │
│   (Tool registration, validation)   │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│         Transport Layer             │
│      (HTTP server or stdio)         │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│       Infrastructure Layer          │
│  (MongoDB, Auth, Logging, Config)   │
└─────────────────────────────────────┘
```

### Request Flow

```
1. Client sends request → HTTP/stdio transport
2. Transport validates authentication → JWT check
3. MCP server routes to tool → Based on tool name
4. Tool executes logic → Business logic
5. Tool returns result → Formatted response
6. Transport sends response → Back to client
```

## Core Components

### 1. MCP Server (`src/index.ts`)

The main application class that:
- Initializes all services (MongoDB, Auth, Logger)
- Registers MCP tools
- Handles tool discovery (`tools/list`)
- Handles tool execution (`tools/call`)
- Manages lifecycle (startup, shutdown)

**Example:**
```typescript
class NetAdxAiCoreServer {
  private server: Server;
  private mongodb: MongoDBManager;
  private authManager: JwtAuthManager;
  private logger: Logger;
  
  // ... initialization and tool registration
}
```

### 2. MCP Tools (`src/tools/`)

Tools are the core functionality - the "API endpoints" in MCP terms.

**Tool Structure:**
```typescript
{
  name: 'tool_name',              // Unique identifier
  description: 'What it does',    // Human-readable description
  inputSchema: { /* JSON Schema */ },  // Input validation
  execute: async (input) => { /* logic */ }  // Implementation
}
```

**Example:** See `src/tools/example-tool.ts`

### 3. Transport Layer (`src/transport/`)

Handles communication between clients and the MCP server.

**HTTP Transport:**
- REST API endpoints
- JWT authentication
- CORS support
- Error handling

**Stdio Transport:**
- Standard input/output
- Used by Claude Desktop
- No authentication needed

### 4. Utilities (`src/utils/`)

Support services:

**MongoDB Manager:**
```typescript
class MongoDBManager {
  connect()      // Connect to database
  disconnect()   // Close connection
  getDb()        // Get database instance
  getCollection() // Get collection
}
```

**JWT Auth Manager:**
```typescript
class JwtAuthManager {
  generateToken()  // Create JWT token
  verifyToken()    // Validate JWT token
  createMiddleware() // Express middleware
}
```

**Logger:**
```typescript
logger.info()    // Info messages
logger.error()   // Error messages
logger.warn()    // Warning messages
logger.debug()   // Debug messages
```

## Data Flow

### Tool Execution Flow

```typescript
// 1. Client request
POST /tools/example_tool
Headers: x-access-token: <JWT>
Body: { "action": "list_items" }

// 2. HTTP Transport
- Validates JWT token
- Extracts user context
- Forwards to MCP server

// 3. MCP Server
- Finds tool by name
- Validates input against schema
- Calls tool.execute()

// 4. Tool Logic
- Accesses MongoDB
- Performs business logic
- Returns formatted result

// 5. Response
{
  "content": [{
    "type": "text",
    "text": "{ \"items\": [...] }"
  }]
}
```

## Configuration

### Environment-based Config

Configuration is loaded from environment variables:

```typescript
const config = {
  mongodb: {
    uri: process.env.MONGODB_URI,
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '50')
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  server: {
    port: parseInt(process.env.PORT || '8005'),
    useHttp: process.env.USE_HTTP === 'true'
  }
};
```

### Configuration Precedence

1. Environment variables
2. `.env` file
3. Default values in code

## Security Model

### Authentication Flow

```
1. User obtains JWT token (from auth service)
2. Client includes token in request header
3. Server validates token signature
4. Server extracts user context (userId, roles)
5. Tool has access to authenticated user info
```

### Authorization

Tools can check user permissions:

```typescript
async execute(input: unknown, context: UserContext) {
  // Check if user has permission
  if (!context.permissions.includes('write')) {
    throw new Error('Insufficient permissions');
  }
  
  // Proceed with action
  // ...
}
```

## Error Handling

### Error Types

1. **Validation Errors** - Invalid input schema
2. **Authentication Errors** - Invalid/missing token
3. **Business Logic Errors** - Tool-specific errors
4. **System Errors** - Database, network issues

### Error Response Format

```typescript
{
  "content": [{
    "type": "text",
    "text": JSON.stringify({
      "success": false,
      "error": "Error message here"
    })
  }],
  "isError": true
}
```

## Logging Strategy

### Log Levels

- **error** - System errors, exceptions
- **warn** - Warnings, deprecated features
- **info** - Important events (startup, shutdown, requests)
- **debug** - Detailed debugging information

### Structured Logging

```typescript
logger.info('Tool executed', {
  tool: 'example_tool',
  action: 'list_items',
  userId: user.id,
  executionTime: 125,
  itemCount: 10
});
```

## Database Patterns

### Connection Management

- Single connection pool for entire application
- Automatic reconnection on failure
- Graceful shutdown closes connections

### Data Access

```typescript
// Get database
const db = mongodb.getDb();

// Get collection
const collection = db.collection('items');

// Query
const items = await collection.find({}).toArray();

// Insert
await collection.insertOne({ name: 'test' });

// Update
await collection.updateOne(
  { _id: id },
  { $set: { name: 'updated' } }
);
```

## Lifecycle Management

### Startup Sequence

```
1. Load configuration
2. Initialize logger
3. Connect to MongoDB
4. Initialize JWT auth manager
5. Create MCP server
6. Register tools
7. Start transport (HTTP or stdio)
8. Log "Server ready"
```

### Shutdown Sequence

```
1. Receive shutdown signal (SIGTERM, SIGINT)
2. Log "Shutting down..."
3. Stop accepting new requests
4. Wait for pending requests to complete
5. Disconnect from MongoDB
6. Close transport
7. Exit process
```

## Best Practices

### Tool Development

1. **Single Responsibility** - One tool, one purpose
2. **Input Validation** - Always use Zod schemas
3. **Error Handling** - Catch and format errors
4. **Logging** - Log important actions
5. **Type Safety** - Use TypeScript types

### Configuration

1. **Environment Variables** - Never hardcode secrets
2. **Defaults** - Provide sensible defaults
3. **Validation** - Validate on startup
4. **Documentation** - Document all variables

### Security

1. **Authentication** - Always validate JWT
2. **Authorization** - Check user permissions
3. **Input Sanitization** - Validate all inputs
4. **Secrets Management** - Use environment variables
5. **HTTPS** - Use SSL in production

## Next Steps

- Read [MCP Tool Pattern Guide](./mcp-tool-pattern-guide.md) to create your first tool
- Review [HTTP Transport](./HTTP_TRANSPORT.md) for transport details
- Check [Development Setup](./development-setup.md) for environment configuration

---

**Last Updated:** 2025-10-31  
**Version:** 1.0.0  
**Maintained by:** NetADX AI-CORE Team
