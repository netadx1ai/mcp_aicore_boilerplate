/**
 * @fileoverview Swagger/OpenAPI Documentation Configuration
 * 
 * This module provides comprehensive API documentation for the NetADX AI-CORE
 * MCP boilerplate server, including all endpoints, schemas, and examples.
 * 
 * @author NetADX AI-CORE Team
 * @version 1.0.0
 */

import { SwaggerDefinition } from 'swagger-jsdoc';

/**
 * Swagger/OpenAPI 3.0 configuration
 */
export const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'NetADX AI-CORE MCP API',
    version: '1.0.0',
    description: `
      # NetADX AI-CORE MCP API Server
      
      A production-ready Model Context Protocol (MCP) API server built with TypeScript,
      MongoDB, and JWT authentication. This API provides tools for AI agents to interact
      with various services and data sources.
      
      ## Features
      - 🔧 **MCP Tools**: Execute AI-powered tools and operations
      - 🔐 **JWT Authentication**: Secure API access with role-based permissions
      - 📊 **MongoDB Integration**: Persistent data storage and retrieval
      - 🚀 **Production Ready**: Built for scalability and reliability
      - 📖 **Comprehensive Documentation**: Full OpenAPI specification
      
      ## Getting Started
      1. Obtain an API key or JWT token
      2. Include authentication in request headers
      3. Explore available tools via \`/tools\` endpoint
      4. Execute tools via \`/tools/{name}\` endpoint
      
      ## Authentication
      This API supports multiple authentication methods:
      - **API Key**: Include \`X-API-Key\` header
      - **JWT Token**: Include \`Authorization: Bearer <token>\` header
      
      ## Rate Limiting
      API requests are rate-limited to ensure fair usage and system stability.
    `,
    contact: {
      name: 'NetADX AI-CORE Team',
      email: 'support@netadx.ai',
      url: 'https://github.com/netadx1ai/netadx-workspace'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:8005',
      description: 'Development server'
    },
    {
      url: 'https://api.netadx.ai',
      description: 'Production server'
    }
  ],
  tags: [
    {
      name: 'Health',
      description: 'System health and status endpoints'
    },
    {
      name: 'Server Info',
      description: 'Server information and capabilities'
    },
    {
      name: 'MCP Tools',
      description: 'Model Context Protocol tool execution'
    },
    {
      name: 'JSON-RPC',
      description: 'JSON-RPC 2.0 protocol endpoints'
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for authentication'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication'
      }
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'unhealthy'],
            description: 'Health status of the server'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp of the health check'
          },
          sessionId: {
            type: 'string',
            description: 'Current session identifier'
          },
          uptime: {
            type: 'number',
            description: 'Server uptime in seconds'
          },
          memory: {
            type: 'object',
            properties: {
              used: { type: 'number', description: 'Used memory in bytes' },
              total: { type: 'number', description: 'Total memory in bytes' },
              percentage: { type: 'number', description: 'Memory usage percentage' }
            }
          },
          version: {
            type: 'string',
            description: 'Server version'
          }
        },
        required: ['status', 'timestamp', 'sessionId', 'uptime', 'memory', 'version']
      },
      ServerInfo: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Server name'
          },
          version: {
            type: 'string',
            description: 'Server version'
          },
          protocol: {
            type: 'string',
            description: 'MCP protocol version'
          },
          transport: {
            type: 'string',
            enum: ['http', 'stdio'],
            description: 'Transport protocol'
          },
          sessionId: {
            type: 'string',
            description: 'Current session identifier'
          },
          capabilities: {
            type: 'object',
            properties: {
              tools: {
                type: 'object',
                description: 'Tool capabilities'
              }
            }
          },
          endpoints: {
            type: 'object',
            properties: {
              health: { type: 'string', description: 'Health check endpoint' },
              info: { type: 'string', description: 'Server info endpoint' },
              rpc: { type: 'string', description: 'JSON-RPC endpoint' },
              tools: { type: 'string', description: 'Tools endpoint' },
              docs: { type: 'string', description: 'API documentation endpoint' }
            }
          }
        }
      },
      McpTool: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Tool name/identifier'
          },
          description: {
            type: 'string',
            description: 'Tool description and purpose'
          },
          inputSchema: {
            type: 'object',
            description: 'JSON Schema for tool input parameters'
          },
          category: {
            type: 'string',
            description: 'Tool category'
          },
          version: {
            type: 'string',
            description: 'Tool version'
          },
          examples: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                input: { type: 'object' },
                output: { type: 'object' }
              }
            }
          }
        },
        required: ['name', 'description', 'inputSchema']
      },
      ToolsListResponse: {
        type: 'object',
        properties: {
          tools: {
            type: 'array',
            items: { $ref: '#/components/schemas/McpTool' },
            description: 'List of available tools'
          },
          count: {
            type: 'number',
            description: 'Total number of tools'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Response timestamp'
          }
        },
        required: ['tools', 'count', 'timestamp']
      },
      ToolExecutionRequest: {
        type: 'object',
        properties: {
          arguments: {
            type: 'object',
            description: 'Tool execution arguments'
          }
        },
        required: ['arguments']
      },
      ToolExecutionResponse: {
        type: 'object',
        properties: {
          statusCode: {
            type: 'number',
            description: 'HTTP status code'
          },
          headers: {
            type: 'object',
            description: 'Response headers'
          },
          body: {
            type: 'object',
            properties: {
              content: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['text', 'image', 'resource'] },
                    text: { type: 'string' },
                    data: { type: 'string' },
                    mimeType: { type: 'string' }
                  }
                }
              },
              isError: {
                type: 'boolean',
                description: 'Whether the execution resulted in an error'
              }
            }
          },
          metadata: {
            type: 'object',
            properties: {
              requestId: { type: 'string' },
              executionTime: { type: 'number', description: 'Execution time in milliseconds' }
            }
          }
        }
      },
      JsonRpcRequest: {
        type: 'object',
        properties: {
          jsonrpc: {
            type: 'string',
            enum: ['2.0'],
            description: 'JSON-RPC version'
          },
          method: {
            type: 'string',
            description: 'Method name'
          },
          params: {
            type: 'object',
            description: 'Method parameters'
          },
          id: {
            oneOf: [
              { type: 'string' },
              { type: 'number' },
              { type: 'null' }
            ],
            description: 'Request identifier'
          }
        },
        required: ['jsonrpc', 'method']
      },
      JsonRpcResponse: {
        type: 'object',
        properties: {
          jsonrpc: {
            type: 'string',
            enum: ['2.0'],
            description: 'JSON-RPC version'
          },
          result: {
            type: 'object',
            description: 'Method result (present on success)'
          },
          error: {
            type: 'object',
            properties: {
              code: { type: 'number', description: 'Error code' },
              message: { type: 'string', description: 'Error message' },
              data: { type: 'object', description: 'Additional error data' }
            },
            description: 'Error details (present on failure)'
          },
          id: {
            oneOf: [
              { type: 'string' },
              { type: 'number' },
              { type: 'null' }
            ],
            description: 'Request identifier'
          }
        },
        required: ['jsonrpc', 'id']
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          },
          message: {
            type: 'string',
            description: 'Detailed error description'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Error timestamp'
          },
          requestId: {
            type: 'string',
            description: 'Request identifier for tracking'
          },
          statusCode: {
            type: 'number',
            description: 'HTTP status code'
          }
        },
        required: ['error', 'message', 'timestamp']
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication information is missing or invalid',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: 'Unauthorized',
              message: 'Invalid or missing authentication token',
              timestamp: '2023-12-01T10:00:00.000Z',
              requestId: 'req_123456789',
              statusCode: 401
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Insufficient permissions to access this resource',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: 'Forbidden',
              message: 'Insufficient permissions to execute this tool',
              timestamp: '2023-12-01T10:00:00.000Z',
              requestId: 'req_123456789',
              statusCode: 403
            }
          }
        }
      },
      NotFoundError: {
        description: 'The requested resource was not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: 'Not Found',
              message: 'Tool not found',
              timestamp: '2023-12-01T10:00:00.000Z',
              requestId: 'req_123456789',
              statusCode: 404
            }
          }
        }
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: 'Too Many Requests',
              message: 'Rate limit exceeded. Please try again later.',
              timestamp: '2023-12-01T10:00:00.000Z',
              requestId: 'req_123456789',
              statusCode: 429
            }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: 'Internal Server Error',
              message: 'An unexpected error occurred',
              timestamp: '2023-12-01T10:00:00.000Z',
              requestId: 'req_123456789',
              statusCode: 500
            }
          }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        description: 'Returns the current health status of the server including uptime, memory usage, and system information.',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Server health information',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
                example: {
                  status: 'healthy',
                  timestamp: '2023-12-01T10:00:00.000Z',
                  sessionId: 'sess_abc123',
                  uptime: 3600,
                  memory: {
                    used: 134217728,
                    total: 1073741824,
                    percentage: 12.5
                  },
                  version: '1.0.0'
                }
              }
            }
          },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    },
    '/info': {
      get: {
        tags: ['Server Info'],
        summary: 'Get server information',
        description: 'Returns detailed information about the server including capabilities, endpoints, and configuration.',
        operationId: 'getServerInfo',
        responses: {
          '200': {
            description: 'Server information',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ServerInfo' },
                example: {
                  name: 'netadx-aicore',
                  version: '1.0.0',
                  protocol: '2024-11-05',
                  transport: 'http',
                  sessionId: 'sess_abc123',
                  capabilities: {
                    tools: {}
                  },
                  endpoints: {
                    health: '/health',
                    info: '/info',
                    rpc: '/rpc',
                    tools: '/tools',
                    docs: '/docs'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/rpc': {
      post: {
        tags: ['JSON-RPC'],
        summary: 'JSON-RPC endpoint',
        description: 'Handles JSON-RPC 2.0 requests for MCP protocol communication.',
        operationId: 'handleJsonRpc',
        security: [
          { ApiKeyAuth: [] },
          { BearerAuth: [] }
        ],
        requestBody: {
          description: 'JSON-RPC 2.0 request',
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/JsonRpcRequest' },
              examples: {
                'list-tools': {
                  summary: 'List available tools',
                  value: {
                    jsonrpc: '2.0',
                    method: 'tools/list',
                    params: {},
                    id: 1
                  }
                },
                'call-tool': {
                  summary: 'Execute a tool',
                  value: {
                    jsonrpc: '2.0',
                    method: 'tools/call',
                    params: {
                      name: 'example-tool',
                      arguments: {
                        action: 'create',
                        data: { key: 'value' }
                      }
                    },
                    id: 2
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'JSON-RPC response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/JsonRpcResponse' },
                examples: {
                  'success': {
                    summary: 'Successful response',
                    value: {
                      jsonrpc: '2.0',
                      result: { accepted: true },
                      id: 1
                    }
                  },
                  'error': {
                    summary: 'Error response',
                    value: {
                      jsonrpc: '2.0',
                      error: {
                        code: -32601,
                        message: 'Method not found'
                      },
                      id: 1
                    }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    },
    '/tools': {
      get: {
        tags: ['MCP Tools'],
        summary: 'List available tools',
        description: 'Returns a list of all available MCP tools with their descriptions and input schemas.',
        operationId: 'listTools',
        security: [
          { ApiKeyAuth: [] },
          { BearerAuth: [] }
        ],
        responses: {
          '200': {
            description: 'List of available tools',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ToolsListResponse' },
                example: {
                  tools: [
                    {
                      name: 'example-tool',
                      description: 'Example tool for demonstration purposes',
                      inputSchema: {
                        type: 'object',
                        properties: {
                          action: { type: 'string', enum: ['create', 'read', 'update', 'delete'] },
                          data: { type: 'object' }
                        },
                        required: ['action']
                      },
                      category: 'utility',
                      version: '1.0.0'
                    }
                  ],
                  count: 1,
                  timestamp: '2023-12-01T10:00:00.000Z'
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    },
    '/tools/{name}': {
      post: {
        tags: ['MCP Tools'],
        summary: 'Execute a specific tool',
        description: 'Executes the specified tool with the provided arguments and returns the result.',
        operationId: 'executeTool',
        security: [
          { ApiKeyAuth: [] },
          { BearerAuth: [] }
        ],
        parameters: [
          {
            name: 'name',
            in: 'path',
            required: true,
            description: 'The name of the tool to execute',
            schema: {
              type: 'string',
              example: 'example-tool'
            }
          }
        ],
        requestBody: {
          description: 'Tool execution parameters',
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ToolExecutionRequest' },
              examples: {
                'create-data': {
                  summary: 'Create new data',
                  value: {
                    arguments: {
                      action: 'create',
                      data: {
                        name: 'Test Item',
                        description: 'A test item created via API'
                      }
                    }
                  }
                },
                'read-data': {
                  summary: 'Read existing data',
                  value: {
                    arguments: {
                      action: 'read',
                      id: '507f1f77bcf86cd799439011'
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Tool execution result',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ToolExecutionResponse' },
                example: {
                  statusCode: 200,
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Execution-Time': '125ms'
                  },
                  body: {
                    content: [
                      {
                        type: 'text',
                        text: 'Successfully created item with ID: 507f1f77bcf86cd799439011'
                      }
                    ],
                    isError: false
                  },
                  metadata: {
                    requestId: 'req_123456789',
                    executionTime: 125
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid tool arguments',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  error: 'Bad Request',
                  message: 'Invalid tool arguments: missing required field "action"',
                  timestamp: '2023-12-01T10:00:00.000Z',
                  requestId: 'req_123456789',
                  statusCode: 400
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '403': { $ref: '#/components/responses/ForbiddenError' },
          '404': { $ref: '#/components/responses/NotFoundError' },
          '429': { $ref: '#/components/responses/RateLimitError' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    }
  }
};

/**
 * Swagger JSDoc options
 */
export const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    './src/transport/*.ts',
    './src/tools/*.ts',
    './src/swagger/*.ts'
  ]
};

/**
 * Example tool schemas for documentation
 */
export const exampleToolSchemas = {
  'example-tool': {
    name: 'example-tool',
    description: 'Example tool for demonstration purposes supporting CRUD operations',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'read', 'update', 'delete'],
          description: 'The action to perform'
        },
        data: {
          type: 'object',
          description: 'Data object for create/update operations'
        },
        id: {
          type: 'string',
          description: 'Document ID for read/update/delete operations'
        },
        query: {
          type: 'object',
          description: 'Query parameters for search operations'
        }
      },
      required: ['action'],
      additionalProperties: false
    },
    examples: [
      {
        name: 'Create Document',
        description: 'Create a new document in the database',
        input: {
          action: 'create',
          data: {
            name: 'Sample Document',
            content: 'This is sample content',
            tags: ['example', 'demo']
          }
        },
        output: {
          content: [
            {
              type: 'text',
              text: 'Successfully created document with ID: 507f1f77bcf86cd799439011'
            }
          ],
          isError: false
        }
      },
      {
        name: 'Read Document',
        description: 'Retrieve a document by ID',
        input: {
          action: 'read',
          id: '507f1f77bcf86cd799439011'
        },
        output: {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                _id: '507f1f77bcf86cd799439011',
                name: 'Sample Document',
                content: 'This is sample content',
                tags: ['example', 'demo'],
                createdAt: '2023-12-01T10:00:00.000Z',
                updatedAt: '2023-12-01T10:00:00.000Z'
              }, null, 2)
            }
          ],
          isError: false
        }
      }
    ]
  }
};

export default swaggerDefinition;