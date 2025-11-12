/**
 * @fileoverview API Endpoint Documentation for NetADX AI-CORE MCP API
 * 
 * This module contains comprehensive JSDoc annotations for all API endpoints
 * including health checks, server info, JSON-RPC, and tool execution endpoints.
 * 
 * @author NetADX AI-CORE Team
 * @version 1.0.0
 */

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: System health check
 *     description: |
 *       Returns comprehensive health information about the server including:
 *       - Server status and uptime
 *       - Memory usage statistics
 *       - Database connectivity
 *       - System performance metrics
 *       
 *       This endpoint is typically used by:
 *       - Load balancers for health checks
 *       - Monitoring systems for alerting
 *       - DevOps teams for system diagnostics
 *       
 *       **No authentication required** - This is a public health endpoint.
 *     operationId: getSystemHealth
 *     responses:
 *       200:
 *         description: Server is healthy and operational
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             examples:
 *               healthy_server:
 *                 summary: Healthy server response
 *                 value:
 *                   status: "healthy"
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *                   sessionId: "sess_abc123def456"
 *                   uptime: 86400
 *                   memory:
 *                     used: 268435456
 *                     total: 1073741824
 *                     percentage: 25.0
 *                   version: "1.0.0"
 *                   services:
 *                     mongodb: "healthy"
 *                     auth: "healthy"
 *                   performance:
 *                     avg_response_time: "145ms"
 *                     requests_per_minute: 324
 *       500:
 *         description: Server is experiencing issues
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             examples:
 *               unhealthy_server:
 *                 summary: Unhealthy server response
 *                 value:
 *                   status: "unhealthy"
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *                   sessionId: "sess_abc123def456"
 *                   uptime: 86400
 *                   memory:
 *                     used: 966367641
 *                     total: 1073741824
 *                     percentage: 90.0
 *                   version: "1.0.0"
 *                   services:
 *                     mongodb: "unhealthy"
 *                     auth: "healthy"
 *                   errors:
 *                     - "MongoDB connection timeout"
 *                     - "High memory usage detected"
 */

/**
 * @swagger
 * /info:
 *   get:
 *     tags:
 *       - Server Info
 *     summary: Get server information and capabilities
 *     description: |
 *       Returns detailed information about the server including:
 *       - Server name, version, and protocol information
 *       - Available capabilities and features
 *       - API endpoints and their descriptions
 *       - Transport configuration details
 *       
 *       This endpoint is useful for:
 *       - Client applications to discover server capabilities
 *       - API documentation and introspection
 *       - Integration testing and validation
 *       
 *       **No authentication required** - This is a public information endpoint.
 *     operationId: getServerInfo
 *     responses:
 *       200:
 *         description: Server information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerInfo'
 *             examples:
 *               server_info:
 *                 summary: Complete server information
 *                 value:
 *                   name: "netadx-aicore"
 *                   version: "1.0.0"
 *                   protocol: "2024-11-05"
 *                   transport: "http"
 *                   sessionId: "sess_abc123def456"
 *                   capabilities:
 *                     tools: {}
 *                     authentication:
 *                       types: ["apikey", "jwt"]
 *                       required: true
 *                     rateLimit:
 *                       enabled: true
 *                       requests: 100
 *                       window: "1m"
 *                   endpoints:
 *                     health: "/health"
 *                     info: "/info"
 *                     rpc: "/rpc"
 *                     tools: "/tools"
 *                     docs: "/docs"
 *                   features:
 *                     - "JWT Authentication"
 *                     - "MongoDB Integration"
 *                     - "Rate Limiting"
 *                     - "CORS Support"
 *                     - "API Documentation"
 */

/**
 * @swagger
 * /rpc:
 *   post:
 *     tags:
 *       - JSON-RPC
 *     summary: JSON-RPC 2.0 endpoint
 *     description: |
 *       Handles JSON-RPC 2.0 requests for Model Context Protocol communication.
 *       
 *       **Supported Methods:**
 *       - `tools/list` - List available tools
 *       - `tools/call` - Execute a specific tool
 *       - `capabilities/get` - Get server capabilities
 *       
 *       **JSON-RPC 2.0 Specification:**
 *       - All requests must include `jsonrpc: "2.0"`
 *       - Method name specifies the operation
 *       - Parameters are passed in the `params` object
 *       - Unique `id` for request tracking
 *       
 *       **Authentication:** Required (API Key or JWT)
 *       **Rate Limiting:** Applied per user/API key
 *     operationId: handleJsonRpc
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JsonRpcRequest'
 *           examples:
 *             list_tools:
 *               summary: List available tools
 *               description: Request to list all available MCP tools
 *               value:
 *                 jsonrpc: "2.0"
 *                 method: "tools/list"
 *                 params: {}
 *                 id: 1
 *             call_tool:
 *               summary: Execute a tool
 *               description: Request to execute a specific tool with arguments
 *               value:
 *                 jsonrpc: "2.0"
 *                 method: "tools/call"
 *                 params:
 *                   name: "example-tool"
 *                   arguments:
 *                     action: "create"
 *                     data:
 *                       name: "Test Document"
 *                       content: "This is a test document created via JSON-RPC"
 *                       tags: ["test", "rpc"]
 *                 id: 2
 *             get_capabilities:
 *               summary: Get server capabilities
 *               description: Request server capabilities information
 *               value:
 *                 jsonrpc: "2.0"
 *                 method: "capabilities/get"
 *                 params: {}
 *                 id: 3
 *     responses:
 *       200:
 *         description: JSON-RPC request processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JsonRpcResponse'
 *             examples:
 *               success_response:
 *                 summary: Successful JSON-RPC response
 *                 value:
 *                   jsonrpc: "2.0"
 *                   result:
 *                     accepted: true
 *                     data:
 *                       tools:
 *                         - name: "example-tool"
 *                           description: "Example tool for demonstration"
 *                   id: 1
 *               error_response:
 *                 summary: JSON-RPC error response
 *                 value:
 *                   jsonrpc: "2.0"
 *                   error:
 *                     code: -32601
 *                     message: "Method not found"
 *                     data:
 *                       method: "invalid/method"
 *                       available_methods: ["tools/list", "tools/call", "capabilities/get"]
 *                   id: 1
 *       400:
 *         description: Invalid JSON-RPC request format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JsonRpcResponse'
 *             examples:
 *               invalid_format:
 *                 summary: Invalid request format
 *                 value:
 *                   jsonrpc: "2.0"
 *                   error:
 *                     code: -32600
 *                     message: "Invalid Request"
 *                     data:
 *                       details: "Missing required field: jsonrpc"
 *                   id: null
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /tools:
 *   get:
 *     tags:
 *       - MCP Tools
 *     summary: List all available MCP tools
 *     description: |
 *       Returns a comprehensive list of all available MCP tools with their:
 *       - Names and descriptions
 *       - Input schema specifications
 *       - Categories and versions
 *       - Usage examples and documentation
 *       
 *       **Use Cases:**
 *       - Tool discovery for client applications
 *       - API documentation generation
 *       - Integration testing and validation
 *       - Dynamic UI generation based on available tools
 *       
 *       **Authentication:** Required (API Key or JWT)
 *       **Caching:** Response is cached for 5 minutes
 *     operationId: listMcpTools
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - name: category
 *         in: query
 *         description: Filter tools by category
 *         schema:
 *           type: string
 *           enum: [utility, data, ai, analysis, communication]
 *         example: utility
 *       - name: version
 *         in: query
 *         description: Filter tools by version
 *         schema:
 *           type: string
 *           pattern: '^\d+\.\d+\.\d+$'
 *         example: "1.0.0"
 *       - name: include_examples
 *         in: query
 *         description: Include usage examples in response
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Tools listed successfully
 *         headers:
 *           X-Total-Tools:
 *             description: Total number of available tools
 *             schema:
 *               type: integer
 *           Cache-Control:
 *             description: Cache control header
 *             schema:
 *               type: string
 *               example: "public, max-age=300"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ToolsListResponse'
 *             examples:
 *               all_tools:
 *                 summary: Complete tools list
 *                 value:
 *                   tools:
 *                     - name: "example-tool"
 *                       description: "Example tool for CRUD operations on MongoDB documents"
 *                       inputSchema:
 *                         type: "object"
 *                         properties:
 *                           action:
 *                             type: "string"
 *                             enum: ["create", "read", "update", "delete", "list"]
 *                           data:
 *                             type: "object"
 *                           id:
 *                             type: "string"
 *                             pattern: "^[0-9a-fA-F]{24}$"
 *                         required: ["action"]
 *                       category: "utility"
 *                       version: "1.0.0"
 *                       examples:
 *                         - name: "Create Document"
 *                           input:
 *                             action: "create"
 *                             data:
 *                               name: "Sample"
 *                               content: "Sample content"
 *                   count: 1
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *               filtered_tools:
 *                 summary: Filtered tools by category
 *                 value:
 *                   tools:
 *                     - name: "example-tool"
 *                       description: "Example utility tool"
 *                       category: "utility"
 *                       version: "1.0.0"
 *                   count: 1
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *                   filters:
 *                     category: "utility"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /tools/{toolName}:
 *   post:
 *     tags:
 *       - MCP Tools
 *     summary: Execute a specific MCP tool
 *     description: |
 *       Execute a specific MCP tool with the provided arguments and return results.
 *       
 *       **Execution Process:**
 *       1. Tool name validation and existence check
 *       2. Input argument validation against tool schema
 *       3. Authentication and authorization verification
 *       4. Credit consumption calculation and deduction
 *       5. Tool execution with error handling
 *       6. Response formatting and metadata inclusion
 *       
 *       **Error Handling:**
 *       - Input validation errors return 400 status
 *       - Authentication failures return 401 status
 *       - Permission issues return 403 status
 *       - Tool not found returns 404 status
 *       - Rate limit exceeded returns 429 status
 *       - Execution errors return 500 status
 *       
 *       **Performance:**
 *       - Execution time tracking included in response
 *       - Timeout protection (30 seconds default)
 *       - Memory usage monitoring
 *     operationId: executeMcpTool
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - name: toolName
 *         in: path
 *         required: true
 *         description: Name of the tool to execute
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9_-]+$'
 *           minLength: 1
 *           maxLength: 50
 *         examples:
 *           example_tool:
 *             summary: Example tool name
 *             value: "example-tool"
 *           utility_tool:
 *             summary: Utility tool name
 *             value: "utility-helper"
 *       - name: X-Request-ID
 *         in: header
 *         description: Optional request ID for tracking
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: X-Timeout
 *         in: header
 *         description: Custom timeout in seconds (max 300)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 300
 *           default: 30
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ToolExecutionRequest'
 *           examples:
 *             create_operation:
 *               summary: Create a new document
 *               description: Example of creating a new document using the example tool
 *               value:
 *                 arguments:
 *                   action: "create"
 *                   data:
 *                     name: "Project Proposal"
 *                     content: "Detailed project proposal for Q1 2024 initiatives including AI integration, performance optimization, and user experience improvements."
 *                     tags: ["project", "proposal", "2024", "ai"]
 *                     metadata:
 *                       priority: "high"
 *                       department: "engineering"
 *                       budget: 50000
 *             read_operation:
 *               summary: Read an existing document
 *               description: Example of reading a document by its ID
 *               value:
 *                 arguments:
 *                   action: "read"
 *                   id: "507f1f77bcf86cd799439011"
 *             complex_query:
 *               summary: Complex search query
 *               description: Example of a complex search with multiple filters
 *               value:
 *                 arguments:
 *                   action: "list"
 *                   query:
 *                     tags: ["project", "2024"]
 *                     metadata:
 *                       priority: "high"
 *                     limit: 25
 *                     skip: 0
 *                   options:
 *                     sort: "created_at"
 *                     order: "desc"
 *                     include_metadata: true
 *     responses:
 *       200:
 *         description: Tool executed successfully
 *         headers:
 *           X-Execution-Time:
 *             description: Tool execution time in milliseconds
 *             schema:
 *               type: string
 *               example: "156ms"
 *           X-Request-ID:
 *             description: Request tracking ID
 *             schema:
 *               type: string
 *           X-Credits-Consumed:
 *             description: Number of credits consumed
 *             schema:
 *               type: integer
 *               example: 1
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ToolExecutionResponse'
 *             examples:
 *               successful_creation:
 *                 summary: Successful document creation
 *                 value:
 *                   statusCode: 200
 *                   headers:
 *                     Content-Type: "application/json"
 *                     X-Execution-Time: "89ms"
 *                   body:
 *                     content:
 *                       - type: "text"
 *                         text: "Successfully created document with ID: 507f1f77bcf86cd799439014"
 *                       - type: "resource"
 *                         uri: "mongodb://documents/507f1f77bcf86cd799439014"
 *                         mimeType: "application/json"
 *                     isError: false
 *                     metadata:
 *                       documentsAffected: 1
 *                       operation: "create"
 *                   metadata:
 *                     requestId: "req_abc123def456"
 *                     executionTime: 89
 *                     creditsConsumed: 1
 *                     timestamp: "2023-12-01T10:00:00.000Z"
 *               successful_query:
 *                 summary: Successful document query
 *                 value:
 *                   statusCode: 200
 *                   headers:
 *                     Content-Type: "application/json"
 *                     X-Execution-Time: "234ms"
 *                   body:
 *                     content:
 *                       - type: "text"
 *                         text: |
 *                           Found 3 documents matching your criteria:
 *                           
 *                           1. Project Proposal (ID: 507f1f77bcf86cd799439014)
 *                              Tags: project, proposal, 2024, ai
 *                              Priority: high, Department: engineering
 *                              Created: 2023-12-01T10:00:00.000Z
 *                           
 *                           2. AI Integration Plan (ID: 507f1f77bcf86cd799439015)
 *                              Tags: project, ai, integration, 2024
 *                              Priority: high, Department: engineering
 *                              Created: 2023-11-30T15:30:00.000Z
 *                           
 *                           3. Performance Optimization (ID: 507f1f77bcf86cd799439016)
 *                              Tags: project, performance, optimization, 2024
 *                              Priority: high, Department: engineering
 *                              Created: 2023-11-29T09:15:00.000Z
 *                     isError: false
 *                     metadata:
 *                       totalCount: 3
 *                       hasMore: false
 *                       operation: "list"
 *                   metadata:
 *                     requestId: "req_def456ghi789"
 *                     executionTime: 234
 *                     creditsConsumed: 1
 *                     timestamp: "2023-12-01T10:01:00.000Z"
 *       400:
 *         description: Invalid tool arguments or request format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_arguments:
 *                 summary: Missing required arguments
 *                 value:
 *                   error: "Bad Request"
 *                   message: "Missing required field: arguments"
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *                   requestId: "req_error_001"
 *                   statusCode: 400
 *                   details:
 *                     field: "arguments"
 *                     expected: "object"
 *                     received: "undefined"
 *               validation_failed:
 *                 summary: Argument validation failed
 *                 value:
 *                   error: "Validation Error"
 *                   message: "Invalid argument: action must be one of [create, read, update, delete, list]"
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *                   requestId: "req_error_002"
 *                   statusCode: 400
 *                   details:
 *                     field: "arguments.action"
 *                     value: "invalid_action"
 *                     allowedValues: ["create", "read", "update", "delete", "list"]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Tool not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               tool_not_found:
 *                 summary: Specified tool does not exist
 *                 value:
 *                   error: "Not Found"
 *                   message: "Tool 'non-existent-tool' not found"
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *                   requestId: "req_error_404"
 *                   statusCode: 404
 *                   details:
 *                     toolName: "non-existent-tool"
 *                     availableTools: ["example-tool"]
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         description: Tool execution failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               execution_error:
 *                 summary: Tool execution failed
 *                 value:
 *                   error: "Internal Server Error"
 *                   message: "Tool execution failed: database connection timeout"
 *                   timestamp: "2023-12-01T10:00:00.000Z"
 *                   requestId: "req_error_500"
 *                   statusCode: 500
 *                   details:
 *                     toolName: "example-tool"
 *                     executionTime: 30000
 *                     error: "MongoTimeoutError"
 */

/**
 * Common response examples and reusable components
 */
export const commonExamples = {
  authenticationHeaders: {
    apiKey: {
      'X-API-Key': 'your-api-key-here'
    },
    bearerToken: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  },

  errorScenarios: {
    rateLimitExceeded: {
      error: "Too Many Requests",
      message: "Rate limit exceeded: 100 requests per minute",
      timestamp: "2023-12-01T10:00:00.000Z",
      requestId: "req_rate_limit_001",
      statusCode: 429,
      retryAfter: 60
    },
    
    insufficientPermissions: {
      error: "Forbidden",
      message: "Insufficient permissions to execute this tool",
      timestamp: "2023-12-01T10:00:00.000Z",
      requestId: "req_forbidden_001",
      statusCode: 403,
      requiredPermissions: ["tool:execute", "data:write"]
    }
  },

  successMetadata: {
    executionTime: "125ms",
    requestId: "req_success_001",
    creditsConsumed: 1,
    timestamp: "2023-12-01T10:00:00.000Z",
    serverVersion: "1.0.0"
  }
};

export default {
  commonExamples
};