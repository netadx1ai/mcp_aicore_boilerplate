/**
 * NetADX AI-CORE - Core Utilities
 * 
 * Simplified utility exports for the boilerplate
 * 
 * @author NetADX AI-CORE Team
 * @version 1.0.0
 */

// Configuration utilities
export {
  createDefaultConfig,
  validateConfig,
} from './config';

// Logging utilities
export {
  createDefaultLogger,
  type Logger,
} from './logger';

// JWT Authentication utilities
export {
  JwtAuthManager,
  createJwtAuthManager,
  NetAdxAuth,
  type JwtConfig,
  type JwtPayload,
} from './auth';

// MongoDB utilities
export {
  MongoDBManager,
  type MongoConfig,
} from './mongodb';

// =============================================================================
// Common Utility Functions
// =============================================================================

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate unique ID with optional prefix
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const id = `${timestamp}${random}`;
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Exponential backoff
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Sanitize object for logging (remove sensitive fields)
 */
export function sanitizeForLogging(
  obj: Record<string, unknown>,
  sensitiveKeys: string[] = ['password', 'secret', 'token', 'key', 'auth']
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeForLogging(value as Record<string, unknown>, sensitiveKeys);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Validate environment variable presence
 */
export function requireEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;

  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }

  return value;
}
