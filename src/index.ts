/**
 * NetADX AI-CORE - Simple MCP API Boilerplate
 * 
 * A minimal, production-ready boilerplate for building MCP API servers
 * with TypeScript, MongoDB, and JWT authentication.
 * 
 * @author NetADX AI-CORE Team
 * @version 1.0.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createHttpTransport } from './transport/http';
import { MongoDBManager } from './utils/mongodb';
import { createDefaultLogger, Logger } from './utils/logger';
import { createDefaultConfig } from './utils/config';
import { JwtAuthManager } from './utils/auth';
import { createExampleTool } from './tools/example-tool';

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT || '8005', 10);

/**
 * Main Application Class
 */
class NetAdxAiCoreServer {
  private server: Server;
  private logger: Logger;
  private mongodb: MongoDBManager;
  private authManager: JwtAuthManager;
  private isRunning: boolean = false;

  constructor() {
    // Initialize logger
    this.logger = createDefaultLogger();
    this.logger.info('NetADX AI-CORE Server initializing...');

    // Load configuration
    const config = createDefaultConfig();

    // Initialize MongoDB
    this.mongodb = new MongoDBManager(config.mongodb, this.logger);

    // Initialize JWT Auth Manager
    this.authManager = new JwtAuthManager(config.jwt, this.logger);

    // Create MCP Server
    this.server = new Server(
      {
        name: 'netadx-aicore',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Register tools
    this.registerTools();

    // Setup graceful shutdown
    this.setupGracefulShutdown();
  }

  /**
   * Register MCP Tools
   */
  private registerTools() {
    this.logger.info('Registering MCP tools...');

    // Example tool - demonstrates basic CRUD operations
    const exampleTool = createExampleTool(this.mongodb, this.logger);
    
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: exampleTool.name,
            description: exampleTool.description,
            inputSchema: exampleTool.inputSchema,
          },
        ],
      };
    });

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      if (name === exampleTool.name) {
        return await exampleTool.execute(args);
      }

      throw new Error(`Unknown tool: ${name}`);
    });

    this.logger.info('Tools registered successfully', { 
      tools: [exampleTool.name] 
    });
  }

  /**
   * Start the server
   */
  async start() {
    try {
      // Connect to MongoDB
      await this.mongodb.connect();
      this.logger.info('MongoDB connected');

      // Determine transport mode
      const useHttp = process.env.USE_HTTP === 'true' || PORT !== 0;

      if (useHttp) {
        // HTTP Transport (for external agents, Claude Desktop via wrapper)
        this.logger.info('Starting HTTP transport...', { port: PORT });
        
        const httpTransport = createHttpTransport({
          server: this.server,
          port: PORT,
          logger: this.logger,
          authManager: this.authManager,
        });

        await httpTransport.start();
        this.logger.info(`HTTP Server running on port ${PORT}`);
        this.logger.info(`Health check: http://localhost:${PORT}/health`);
        this.logger.info(`API endpoint: http://localhost:${PORT}/tools`);
      } else {
        // Stdio Transport (for direct Claude Desktop integration)
        this.logger.info('Starting stdio transport...');
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        this.logger.info('Stdio transport connected');
      }

      this.isRunning = true;
      this.logger.info('NetADX AI-CORE Server started successfully');
    } catch (error) {
      this.logger.error('Failed to start server', { error });
      process.exit(1);
    }
  }

  /**
   * Stop the server
   */
  async stop() {
    if (!this.isRunning) return;

    this.logger.info('Shutting down NetADX AI-CORE Server...');
    
    try {
      await this.mongodb.disconnect();
      this.logger.info('MongoDB disconnected');
      
      this.isRunning = false;
      this.logger.info('Server stopped successfully');
    } catch (error) {
      this.logger.error('Error during shutdown', { error });
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown() {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    signals.forEach((signal) => {
      process.on(signal, async () => {
        this.logger.info(`Received ${signal}, shutting down gracefully...`);
        await this.stop();
        process.exit(0);
      });
    });

    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception', { error });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      this.logger.error('Unhandled rejection', { reason });
      process.exit(1);
    });
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new NetAdxAiCoreServer();
  server.start().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for testing and library use
export { NetAdxAiCoreServer };
export { MongoDBManager } from './utils/mongodb';
export { createDefaultLogger } from './utils/logger';
export { JwtAuthManager } from './utils/auth';
export { createExampleTool } from './tools/example-tool';
