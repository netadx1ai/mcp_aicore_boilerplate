# Development Setup - NetADX AI-CORE

Complete guide to setting up your development environment for NetADX AI-CORE.

## Prerequisites

### Required Software

```bash
# Node.js 18 or higher
node --version  # Should be v18.x.x or higher

# npm (comes with Node.js)
npm --version

# MongoDB (local or remote)
mongod --version
```

### Install Node.js

**macOS:**
```bash
# Using Homebrew
brew install node@20

# Or download from nodejs.org
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
- Download installer from [nodejs.org](https://nodejs.org)

### Install MongoDB

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -sc)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Or use MongoDB Atlas (cloud):**
- Sign up at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
- Create free cluster
- Get connection string

## Project Setup

### 1. Clone/Copy Boilerplate

```bash
# If from git repository
git clone <repository-url>
cd mcp_aicore_boilerplate

# Or copy the boilerplate directory
cp -r mcp_aicore_boilerplate my-project
cd my-project
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- `@modelcontextprotocol/sdk` - MCP protocol
- `tsx` - TypeScript execution
- `mongodb` - MongoDB driver
- `jsonwebtoken` - JWT authentication
- `winston` - Logging
- `zod` - Schema validation
- And development dependencies (TypeScript, ESLint, Prettier)

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your settings
nano .env
```

**Minimal configuration:**
```bash
NODE_ENV=development
PORT=8005
USE_HTTP=true

# MongoDB (local)
MONGODB_URI=mongodb://localhost:27017/netadx_aicore

# JWT
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=debug
```

**MongoDB Atlas configuration:**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/netadx_aicore?retryWrites=true&w=majority
```

### 4. Verify Setup

```bash
# Test MongoDB connection
mongosh mongodb://localhost:27017/netadx_aicore

# Or test with the app
npm start
```

## Development Environment

### Project Structure

```
my-project/
├── src/
│   ├── index.ts              # Start here
│   ├── tools/
│   │   └── example-tool.ts   # Example to learn from
│   ├── utils/
│   │   ├── auth.ts          # JWT authentication
│   │   ├── mongodb.ts       # Database connection
│   │   ├── logger.ts        # Logging
│   │   └── config.ts        # Configuration
│   ├── transport/
│   │   └── http.ts          # HTTP server
│   └── types/
│       └── index.ts         # TypeScript types
├── .env                      # Your configuration
├── package.json
└── tsconfig.json
```

### Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

**Direct TypeScript execution:**
```bash
npx tsx src/index.ts
```

### Development Workflow

1. **Make changes** in `src/`
2. **Server auto-reloads** (if using `npm run dev`)
3. **Test changes** with curl or Postman
4. **Check logs** for errors
5. **Commit changes** when working

## Testing the API

### Health Check

```bash
curl http://localhost:8005/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-31T10:00:00.000Z"
}
```

### Get JWT Token

For development, generate a test token:

```bash
# Using Node.js
node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({ userObjId: 'test-user-123' }, 'dev-secret-change-in-production', { expiresIn: '24h' }));"
```

Or use the test token generator:
```typescript
// test-token.ts
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userObjId: 'test-user-123', username: 'testuser' },
  'dev-secret-change-in-production',
  { expiresIn: '24h' }
);

console.log('JWT Token:', token);
```

```bash
npx tsx test-token.ts
```

### List Available Tools

```bash
curl -H "x-access-token: YOUR_TOKEN_HERE" \
     http://localhost:8005/tools
```

### Call Example Tool

```bash
# List items
curl -X POST \
  -H "x-access-token: YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"action":"list_items"}' \
  http://localhost:8005/tools/example_tool

# Create item
curl -X POST \
  -H "x-access-token: YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"action":"create_item","data":{"name":"Test Item","value":42}}' \
  http://localhost:8005/tools/example_tool
```

## IDE Setup

### VS Code (Recommended)

**Install Extensions:**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "mongodb.mongodb-vscode"
  ]
}
```

**Settings (.vscode/settings.json):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

**Launch Configuration (.vscode/launch.json):**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["tsx", "src/index.ts"],
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### Environment Variables in IDE

**VS Code (.env file is auto-loaded):**
- No additional setup needed

**WebStorm/IntelliJ:**
- Install EnvFile plugin
- Configure run configuration to load `.env`

## Database Setup

### Local MongoDB

**Create database and user:**
```javascript
// Connect to MongoDB
mongosh

// Create database
use netadx_aicore

// Create user
db.createUser({
  user: "netadx_dev",
  pwd: "dev_password",
  roles: [{ role: "readWrite", db: "netadx_aicore" }]
})

// Test connection
mongosh "mongodb://netadx_dev:dev_password@localhost:27017/netadx_aicore"
```

**Update .env:**
```bash
MONGODB_URI=mongodb://netadx_dev:dev_password@localhost:27017/netadx_aicore
```

### MongoDB Atlas (Cloud)

1. Create free cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create database user
3. Whitelist your IP address (or use 0.0.0.0/0 for development)
4. Get connection string
5. Update `.env`:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/netadx_aicore?retryWrites=true&w=majority
```

## Common Issues

### Port Already in Use

```bash
# Error: Port 8005 is already in use

# Find process using the port
lsof -i :8005

# Kill the process
kill -9 <PID>

# Or use a different port in .env
PORT=8006
```

### MongoDB Connection Failed

```bash
# Error: MongoServerError: Authentication failed

# Check MongoDB is running
mongod --version
sudo systemctl status mongod  # Linux
brew services list  # macOS

# Start MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS

# Verify connection string
mongosh "mongodb://localhost:27017"
```

### JWT Token Invalid

```bash
# Error: Invalid token signature

# Make sure JWT_SECRET in .env matches the secret used to generate token
# Regenerate token with correct secret
```

### TypeScript Errors

```bash
# Error: Cannot find module

# Rebuild node_modules
rm -rf node_modules package-lock.json
npm install

# Check TypeScript configuration
npx tsc --noEmit
```

## Development Tools

### Useful Commands

```bash
# Start development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check

# Clean build artifacts
npm run clean
```

### Database Tools

**MongoDB Compass (GUI):**
- Download from [mongodb.com/products/compass](https://www.mongodb.com/products/compass)
- Connect to your MongoDB instance
- Browse collections, run queries

**mongosh (CLI):**
```bash
# Connect
mongosh mongodb://localhost:27017/netadx_aicore

# List collections
show collections

# Query collection
db.example_items.find()

# Insert document
db.example_items.insertOne({ name: "test" })
```

### API Testing Tools

**curl (Command line):**
```bash
curl -X POST \
  -H "x-access-token: TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"list_items"}' \
  http://localhost:8005/tools/example_tool
```

**Postman:**
- Create collection
- Add requests
- Set headers: `x-access-token`
- Save for team use

**HTTPie:**
```bash
http POST localhost:8005/tools/example_tool \
  x-access-token:TOKEN \
  action=list_items
```

## Next Steps

1. Read [Core Concepts](./core-concepts.md)
2. Study [MCP Tool Pattern Guide](./mcp-tool-pattern-guide.md)
3. Create your first custom tool
4. Check [Testing Guide](./testing-and-validation.md)

---

**Last Updated:** 2025-10-31  
**Version:** 1.0.0  
**Maintained by:** NetADX AI-CORE Team
