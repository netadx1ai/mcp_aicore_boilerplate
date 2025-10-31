/**
 * @fileoverview HTTP Transport for MCP TypeScript
 *
 * This module provides HTTP transport implementation for the MCP protocol,
 * enabling REST API communication alongside existing stdio transport.
 *
 * Key Features:
 * - JSON-RPC over HTTP POST endpoints
 * - RESTful tool execution endpoints
 * - Authentication middleware (API keys, JWT)
 * - Rate limiting and CORS support
 * - OpenAPI/Swagger documentation
 * - Health check and status endpoints
 *
 * @author MCP Boilerplate Team
 * @version 0.3.0
 */

import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import compression from 'compression';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { createServer, Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';

import { Transport, TransportSendOptions } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  JSONRPCMessage,
  JSONRPCRequest,
  JSONRPCResponse,
  MessageExtraInfo,
} from '@modelcontextprotocol/sdk/types.js';

import {
  HttpTransportConfig,
  HttpRequestContext,
  HttpResponse,
  HttpAuthConfig,
  CorsConfig,
  RateLimitConfig,
  HttpSecurityConfig,
  SwaggerConfig,
  McpTool,
  ToolResult,
} from '../types/index.js';
import { createDefaultLogger } from '../utils/logger.js';

// Extend Express Request interface for custom properties
declare global {
  namespace Express {
    interface Request {
      user?: any;
      jwtPayload?: any;
      authenticated_user_id?: string;
    }
  }
}
import { Logger } from 'winston';

/**
 * Default HTTP transport configuration
 */
const DEFAULT_HTTP_CONFIG: HttpTransportConfig = {
  port: 8000,
  host: '0.0.0.0',
  basePath: '/mcp',
  cors: {
    enabled: true,
    origins: ['*'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'x-access-token'],
    credentials: false,
  },
  auth: {
    enabled: false,
    type: 'apikey' as const,
    headerName: 'X-API-Key',
  },
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5000, // Increased for high CCU
    message: 'Too many requests from this IP',
  },
  security: {
    helmet: true,
    trustProxy: true, // Enable for load balancers
    requestSizeLimit: '50mb', // Increased for batch operations
    timeout: 300000, // 5 minutes for image generation
  },
  swagger: {
    enabled: true,
    path: '/docs',
    title: 'MCP Server API',
    description: 'Model Context Protocol REST API',
    version: '1.0.0',
  },
};

/**
 * Extended Express Request with MCP context
 */
interface McpRequest extends Request {
  context?: HttpRequestContext;
  user?: any;
}

/**
 * HTTP Transport implementation for MCP protocol
 *
 * Provides REST API endpoints for JSON-RPC communication and tool execution
 */
export class HttpTransport implements Transport {
  private readonly _config: HttpTransportConfig;
  private readonly _logger: Logger;
  private readonly _app: Express;
  private readonly _tools: Map<string, McpTool>;
  private _server?: HttpServer;
  private _sessionId: string;
  private _isStarted = false;

  // Transport interface callbacks
  public onclose?: () => void;
  public onerror?: (error: Error) => void;
  public onmessage?: (message: JSONRPCMessage, extra?: MessageExtraInfo) => void;

  constructor(config: Partial<HttpTransportConfig> = {}, tools: Map<string, McpTool> = new Map()) {
    this._config = { ...DEFAULT_HTTP_CONFIG, ...config };
    this._logger = createDefaultLogger(
      { level: 'info', format: 'pretty', output: 'console' },
      'http-transport'
    );
    this._app = express();
    this._tools = tools;
    this._sessionId = uuidv4();

    this._setupMiddleware();
    this._setupRoutes();
    this._setupSwagger();
    this._setupErrorHandling();
  }

  /**
   * Get the session ID for this transport
   */
  get sessionId(): string {
    return this._sessionId;
  }

  /**
   * Start the HTTP server and begin processing requests
   */
  async start(): Promise<void> {
    if (this._isStarted) {
      throw new Error('HTTP transport already started');
    }

    return new Promise((resolve, reject) => {
      try {
        this._server = createServer(this._app);

        // Optimize server for high CCU
        this._server.keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT || '65000', 10);
        this._server.headersTimeout = parseInt(process.env.HEADERS_TIMEOUT || '66000', 10);
        this._server.requestTimeout = parseInt(process.env.REQUEST_TIMEOUT || '300000', 10);
        this._server.timeout = parseInt(process.env.SERVER_TIMEOUT || '300000', 10);
        this._server.maxConnections = parseInt(process.env.MAX_CONNECTIONS || '1000', 10);

        // Optimize TCP settings
        this._server.on('connection', (socket) => {
          socket.setKeepAlive(true, 30000);
          socket.setNoDelay(true);
          socket.setTimeout(this._server?.timeout || 30000);
        });

        this._server.listen(this._config.port, this._config.host, () => {
          this._isStarted = true;
          this._logger.info('HTTP transport started with high CCU optimizations', {
            host: this._config.host,
            port: this._config.port,
            basePath: this._config.basePath,
            sessionId: this._sessionId,
            keepAliveTimeout: this._server?.keepAliveTimeout,
            headersTimeout: this._server?.headersTimeout,
            maxConnections: this._server?.maxConnections,
          });
          resolve();
        });

        this._server.on('error', error => {
          this._logger.error('HTTP server error', { error: error.message });
          this.onerror?.(error);
          reject(error);
        });

        this._server.on('clientError', (err, socket) => {
          if ((err as any).code === 'ECONNRESET' || !socket.writable) {
            return;
          }
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send a JSON-RPC message (not applicable for HTTP transport)
   */
  async send(message: JSONRPCMessage, options?: TransportSendOptions): Promise<void> {
    // HTTP transport handles responses through Express response objects
    // This method is typically used for client-initiated messages
    this._logger.debug('Send message called', { message, options });
  }

  /**
   * Close the HTTP server
   */
  async close(): Promise<void> {
    if (!this._isStarted || !this._server) {
      return;
    }

    return new Promise(resolve => {
      this._server!.close(() => {
        this._isStarted = false;
        this._logger.info('HTTP transport closed');
        this.onclose?.();
        resolve();
      });
    });
  }

  /**
   * Setup Express middleware stack
   */
  private _setupMiddleware(): void {
    // Security middleware
    if (this._config.security.helmet) {
      this._app.use(helmet({
        contentSecurityPolicy: false, // Disable CSP for API performance
        crossOriginEmbedderPolicy: false,
      }));
    }

    // Trust proxy if configured (for load balancers)
    if (this._config.security.trustProxy) {
      this._app.set('trust proxy', true);
    }

    // CORS middleware (before rate limiting for better performance)
    if (this._config.cors.enabled) {
      this._app.use(
        cors({
          origin: this._config.cors.origins,
          methods: this._config.cors.methods,
          allowedHeaders: this._config.cors.allowedHeaders,
          credentials: this._config.cors.credentials,
          preflightContinue: false,
          optionsSuccessStatus: 204,
        })
      );
    }

    // Compression middleware for better bandwidth utilization
    this._app.use(compression({
      filter: (req: any, res: any) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024,
      level: 6,
    }));

    // Rate limiting with memory store optimization
    if (this._config.rateLimit?.enabled) {
      const limiter = rateLimit({
        windowMs: this._config.rateLimit.windowMs,
        max: this._config.rateLimit.maxRequests,
        message: { error: this._config.rateLimit.message },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true, // Don't count successful requests
        skipFailedRequests: false,
        skip: req => {
          // Skip rate limiting for health checks and preflight requests
          return req.method === 'OPTIONS' || 
                 (req.method === 'GET' && req.path.endsWith('/health'));
        },
        keyGenerator: (req) => {
          // Use X-Forwarded-For if behind proxy, otherwise use remoteAddress
          const forwarded = req.headers['x-forwarded-for'] as string;
          const realIp = req.headers['x-real-ip'] as string;
          const clientIp = forwarded || realIp || req.ip || req.connection?.remoteAddress || 'unknown';
          
          // Handle IPv6 properly by normalizing the address
          if (clientIp.includes('::ffff:')) {
            return clientIp.replace('::ffff:', '');
          }
          return clientIp;
        },
      });
      this._app.use(limiter);
    }

    // Body parsing middleware with optimized settings
    this._logger.info('Setting up body parser with request size limit', {
      requestSizeLimit: this._config.security.requestSizeLimit,
      securityConfig: this._config.security
    });
    
    this._app.use(
      express.json({
        limit: this._config.security.requestSizeLimit,
        strict: false, // Allow non-objects at the top level
        type: ['application/json', 'text/plain'],
      })
    );
    this._app.use(
      express.urlencoded({
        extended: true,
        limit: this._config.security.requestSizeLimit,
        parameterLimit: 1000,
      })
    );

    // Request timeout middleware
    this._app.use((req: any, res: any, next: any) => {
      res.setTimeout(this._config.security.timeout, () => {
        if (!res.headersSent) {
          res.status(408).json({ error: 'Request timeout' });
        }
      });
      next();
    });

    // Request context middleware
    this._app.use(this._createRequestContext.bind(this));

    // Authentication middleware
    if (this._config.auth?.enabled) {
      this._app.use(this._authMiddleware.bind(this));
    }
  }

  /**
   * Setup API routes
   */
  private _setupRoutes(): void {
    const router = express.Router();

    // Health check endpoint
    router.get('/health', this._handleHealth.bind(this));

    // Server info endpoint
    router.get('/info', this._handleInfo.bind(this));

    // JSON-RPC endpoint
    router.post('/rpc', this._handleJsonRpc.bind(this));

    // Tools endpoints
    router.get('/tools', this._handleListTools.bind(this));
    router.post('/tools/:name', this._handleExecuteTool.bind(this));
    router.get('/tools/:name', this._handleExecuteTool.bind(this)); // Support GET method for public endpoints

    // Mount router with base path
    this._app.use(this._config.basePath, router);
  }

  /**
   * Setup Swagger documentation
   */
  private _setupSwagger(): void {
    if (!this._config.swagger?.enabled) {
      return;
    }

    const swaggerOptions = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: this._config.swagger.title,
          description: this._config.swagger.description,
          version: this._config.swagger.version,
          contact: this._config.swagger.contact,
        },
        servers: [
          {
            url: `http://${this._config.host}:${this._config.port}${this._config.basePath}`,
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: this._config.auth?.enabled
            ? {
                ApiKeyAuth: {
                  type: 'apiKey',
                  in: 'header',
                  name: this._config.auth.headerName || 'X-API-Key',
                },
              }
            : undefined,
        },
      },
      apis: [__filename], // This file contains JSDoc comments for API docs
    };

    const specs = swaggerJsdoc(swaggerOptions);
    this._app.use(
      this._config.swagger.path,
      swaggerUi.serve,
      swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
      })
    );
  }

  /**
   * Setup error handling middleware
   */
  private _setupErrorHandling(): void {
    // 404 handler
    this._app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
      });
    });

    // Global error handler
    this._app.use((error: any, req: McpRequest, res: Response, next: NextFunction) => {
      this._logger.error('HTTP request error', {
        error: error.message,
        stack: error.stack,
        requestId: req.context?.requestId,
        method: req.method,
        url: req.originalUrl,
      });

      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal Server Error';

      res.status(statusCode).json({
        error: 'Internal Server Error',
        message,
        requestId: req.context?.requestId,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Create request context middleware
   */
  private _createRequestContext(req: McpRequest, res: Response, next: NextFunction): void {
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    req.context = {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers as Record<string, string>,
      query: req.query as Record<string, string>,
      body: req.body,
      requestId,
      timestamp,
    };

    // Add correlation ID header to response
    res.setHeader('X-Request-ID', requestId);

    next();
  }

  /**
   * Authentication middleware
   */
  private _authMiddleware(req: McpRequest, res: Response, next: NextFunction): void {
    const auth = this._config.auth!;

    // Skip auth for public endpoints: health, docs, batch-status monitoring, and debug routes
    const path = req.path;
    
    if (path.endsWith('/health') || 
        path.startsWith('/docs') ||
        path.startsWith('/api/v1/batch-status') ||
        path.startsWith('/api/v1/debug') ||
        path.match(/\/batch-status\/[a-zA-Z0-9]+/) ||
        path.match(/\/debug\/[a-zA-Z]+/)) {
      return next();
    }

    // Skip auth for prompt_attributes tool with public actions: get_default, get_models_only
    if (path.includes('/tools/prompt_attributes')) {
      const action = req.query.action || req.body?.action;
      if (action === 'get_default' || action === 'get_models_only') {
        this._logger.debug('Allowing public access to prompt_attributes', { 
          action, 
          method: req.method,
          path 
        });
        return next();
      }
    }

    // Authentication priority: x-access-token > Authorization: Bearer
    let token = req.headers['x-access-token'] as string;
    
    if (!token) {
      const authHeader = req.headers.authorization as string;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (authHeader) {
        token = authHeader;
      }
    }

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing x-access-token or Authorization header',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      switch (auth.type) {
        case 'apikey':
          if (!auth.apiKeys?.includes(token)) {
            throw new Error('Invalid API key');
          }
          break;

        case 'jwt':
          if (!auth.jwtSecret) {
            throw new Error('JWT secret not configured');
          }
          const decoded = jwt.verify(token, auth.jwtSecret);
          
          // Validate required userObjId claim
          if (typeof decoded === 'object' && decoded !== null && !('userObjId' in decoded)) {
            throw new Error('Missing required userObjId claim');
          }
          
          req.user = decoded;
          req.jwtPayload = decoded;
          req.authenticated_user_id = typeof decoded === 'object' && decoded !== null ? (decoded as any).userObjId : undefined;
          break;

        case 'bearer':
        case 'basic':
          // Implement additional auth types as needed
          break;

        default:
          throw new Error('Unsupported authentication type');
      }

      next();
    } catch (error) {
      this._logger.warn('Authentication failed', {
        error: error instanceof Error ? error.message : String(error),
        requestId: req.context?.requestId,
      });

      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle health check requests
   *
   * @swagger
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     responses:
   *       200:
   *         description: Server is healthy
   */
  private _handleHealth(req: McpRequest, res: Response): void {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      sessionId: this._sessionId,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
    };

    res.json(health);
  }

  /**
   * Handle server info requests
   *
   * @swagger
   * /info:
   *   get:
   *     summary: Get server information
   *     responses:
   *       200:
   *         description: Server information
   */
  private _handleInfo(req: McpRequest, res: Response): void {
    const info = {
      name: 'MCP HTTP Transport',
      version: '0.3.0',
      protocol: 'mcp',
      transport: 'http',
      sessionId: this._sessionId,
      capabilities: ['tools', 'rpc'],
      endpoints: {
        health: `${this._config.basePath}/health`,
        info: `${this._config.basePath}/info`,
        rpc: `${this._config.basePath}/rpc`,
        tools: `${this._config.basePath}/tools`,
        docs: this._config.swagger?.enabled ? this._config.swagger.path : undefined,
      },
    };

    res.json(info);
  }

  /**
   * Handle JSON-RPC requests
   *
   * @swagger
   * /rpc:
   *   post:
   *     summary: JSON-RPC endpoint
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: JSON-RPC response
   */
  private async _handleJsonRpc(req: McpRequest, res: Response): Promise<void> {
    try {
      const message = req.body as any;

      if (!message || !message.jsonrpc || !message.method) {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid Request',
          },
          id: null,
        });
        return;
      }

      // Forward to MCP message handler
      this.onmessage?.(message as JSONRPCMessage, {
        requestInfo: {
          headers: req.headers as Record<string, string>,
        },
      });

      // For HTTP transport, we handle the response through Express
      // The actual response is sent by the MCP server through a different mechanism
      res.status(202).json({
        jsonrpc: '2.0',
        result: { accepted: true },
        id: message.id,
      });
    } catch (error) {
      this._logger.error('JSON-RPC handling error', {
        error: error instanceof Error ? error.message : String(error),
        requestId: req.context?.requestId,
      });

      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
        },
        id: req.body?.id || null,
      });
    }
  }

  /**
   * Handle list tools requests
   *
   * @swagger
   * /tools:
   *   get:
   *     summary: List available tools
   *     responses:
   *       200:
   *         description: List of available tools
   */
  private _handleListTools(req: McpRequest, res: Response): void {
    const tools = Array.from(this._tools.entries()).map(([name, tool]) => ({
      name,
      description: tool.description,
      category: tool.category,
      version: tool.version,
      parameters: {},
      examples: tool.examples,
    }));

    res.json({
      tools,
      count: tools.length,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle tool execution requests
   *
   * @swagger
   * /tools/{name}:
   *   post:
   *     summary: Execute a specific tool
   *     parameters:
   *       - name: name
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Tool execution result
   *   get:
   *     summary: Execute a specific tool (GET method for public endpoints)
   *     parameters:
   *       - name: name
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: action
   *         in: query
   *         schema:
   *           type: string
   *       - name: code
   *         in: query
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Tool execution result
   */
  private async _handleExecuteTool(req: McpRequest, res: Response): Promise<void> {
    try {
      const toolName = req.params.name;
      const tool = this._tools.get(toolName);

      if (!tool) {
        res.status(404).json({
          error: 'Tool Not Found',
          message: `Tool '${toolName}' is not available`,
          availableTools: Array.from(this._tools.keys()),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // For GET requests, use query parameters; for POST, use body
      const input = req.method === 'GET' ? req.query : req.body;

      const startTime = Date.now();
      const result = await tool.execute(input);
      const executionTime = Date.now() - startTime;

      const response: HttpResponse<ToolResult> = {
        statusCode: result.success ? 200 : 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Execution-Time': `${executionTime}ms`,
        },
        body: result,
        metadata: {
          requestId: req.context!.requestId,
          executionTime,
        },
      };

      if (!res.headersSent) {
        res.status(response.statusCode).set(response.headers).json(response.body);
      }
    } catch (error) {
      this._logger.error('Tool execution error', {
        error: error instanceof Error ? error.message : String(error),
        tool: req.params.name,
        requestId: req.context?.requestId,
      });

      if (!res.headersSent) {
        res.status(500).json({
          error: 'Tool Execution Failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
}

/**
 * Create HTTP transport with default configuration
 */
export function createHttpTransport(
  config: Partial<HttpTransportConfig> = {},
  tools: Map<string, McpTool> = new Map()
): HttpTransport {
  return new HttpTransport(config, tools);
}

/**
 * HTTP transport factory for easy integration
 */
export class HttpTransportFactory {
  static create(config: Partial<HttpTransportConfig> = {}): HttpTransport {
    return new HttpTransport(config);
  }

  static createWithAuth(
    config: Partial<HttpTransportConfig> = {},
    authConfig: HttpAuthConfig
  ): HttpTransport {
    return new HttpTransport({
      ...config,
      auth: {
        enabled: true,
        type: authConfig.type || 'apikey',
        apiKeys: authConfig.apiKeys,
        jwtSecret: authConfig.jwtSecret,
        jwtExpiration: authConfig.jwtExpiration,
        headerName: authConfig.headerName,
      },
    });
  }

  static createSecure(config: Partial<HttpTransportConfig> = {}): HttpTransport {
    return new HttpTransport({
      ...config,
      security: {
        helmet: true,
        trustProxy: true,
        requestSizeLimit: '1mb',
        timeout: 10000,
      },
      auth: {
        enabled: true,
        type: 'apikey',
        headerName: 'X-API-Key',
      },
      rateLimit: {
        enabled: true,
        windowMs: 900000,
        maxRequests: 100,
        message: 'Too many requests',
      },
    });
  }
}
