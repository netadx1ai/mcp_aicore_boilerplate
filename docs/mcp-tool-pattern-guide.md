# MCP Tool Pattern Guide - NetADX AI-CORE

Complete guide to creating MCP tools in NetADX AI-CORE.

## What is an MCP Tool?

An MCP tool is a function that performs a specific action in your API. Think of it as an API endpoint, but designed specifically for AI agents to call.

**Example use cases:**
- Fetch user data
- Create/update/delete records
- Process files
- Call external APIs
- Run calculations
- Send notifications

## Tool Anatomy

### Basic Structure

```typescript
{
  name: string,              // Unique identifier
  description: string,       // What the tool does
  inputSchema: object,       // JSON Schema for input validation
  execute: async (input) => Promise<ToolResult>  // Implementation
}
```

### Example Tool

```typescript
export function createMyTool(mongodb: MongoDBManager, logger: Logger) {
  return {
    name: 'my_tool',
    description: 'Does something useful',
    
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get', 'create', 'update', 'delete'],
          description: 'Action to perform'
        },
        id: {
          type: 'string',
          description: 'Item ID'
        }
      },
      required: ['action']
    },
    
    async execute(input: unknown) {
      // Your implementation here
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true })
        }]
      };
    }
  };
}
```

## Step-by-Step Tutorial

### Step 1: Create Tool File

Create a new file in `src/tools/`:

```bash
touch src/tools/user-management.ts
```

### Step 2: Define Input Schema

Use Zod for type-safe validation:

```typescript
import { z } from 'zod';

const UserManagementInputSchema = z.object({
  action: z.enum(['get_user', 'create_user', 'update_user', 'delete_user']),
  userId: z.string().optional(),
  userData: z.object({
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['admin', 'user', 'viewer'])
  }).optional()
});

type UserManagementInput = z.infer<typeof UserManagementInputSchema>;
```

### Step 3: Implement Tool Function

```typescript
import type { MongoDBManager } from '../utils/mongodb';
import type { Logger } from '../utils/logger';

export function createUserManagementTool(
  mongodb: MongoDBManager,
  logger: Logger
) {
  return {
    name: 'user_management',
    description: 'Manage users - create, read, update, delete',
    
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get_user', 'create_user', 'update_user', 'delete_user'],
          description: 'Action to perform'
        },
        userId: {
          type: 'string',
          description: 'User ID (required for get, update, delete)'
        },
        userData: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'user', 'viewer'] }
          },
          description: 'User data (required for create, update)'
        }
      },
      required: ['action']
    },
    
    async execute(input: unknown) {
      try {
        // Validate input
        const validated = UserManagementInputSchema.parse(input);
        const { action, userId, userData } = validated;
        
        logger.info('Executing user management', { action, userId });
        
        // Get database collection
        const db = mongodb.getDb();
        const users = db.collection('users');
        
        let result: any;
        
        // Handle different actions
        switch (action) {
          case 'get_user':
            if (!userId) throw new Error('userId required for get_user');
            result = await users.findOne({ _id: userId });
            if (!result) throw new Error(`User not found: ${userId}`);
            break;
            
          case 'create_user':
            if (!userData) throw new Error('userData required for create_user');
            const insertResult = await users.insertOne({
              ...userData,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            result = {
              id: insertResult.insertedId,
              ...userData,
              success: true
            };
            break;
            
          case 'update_user':
            if (!userId) throw new Error('userId required for update_user');
            if (!userData) throw new Error('userData required for update_user');
            const updateResult = await users.updateOne(
              { _id: userId },
              {
                $set: {
                  ...userData,
                  updatedAt: new Date()
                }
              }
            );
            if (updateResult.matchedCount === 0) {
              throw new Error(`User not found: ${userId}`);
            }
            result = { success: true, modified: updateResult.modifiedCount };
            break;
            
          case 'delete_user':
            if (!userId) throw new Error('userId required for delete_user');
            const deleteResult = await users.deleteOne({ _id: userId });
            if (deleteResult.deletedCount === 0) {
              throw new Error(`User not found: ${userId}`);
            }
            result = { success: true, deleted: true };
            break;
        }
        
        logger.info('User management completed', { action, success: true });
        
        // Return success response
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
        
      } catch (error) {
        logger.error('User management failed', { error });
        
        // Return error response
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  };
}
```

### Step 4: Register Tool

In `src/index.ts`:

```typescript
import { createUserManagementTool } from './tools/user-management';

// In registerTools() method:
private registerTools() {
  const exampleTool = createExampleTool(this.mongodb, this.logger);
  const userTool = createUserManagementTool(this.mongodb, this.logger);  // Add this
  
  this.server.setRequestHandler('tools/list', async () => {
    return {
      tools: [
        {
          name: exampleTool.name,
          description: exampleTool.description,
          inputSchema: exampleTool.inputSchema
        },
        {
          name: userTool.name,  // Add this
          description: userTool.description,
          inputSchema: userTool.inputSchema
        }
      ]
    };
  });
  
  this.server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;
    
    if (name === exampleTool.name) {
      return await exampleTool.execute(args);
    }
    
    if (name === userTool.name) {  // Add this
      return await userTool.execute(args);
    }
    
    throw new Error(`Unknown tool: ${name}`);
  });
}
```

### Step 5: Test Your Tool

```bash
# Restart server
npm start

# List tools (verify it appears)
curl -H "x-access-token: YOUR_TOKEN" http://localhost:8005/tools

# Call your tool
curl -X POST \
  -H "x-access-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"create_user","userData":{"name":"John Doe","email":"john@example.com","role":"user"}}' \
  http://localhost:8005/tools/user_management
```

## Tool Patterns

### Pattern 1: CRUD Operations

```typescript
switch (action) {
  case 'create': // INSERT
    result = await collection.insertOne(data);
    break;
  case 'read':   // SELECT
    result = await collection.findOne({ _id: id });
    break;
  case 'update': // UPDATE
    result = await collection.updateOne({ _id: id }, { $set: data });
    break;
  case 'delete': // DELETE
    result = await collection.deleteOne({ _id: id });
    break;
}
```

### Pattern 2: List with Pagination

```typescript
case 'list':
  const page = input.page || 1;
  const limit = input.limit || 10;
  const skip = (page - 1) * limit;
  
  const items = await collection
    .find({})
    .skip(skip)
    .limit(limit)
    .toArray();
    
  const total = await collection.countDocuments();
  
  result = {
    items,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
  break;
```

### Pattern 3: Search/Filter

```typescript
case 'search':
  const query: any = {};
  
  if (input.name) {
    query.name = { $regex: input.name, $options: 'i' };
  }
  
  if (input.role) {
    query.role = input.role;
  }
  
  if (input.createdAfter) {
    query.createdAt = { $gte: new Date(input.createdAfter) };
  }
  
  const results = await collection.find(query).toArray();
  break;
```

### Pattern 4: Aggregation

```typescript
case 'statistics':
  const stats = await collection.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        avgAge: { $avg: '$age' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]).toArray();
  
  result = { statistics: stats };
  break;
```

### Pattern 5: External API Call

```typescript
case 'fetch_external':
  const response = await fetch('https://api.example.com/data', {
    headers: {
      'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  result = await response.json();
  break;
```

## Best Practices

### 1. Input Validation

Always validate with Zod:

```typescript
const InputSchema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(150),
  tags: z.array(z.string()).optional()
});

const validated = InputSchema.parse(input);
```

### 2. Error Handling

Catch and format errors properly:

```typescript
try {
  // Your logic
} catch (error) {
  logger.error('Tool failed', { error, input });
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }],
    isError: true
  };
}
```

### 3. Logging

Log important events:

```typescript
logger.info('Tool started', { action, userId });

// ... do work ...

logger.info('Tool completed', { action, result, executionTime });
```

### 4. Return Format

Always return consistent format:

```typescript
// Success
return {
  content: [{
    type: 'text',
    text: JSON.stringify({ success: true, data: result }, null, 2)
  }]
};

// Error
return {
  content: [{
    type: 'text',
    text: JSON.stringify({ success: false, error: 'Message' }, null, 2)
  }],
  isError: true
};
```

### 5. Database Queries

Use proper error handling:

```typescript
const item = await collection.findOne({ _id: id });

if (!item) {
  throw new Error(`Item not found: ${id}`);
}

// Work with item
```

## Advanced Patterns

### Transactions

```typescript
const session = mongodb.getClient().startSession();

try {
  await session.withTransaction(async () => {
    await users.updateOne({ _id: userId }, { $inc: { balance: -10 } }, { session });
    await orders.insertOne({ userId, amount: 10 }, { session });
  });
  
  result = { success: true };
} finally {
  await session.endSession();
}
```

### Caching

```typescript
const cache = new Map();

case 'get_with_cache':
  const cacheKey = `user:${userId}`;
  
  if (cache.has(cacheKey)) {
    logger.debug('Cache hit', { cacheKey });
    result = cache.get(cacheKey);
  } else {
    result = await users.findOne({ _id: userId });
    cache.set(cacheKey, result);
    setTimeout(() => cache.delete(cacheKey), 60000); // 1 minute TTL
  }
  break;
```

### Background Jobs

```typescript
case 'process_async':
  // Start background processing
  processInBackground(input).catch(err => {
    logger.error('Background job failed', { error: err });
  });
  
  result = {
    success: true,
    message: 'Processing started',
    jobId: generateId()
  };
  break;

async function processInBackground(input: any) {
  await sleep(5000);
  // Do heavy processing
}
```

## Testing Tools

### Unit Test Example

```typescript
import { createUserManagementTool } from '../tools/user-management';

describe('UserManagementTool', () => {
  let tool;
  let mockMongodb;
  let mockLogger;
  
  beforeEach(() => {
    mockMongodb = {
      getDb: () => ({
        collection: () => ({
          insertOne: jest.fn(),
          findOne: jest.fn()
        })
      })
    };
    
    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    };
    
    tool = createUserManagementTool(mockMongodb, mockLogger);
  });
  
  it('should create user', async () => {
    const result = await tool.execute({
      action: 'create_user',
      userData: {
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      }
    });
    
    expect(result.content[0].text).toContain('success');
  });
});
```

## Common Pitfalls

### ❌ Don't: Hardcode values

```typescript
// Bad
const apiKey = 'sk-1234567890';
```

### ✅ Do: Use environment variables

```typescript
// Good
const apiKey = process.env.EXTERNAL_API_KEY;
if (!apiKey) throw new Error('API key not configured');
```

### ❌ Don't: Ignore errors

```typescript
// Bad
const user = await users.findOne({ _id: id });
return user.name; // Crashes if null
```

### ✅ Do: Handle errors

```typescript
// Good
const user = await users.findOne({ _id: id });
if (!user) throw new Error(`User not found: ${id}`);
return user.name;
```

### ❌ Don't: Return raw errors

```typescript
// Bad
catch (error) {
  throw error; // Exposes stack trace
}
```

### ✅ Do: Format errors

```typescript
// Good
catch (error) {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: false,
        error: error.message
      })
    }],
    isError: true
  };
}
```

## Next Steps

- Review the example tool: `src/tools/example-tool.ts`
- Read [Testing Guide](./testing-and-validation.md)
- Check [Core Concepts](./core-concepts.md)
- Start building your custom tools!

---

**Last Updated:** 2025-10-31  
**Version:** 1.0.0  
**Maintained by:** NetADX AI-CORE Team
