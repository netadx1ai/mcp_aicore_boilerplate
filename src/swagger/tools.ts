/**
 * @fileoverview Tool-specific Swagger documentation for NetADX AI-CORE MCP API
 * 
 * This module contains detailed API documentation for all MCP tools including
 * request/response schemas, examples, and JSDoc annotations.
 * 
 * @author NetADX AI-CORE Team
 * @version 1.0.0
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ExampleToolRequest:
 *       type: object
 *       required:
 *         - action
 *       properties:
 *         action:
 *           type: string
 *           enum: [create, read, update, delete, list]
 *           description: The operation to perform
 *           example: create
 *         data:
 *           type: object
 *           description: Data payload for create/update operations
 *           properties:
 *             name:
 *               type: string
 *               description: Item name
 *               example: "Sample Document"
 *             content:
 *               type: string
 *               description: Item content
 *               example: "This is sample content for demonstration"
 *             tags:
 *               type: array
 *               items:
 *                 type: string
 *               description: Associated tags
 *               example: ["demo", "example", "test"]
 *             metadata:
 *               type: object
 *               additionalProperties: true
 *               description: Additional metadata
 *         id:
 *           type: string
 *           description: Document ID for read/update/delete operations
 *           pattern: "^[0-9a-fA-F]{24}$"
 *           example: "507f1f77bcf86cd799439011"
 *         query:
 *           type: object
 *           description: Query parameters for search operations
 *           properties:
 *             name:
 *               type: string
 *               description: Search by name (partial match)
 *             tags:
 *               type: array
 *               items:
 *                 type: string
 *               description: Filter by tags
 *             limit:
 *               type: number
 *               minimum: 1
 *               maximum: 100
 *               default: 10
 *               description: Maximum number of results
 *             skip:
 *               type: number
 *               minimum: 0
 *               default: 0
 *               description: Number of results to skip
 *         options:
 *           type: object
 *           description: Additional operation options
 *           properties:
 *             validate:
 *               type: boolean
 *               default: true
 *               description: Enable input validation
 *             upsert:
 *               type: boolean
 *               default: false
 *               description: Create if doesn't exist (update operations)
 *             returnDocument:
 *               type: string
 *               enum: [before, after]
 *               default: after
 *               description: Return document before or after update
 *     
 *     ExampleToolResponse:
 *       type: object
 *       required:
 *         - content
 *         - isError
 *       properties:
 *         content:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [text, image, resource]
 *                 description: Content type
 *               text:
 *                 type: string
 *                 description: Text content (for type=text)
 *               data:
 *                 type: string
 *                 format: base64
 *                 description: Binary data (for type=image/resource)
 *               mimeType:
 *                 type: string
 *                 description: MIME type (for type=image/resource)
 *               uri:
 *                 type: string
 *                 format: uri
 *                 description: Resource URI (for type=resource)
 *               annotations:
 *                 type: object
 *                 description: Additional content annotations
 *         isError:
 *           type: boolean
 *           description: Whether the operation resulted in an error
 *         metadata:
 *           type: object
 *           properties:
 *             executionTime:
 *               type: number
 *               description: Execution time in milliseconds
 *             requestId:
 *               type: string
 *               description: Unique request identifier
 *             timestamp:
 *               type: string
 *               format: date-time
 *               description: Operation timestamp
 *             documentsAffected:
 *               type: number
 *               description: Number of documents affected
 *             totalCount:
 *               type: number
 *               description: Total count for list operations
 */

/**
 * @swagger
 * /tools/example-tool:
 *   post:
 *     tags:
 *       - MCP Tools
 *     summary: Execute example tool
 *     description: |
 *       Execute the example tool with various CRUD operations on MongoDB documents.
 *       
 *       **Supported Operations:**
 *       - `create`: Create a new document
 *       - `read`: Retrieve a document by ID
 *       - `update`: Update an existing document
 *       - `delete`: Delete a document by ID
 *       - `list`: List documents with optional filtering
 *       
 *       **Authentication Required:** API Key or JWT Token
 *       
 *       **Rate Limits:** 100 requests per minute per user
 *       
 *       **Credit Cost:** 1 credit per operation
 *     operationId: executeExampleTool
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - arguments
 *             properties:
 *               arguments:
 *                 $ref: '#/components/schemas/ExampleToolRequest'
 *           examples:
 *             createDocument:
 *               summary: Create a new document
 *               description: Create a new document with name, content, and tags
 *               value:
 *                 arguments:
 *                   action: create
 *                   data:
 *                     name: "AI Research Paper"
 *                     content: "Comprehensive analysis of neural network architectures..."
 *                     tags: ["ai", "research", "neural-networks"]
 *                     metadata:
 *                       category: "research"
 *                       priority: "high"
 *             readDocument:
 *               summary: Read a document by ID
 *               description: Retrieve a specific document using its MongoDB ObjectId
 *               value:
 *                 arguments:
 *                   action: read
 *                   id: "507f1f77bcf86cd799439011"
 *             updateDocument:
 *               summary: Update an existing document
 *               description: Update document content and metadata
 *               value:
 *                 arguments:
 *                   action: update
 *                   id: "507f1f77bcf86cd799439011"
 *                   data:
 *                     content: "Updated comprehensive analysis of neural network architectures..."
 *                     tags: ["ai", "research", "neural-networks", "updated"]
 *                   options:
 *                     returnDocument: "after"
 *             deleteDocument:
 *               summary: Delete a document
 *               description: Remove a document from the database
 *               value:
 *                 arguments:
 *                   action: delete
 *                   id: "507f1f77bcf86cd799439011"
 *             listDocuments:
 *               summary: List documents with filtering
 *               description: Search and list documents with optional filters
 *               value:
 *                 arguments:
 *                   action: list
 *                   query:
 *                     tags: ["ai", "research"]
 *                     limit: 20
 *                     skip: 0
 *     responses:
 *       '200':
 *         description: Tool execution successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ToolExecutionResponse'
 *                 - type: object
 *                   properties:
 *                     body:
 *                       $ref: '#/components/schemas/ExampleToolResponse'
 *             examples:
 *               createSuccess:
 *                 summary: Document created successfully
 *                 value:
 *                   statusCode: 200
 *                   headers:
 *                     Content-Type: application/json
 *                     X-Execution-Time: "89ms"
 *                   body:
 *                     content:
 *                       - type: text
 *                         text: "Successfully created document with ID: 507f1f77bcf86cd799439011"
 *                     isError: false
 *                     metadata:
 *                       executionTime: 89
 *                       requestId: "req_abc123xyz"
 *                       timestamp: "2023-12-01T10:00:00.000Z"
 *                       documentsAffected: 1
 *               readSuccess:
 *                 summary: Document retrieved successfully
 *                 value:
 *                   statusCode: 200
 *                   headers:
 *                     Content-Type: application/json
 *                     X-Execution-Time: "45ms"
 *                   body:
 *                     content:
 *                       - type: text
 *                         text: |
 *                           {
 *                             "_id": "507f1f77bcf86cd799439011",
 *                             "name": "AI Research Paper",
 *                             "content": "Comprehensive analysis of neural network architectures...",
 *                             "tags": ["ai", "research", "neural-networks"],
 *                             "metadata": {
 *                               "category": "research",
 *                               "priority": "high"
 *                             },
 *                             "createdAt": "2023-12-01T10:00:00.000Z",
 *                             "updatedAt": "2023-12-01T10:00:00.000Z"
 *                           }
 *                     isError: false
 *                     metadata:
 *                       executionTime: 45
 *                       requestId: "req_def456uvw"
 *                       timestamp: "2023-12-01T10:01:00.000Z"
 *               listSuccess:
 *                 summary: Documents listed successfully
 *                 value:
 *                   statusCode: 200
 *                   headers:
 *                     Content-Type: application/json
 *                     X-Execution-Time: "156ms"
 *                   body:
 *                     content:
 *                       - type: text
 *                         text: |
 *                           Found 3 documents:
 *                           
 *                           1. AI Research Paper (ID: 507f1f77bcf86cd799439011)
 *                              Tags: ai, research, neural-networks
 *                              Created: 2023-12-01T10:00:00.000Z
 *                           
 *                           2. Machine Learning Basics (ID: 507f1f77bcf86cd799439012)
 *                              Tags: ai, research, machine-learning
 *                              Created: 2023-12-01T09:30:00.000Z
 *                           
 *                           3. Deep Learning Survey (ID: 507f1f77bcf86cd799439013)
 *                              Tags: ai, research, deep-learning
 *                              Created: 2023-12-01T09:00:00.000Z
 *                     isError: false
 *                     metadata:
 *                       executionTime: 156
 *                       requestId: "req_ghi789rst"
 *                       timestamp: "2023-12-01T10:02:00.000Z"
 *                       totalCount: 3
 *       '400':
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingAction:
 *                 summary: Missing required action parameter
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Missing required parameter: action"
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *                   requestId: "req_error123"
 *                   statusCode: 400
 *               invalidObjectId:
 *                 summary: Invalid MongoDB ObjectId format
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Invalid ObjectId format: must be a 24-character hex string"
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *                   requestId: "req_error456"
 *                   statusCode: 400
 *               validationError:
 *                 summary: Data validation failed
 *                 value:
 *                   error: "Validation Error"
 *                   message: "Validation failed: name is required for create operations"
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *                   requestId: "req_error789"
 *                   statusCode: 400
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Not Found"
 *               message: "Document with ID 507f1f77bcf86cd799439011 not found"
 *               timestamp: "2023-12-01T10:00:00.000Z"
 *               requestId: "req_notfound123"
 *               statusCode: 404
 *       '429':
 *         $ref: '#/components/responses/RateLimitError'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               databaseError:
 *                 summary: Database connection error
 *                 value:
 *                   error: "Internal Server Error"
 *                   message: "Database operation failed: connection timeout"
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *                   requestId: "req_db_error123"
 *                   statusCode: 500
 *               unexpectedError:
 *                 summary: Unexpected server error
 *                 value:
 *                   error: "Internal Server Error"
 *                   message: "An unexpected error occurred while processing the request"
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *                   requestId: "req_unexpected456"
 *                   statusCode: 500
 */

/**
 * Example tool operation examples for different use cases
 */
export const exampleToolOperations = {
  // Data management examples
  dataManagement: {
    createUserProfile: {
      action: 'create',
      data: {
        name: 'User Profile Template',
        content: JSON.stringify({
          userId: 'user_12345',
          preferences: {
            theme: 'dark',
            language: 'en',
            notifications: true
          },
          profile: {
            name: 'John Doe',
            email: 'john@example.com',
            avatar: 'https://example.com/avatar.jpg'
          }
        }),
        tags: ['user', 'profile', 'template'],
        metadata: {
          type: 'user_profile',
          version: '1.0',
          schema: 'user_profile_v1'
        }
      }
    },
    
    createConfiguration: {
      action: 'create',
      data: {
        name: 'API Configuration',
        content: JSON.stringify({
          apiVersion: 'v1',
          endpoints: {
            auth: '/auth',
            users: '/users',
            data: '/data'
          },
          rateLimit: {
            requests: 100,
            window: '1m'
          },
          features: {
            caching: true,
            logging: true,
            metrics: true
          }
        }),
        tags: ['config', 'api', 'settings'],
        metadata: {
          environment: 'development',
          lastUpdated: new Date().toISOString()
        }
      }
    }
  },

  // Content management examples
  contentManagement: {
    createArticle: {
      action: 'create',
      data: {
        name: 'Getting Started with AI',
        content: `# Getting Started with AI

## Introduction
Artificial Intelligence (AI) is transforming how we interact with technology...

## Key Concepts
- Machine Learning
- Neural Networks
- Natural Language Processing

## Next Steps
1. Choose your AI framework
2. Prepare your data
3. Train your first model`,
        tags: ['ai', 'tutorial', 'beginner'],
        metadata: {
          author: 'AI Team',
          category: 'tutorial',
          difficulty: 'beginner',
          estimatedReadTime: '5 minutes'
        }
      }
    },

    searchContent: {
      action: 'list',
      query: {
        tags: ['tutorial'],
        limit: 10,
        skip: 0
      },
      options: {
        validate: true
      }
    }
  },

  // Analytics and reporting examples
  analytics: {
    createReport: {
      action: 'create',
      data: {
        name: 'Monthly Usage Report',
        content: JSON.stringify({
          period: '2023-12',
          metrics: {
            totalRequests: 15420,
            uniqueUsers: 892,
            averageResponseTime: '245ms',
            errorRate: '0.12%'
          },
          topEndpoints: [
            { path: '/api/v1/tools', requests: 5234 },
            { path: '/api/v1/health', requests: 3421 },
            { path: '/api/v1/info', requests: 2145 }
          ],
          recommendations: [
            'Consider caching for frequently accessed endpoints',
            'Monitor error rates for /api/v1/tools endpoint',
            'Optimize response times for heavy queries'
          ]
        }),
        tags: ['analytics', 'report', 'monthly'],
        metadata: {
          reportType: 'usage',
          generated: new Date().toISOString(),
          format: 'json'
        }
      }
    }
  }
};

/**
 * Tool validation schemas and helpers
 */
export const toolValidation = {
  actions: ['create', 'read', 'update', 'delete', 'list'],
  
  requiredFields: {
    create: ['action', 'data'],
    read: ['action', 'id'],
    update: ['action', 'id', 'data'],
    delete: ['action', 'id'],
    list: ['action']
  },

  dataTypes: {
    id: 'string',
    name: 'string',
    content: 'string',
    tags: 'array',
    metadata: 'object'
  },

  limits: {
    nameMaxLength: 200,
    contentMaxLength: 50000,
    tagsMaxCount: 20,
    queryLimit: 100
  }
};

export default {
  exampleToolOperations,
  toolValidation
};