/**
 * @fileoverview JWT Authentication Utilities for MCP Batch Studio
 *
 * This module provides core JWT authentication functionality for the MCP server,
 * including token generation, validation, and user context management.
 *
 * @author NetADX MCP Team
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken';
import { UserContext } from '../types/index.js';

/**
 * JWT configuration interface
 */
export interface JwtConfig {
  readonly secret: string;
  readonly expiresIn: string;
  readonly issuer?: string;
  readonly audience?: string;
  readonly algorithm?: jwt.Algorithm;
}

/**
 * JWT payload interface
 */
export interface JwtPayload extends jwt.JwtPayload {
  readonly userObjId: string;
  readonly id: string;
  readonly username: string;
  readonly roles: string[];
  readonly permissions: string[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Default JWT configuration
 */
const DEFAULT_JWT_CONFIG: Partial<JwtConfig> = {
  secret: 'netadxAPI',
  expiresIn: '24h',
  issuer: 'mcp-batch-studio',
  audience: 'mcp-clients',
  algorithm: 'HS256'
};

/**
 * JWT Authentication Manager
 */
export class JwtAuthManager {
  private readonly config: JwtConfig;

  constructor(config: Partial<JwtConfig> & { secret: string }) {
    this.config = {
      ...DEFAULT_JWT_CONFIG,
      ...config
    } as JwtConfig;
  }

  /**
   * Generate JWT token for user
   */
  generateToken(user: UserContext): string {
    const payload: Omit<JwtPayload, keyof jwt.JwtPayload> = {
      userObjId: user.id,
      id: user.id,
      username: user.name || user.id,
      roles: user.roles,
      permissions: user.permissions,
      metadata: user.metadata
    };

    return jwt.sign(payload, this.config.secret, {
      expiresIn: this.config.expiresIn,
      issuer: this.config.issuer,
      audience: this.config.audience,
      algorithm: this.config.algorithm
    } as jwt.SignOptions);
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): JwtPayload {
    try {
      // Create verification options, only include issuer/audience if they are configured
      const verifyOptions: jwt.VerifyOptions = {
        algorithms: [this.config.algorithm || 'HS256']
      };
      
      if (this.config.issuer) {
        verifyOptions.issuer = this.config.issuer;
      }
      
      if (this.config.audience) {
        verifyOptions.audience = this.config.audience;
      }

      const decoded = jwt.verify(token, this.config.secret, verifyOptions);

      if (typeof decoded === 'string') {
        throw new Error('Invalid token format');
      }

      const payload = decoded as JwtPayload;
      
      // Validate required userObjId claim
      if (!payload.userObjId) {
        throw new Error('Missing required userObjId claim');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new Error('Token not active yet');
      }
      throw new Error(`Token verification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract user context from JWT payload
   */
  extractUserContext(payload: JwtPayload): UserContext {
    return {
      id: payload.id,
      name: payload.username,
      roles: payload.roles,
      permissions: payload.permissions,
      metadata: payload.metadata
    };
  }

  /**
   * Check if user has specific role
   */
  hasRole(user: UserContext, role: string): boolean {
    return user.roles.includes(role);
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(user: UserContext, permission: string): boolean {
    return user.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(user: UserContext, roles: string[]): boolean {
    return roles.some(role => user.roles.includes(role));
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(user: UserContext, permissions: string[]): boolean {
    return permissions.every(permission => user.permissions.includes(permission));
  }

  /**
   * Refresh token (generate new token with updated expiration)
   */
  refreshToken(token: string): string {
    const payload = this.verifyToken(token);
    const userContext = this.extractUserContext(payload);
    return this.generateToken(userContext);
  }

  /**
   * Get token expiration date
   */
  getTokenExpiration(token: string): Date {
    const payload = this.verifyToken(token);
    if (!payload.exp) {
      throw new Error('Token has no expiration');
    }
    return new Date(payload.exp * 1000);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const expiration = this.getTokenExpiration(token);
      return expiration.getTime() < Date.now();
    } catch {
      return true;
    }
  }
}

/**
 * Create JWT authentication manager with environment configuration
 */
export function createJwtAuthManager(options: Partial<JwtConfig> = {}): JwtAuthManager {
  const secret = process.env.JWT_SECRET || options.secret || 'netadxAPI';
  
  return new JwtAuthManager({
    secret,
    expiresIn: process.env.JWT_EXPIRES_IN || options.expiresIn || '24h',
    issuer: process.env.JWT_ISSUER || options.issuer || 'mcp-batch-studio',
    audience: process.env.JWT_AUDIENCE || options.audience || 'mcp-clients',
    algorithm: (process.env.JWT_ALGORITHM as jwt.Algorithm) || options.algorithm || 'HS256'
  });
}

/**
 * Middleware helper for Express JWT authentication
 */
export function createJwtMiddleware(authManager: JwtAuthManager) {
  return (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing authorization header'
        });
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;

      const payload = authManager.verifyToken(token);
      const userContext = authManager.extractUserContext(payload);
      
      req.user = userContext;
      req.jwtPayload = payload;
      
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: error instanceof Error ? error.message : 'Authentication failed'
      });
    }
  };
}

/**
 * Role-based access control middleware
 */
export function requireRole(authManager: JwtAuthManager, role: string) {
  const jwtMiddleware = createJwtMiddleware(authManager);
  
  return (req: any, res: any, next: any) => {
    jwtMiddleware(req, res, (err?: any) => {
      if (err) return next(err);
      
      if (!authManager.hasRole(req.user, role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Role '${role}' required`
        });
      }
      
      next();
    });
  };
}

/**
 * Permission-based access control middleware
 */
export function requirePermission(authManager: JwtAuthManager, permission: string) {
  const jwtMiddleware = createJwtMiddleware(authManager);
  
  return (req: any, res: any, next: any) => {
    jwtMiddleware(req, res, (err?: any) => {
      if (err) return next(err);
      
      if (!authManager.hasPermission(req.user, permission)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Permission '${permission}' required`
        });
      }
      
      next();
    });
  };
}

/**
 * Utility functions for common authentication patterns
 */
export const AuthUtils = {
  /**
   * Create admin user context with userObjId
   */
  createAdminUser(userObjId: string, username: string): UserContext {
    return {
      id: userObjId,
      name: username,
      roles: ['admin'],
      permissions: ['read', 'write', 'execute', 'manage']
    };
  },

  /**
   * Create standard user context with userObjId
   */
  createUser(userObjId: string, username: string): UserContext {
    return {
      id: userObjId,
      name: username,
      roles: ['user'],
      permissions: ['read', 'execute']
    };
  },

  /**
   * Create read-only user context with userObjId
   */
  createViewer(userObjId: string, username: string): UserContext {
    return {
      id: userObjId,
      name: username,
      roles: ['viewer'],
      permissions: ['read']
    };
  },

  /**
   * Validate JWT payload has required userObjId claim
   */
  validateUserObjId(payload: JwtPayload): void {
    if (!payload.userObjId) {
      throw new Error('JWT token missing required userObjId claim');
    }
  },

  /**
   * Extract token from various header formats
   */
  extractToken(authHeader: string): string {
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    if (authHeader.startsWith('Token ')) {
      return authHeader.substring(6);
    }
    return authHeader;
  }
};

/**
 * NetADX AI-CORE specific JWT configuration and utilities
 * Standard authentication configuration
 */
export const NetAdxAuth = {
  /**
   * Create NetADX JWT authentication manager with predefined settings
   * Uses standard configuration: secret 'netadxAPI', algorithm 'HS256', required claim 'userObjId'
   * Flexible verification without strict issuer/audience requirements for compatibility
   */
  createAuthManager(): JwtAuthManager {
    return new JwtAuthManager({
      secret: 'netadxAPI',
      algorithm: 'HS256',
      expiresIn: '24h'
      // Removed issuer and audience for flexible token support
    });
  },

  /**
   * Create NetADX user context from userObjId
   */
  createUserContext(userObjId: string, username?: string, roles: string[] = ['user']): UserContext {
    const permissions = this.getPermissionsForRoles(roles);
    return {
      id: userObjId,
      name: username || userObjId,
      roles,
      permissions,
      metadata: { userObjId }
    };
  },

  /**
   * Generate NetADX JWT token with userObjId claim
   */
  generateToken(userObjId: string, username?: string, roles: string[] = ['user']): string {
    const authManager = this.createAuthManager();
    const userContext = this.createUserContext(userObjId, username, roles);
    return authManager.generateToken(userContext);
  },

  /**
   * Verify NetADX JWT token and extract userObjId
   */
  verifyToken(token: string): { userObjId: string; payload: JwtPayload } {
    const authManager = this.createAuthManager();
    const payload = authManager.verifyToken(token);

    if (!payload.userObjId) {
      throw new Error('Invalid token: missing userObjId claim');
    }

    return { userObjId: payload.userObjId, payload };
  },

  /**
   * Create Express middleware for NetADX JWT authentication
   * Supports both x-access-token and Authorization: Bearer headers with priority
   */
  createMiddleware() {
    return (req: any, res: any, next: any) => {
      try {
        // Authentication priority: x-access-token > Authorization: Bearer
        let token = req.headers['x-access-token'];
        
        if (!token) {
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
          }
        }
        
        if (!token) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing x-access-token or Authorization header'
          });
        }

        // Direct JWT verification with minimal requirements
        const decoded = jwt.verify(token, 'netadxAPI', {
          algorithms: ['HS256']
        });

        if (typeof decoded === 'string') {
          throw new Error('Invalid token format');
        }

        const payload = decoded as any;
        
        // Validate required userObjId claim
        if (!payload.userObjId) {
          throw new Error('Missing required userObjId claim');
        }

        // Create user context
        const userContext = {
          id: payload.userObjId,
          name: payload.username || payload.userObjId,
          roles: ['user'],
          permissions: ['upload', 'read'],
          metadata: { userObjId: payload.userObjId }
        };
        
        req.user = userContext;
        req.jwtPayload = payload;
        req.authenticated_user_id = payload.userObjId;
        
        next();
      } catch (error) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: error instanceof Error ? error.message : 'Authentication failed'
        });
      }
    };
  },

  /**
   * Get default permissions for roles
   */
  getPermissionsForRoles(roles: string[]): string[] {
    const rolePermissions: Record<string, string[]> = {
      admin: ['read', 'write', 'execute', 'manage', 'delete'],
      user: ['read', 'write', 'execute'],
      viewer: ['read'],
      api: ['read', 'execute']
    };

    const permissions = new Set<string>();
    for (const role of roles) {
      const perms = rolePermissions[role] || rolePermissions.user;
      perms.forEach(p => permissions.add(p));
    }

    return Array.from(permissions);
  },

  /**
   * Validate NetADX JWT configuration
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check secret
    const secret = process.env.JWT_SECRET || DEFAULT_JWT_CONFIG.secret;
    if (secret !== 'netadxAPI') {
      errors.push('NetADX requires secret to be "netadxAPI"');
    }

    // Check algorithm
    const algorithm = process.env.JWT_ALGORITHM || DEFAULT_JWT_CONFIG.algorithm;
    if (algorithm !== 'HS256') {
      errors.push('NetADX requires HS256 algorithm');
    }

    return { valid: errors.length === 0, errors };
  },

  /**
   * Create NetADX-compatible HTTP server configuration
   */
  createServerConfig(port: number = 8005): any {
    return {
      http: {
        port,
        host: '0.0.0.0',
        basePath: '/mcp',
        auth: {
          enabled: true,
          type: 'jwt',
          jwtSecret: 'netadxAPI',
          jwtExpiration: '24h',
          headerName: 'x-access-token'
        },
        cors: {
          enabled: true,
          origins: ['*'],
          methods: ['GET', 'POST', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'x-access-token', 'Authorization'],
          credentials: false
        }
      }
    };
  },

  /**
   * Extract userObjId from request (JWT or body)
   */
  extractUserObjId(req: any): string {
    // Priority: JWT token userObjId > request body userObjId
    if (req.jwtPayload?.userObjId) {
      return req.jwtPayload.userObjId;
    }
    if (req.body?.userObjId) {
      return req.body.userObjId;
    }
    throw new Error('userObjId not found in JWT token or request body');
  }
};