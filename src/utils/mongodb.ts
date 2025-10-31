/**
 * @fileoverview MongoDB Integration Utilities for MCP Batch Studio
 *
 * This module provides MongoDB database operations for batch studio collections,
 * including file metadata storage, user data management, and batch processing records.
 *
 * @author NetADX MCP Team
 * @version 1.0.0
 * @created 2025-10-25 14:45:00 GMT+7
 */

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

/**
 * MongoDB configuration interface
 */
export interface MongoConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly username: string;
  readonly password: string;
  readonly authSource?: string;
  readonly ssl?: boolean;
  readonly connectTimeoutMS?: number;
  readonly serverSelectionTimeoutMS?: number;
  readonly maxPoolSize?: number;
  readonly minPoolSize?: number;
  readonly maxIdleTimeMS?: number;
  readonly retryWrites?: boolean;
}

/**
 * Image metadata interface for batch studio
 */
export interface ImageData {
  readonly imageType: 'UserUploaded' | 'AIGenerated';
  readonly image_url: string;
  readonly thumb_url: string;
  readonly image_format: 'jpg' | 'png' | 'webp' | 'gif';
  readonly image_size: number;
  readonly width: number;
  readonly height: number;
  readonly mediaId: string;
}

/**
 * Video metadata interface for batch studio
 */
export interface VideoData {
  readonly mediaId: string;
  readonly status: 'Pending' | 'InProgress' | 'Completed' | 'Failed';
  readonly videoType: 'AIGenerated' | 'UserUploaded';
  readonly video_url: string;
  readonly thumb_video_url: string;
  readonly width: number;
  readonly height: number;
  readonly video_format: 'mp4' | 'mov' | 'avi';
  readonly video_size: number;
  readonly duration: number;
  readonly ratio: '16:9' | '4:3' | '1:1' | '9:16';
  readonly resolution: string;
}

/**
 * Batch studio document interface
 */
export interface BatchStudioDocument {
  readonly _id?: ObjectId;
  readonly imageIds: ImageData[];
  readonly videoIds: VideoData[];
  readonly prompt: string;
  readonly ratio: '16:9' | '4:3' | '1:1' | '9:16';
  readonly style: string;
  readonly quality: 'Low' | 'Medium' | 'High';
  readonly iterations: number;
  readonly model: string;
  readonly userObjId: string;
  readonly workflowId?: string;
  readonly status?: 'Pending' | 'InProgress' | 'Completed' | 'Failed';
  readonly presetId?: string;
  readonly diamondsUsed?: number;
  readonly created_date?: string;
  readonly updated_date?: string;
  readonly tool_used?: 'ImageCreator' | 'AIImageEditor' | 'ImageEditorManual';
}

/**
 * Create batch studio document interface for insertion
 */
export interface CreateBatchStudioDocument {
  readonly imageIds?: ImageData[];
  readonly videoIds?: VideoData[];
  readonly prompt: string;
  readonly ratio: '16:9' | '4:3' | '1:1' | '9:16';
  readonly style: string;
  readonly quality: 'Low' | 'Medium' | 'High';
  readonly iterations: number;
  readonly model: string;
  readonly userObjId: string;
  readonly workflowId?: string;
  readonly status?: 'Pending' | 'InProgress' | 'Completed' | 'Failed';
  readonly presetId?: string;
  readonly diamondsUsed?: number;
  readonly tool_used?: 'ImageCreator' | 'AIImageEditor' | 'ImageEditorManual';
}

/**
 * Update batch studio document interface
 */
export interface UpdateBatchStudioDocument {
  readonly imageIds?: ImageData[];
  readonly videoIds?: VideoData[];
  readonly prompt?: string;
  readonly ratio?: '16:9' | '4:3' | '1:1' | '9:16';
  readonly style?: string;
  readonly quality?: 'Low' | 'Medium' | 'High';
  readonly iterations?: number;
  readonly model?: string;
  readonly workflowId?: string;
  readonly status?: 'Pending' | 'InProgress' | 'Completed' | 'Failed';
  readonly presetId?: string;
  readonly diamondsUsed?: number;
  readonly tool_used?: 'ImageCreator' | 'AIImageEditor' | 'ImageEditorManual';
}

/**
 * Query options interface
 */
export interface QueryOptions {
  readonly limit?: number;
  readonly skip?: number;
  readonly sort?: Record<string, 1 | -1>;
  readonly projection?: Record<string, 1 | 0>;
}

/**
 * Default MongoDB configuration from environment variables
 */
const DEFAULT_MONGO_CONFIG: MongoConfig = {
  host: process.env.MONGODB_HOST || '34.87.112.104',
  port: parseInt(process.env.MONGODB_PORT || '27017'),
  database: process.env.MONGODB_DATABASE_NAME || 'netadx_aicore',
  username: process.env.MONGODB_USER || '',
  password: process.env.MONGODB_USER_PWD || 'sercretpassword',
  authSource: process.env.MONGODB_AUTH_SOURCE || 'admin',
  ssl: process.env.MONGODB_SSL === 'true',
  connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT || '30000'),
  serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '30000'),
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
  minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),
  maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME || '300000'),
  retryWrites: process.env.MONGODB_RETRY_WRITES !== 'false'
};

/**
 * MongoDB Manager for Batch Studio operations
 */
export class BatchStudioMongoManager {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private readonly config: MongoConfig;
  private readonly collectionName: string = 'batch_studio';

  constructor(config: Partial<MongoConfig> = {}) {
    this.config = {
      ...DEFAULT_MONGO_CONFIG,
      ...config
    };
  }

  /**
   * Get MongoDB connection URI
   */
  private getConnectionUri(): string {
    const { host, port, username, password, database, authSource, ssl } = this.config;

    let uri = `mongodb://${username}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

    const params: string[] = [];
    if (ssl) params.push('ssl=true');
    if (this.config.retryWrites) params.push('retryWrites=true');

    if (params.length > 0) {
      uri += `?${params.join('&')}`;
    }

    return uri;
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    try {
      if (this.client && this.db) {
        return; // Already connected
      }

      const uri = this.getConnectionUri();
      console.log(uri);
      this.client = new MongoClient(uri, {
        connectTimeoutMS: this.config.connectTimeoutMS,
        serverSelectionTimeoutMS: this.config.serverSelectionTimeoutMS,
        maxPoolSize: this.config.maxPoolSize,
        minPoolSize: this.config.minPoolSize,
        maxIdleTimeMS: this.config.maxIdleTimeMS,
        retryWrites: this.config.retryWrites
      });

      await this.client.connect();
      this.db = this.client.db(this.config.database);

      console.log(`Connected to MongoDB: ${this.config.host}:${this.config.port}/${this.config.database}`);
    } catch (error) {
      throw new Error(`MongoDB connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        console.log('Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }

  /**
   * Get database instance
   */
  getDatabase(): Db {
    if (!this.db) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Get batch studio collection
   */
  private getCollection(): Collection<BatchStudioDocument> {
    if (!this.db) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return this.db.collection<BatchStudioDocument>(this.collectionName);
  }

  /**
   * Create a new batch studio document
   */
  async createBatchStudio(data: CreateBatchStudioDocument): Promise<ObjectId> {
    try {
      await this.connect();
      const collection = this.getCollection();

      // Handle variations -> iterations mapping for Gemini compatibility
      const processedData = { ...data };
      if ('variations' in processedData) {
        const variations = (processedData as any).variations;
        if (typeof variations === 'number' && variations > 0) {
          // Use variations as iterations if iterations is not set or is less than variations
          if (!processedData.iterations || processedData.iterations < variations) {
            processedData.iterations = variations;
          }
        }
        delete (processedData as any).variations;
      }

      // Ensure iterations has a default value
      if (!processedData.iterations) {
        processedData.iterations = 1;
      }

      // Validate iterations range
      if (processedData.iterations < 1) {
        processedData.iterations = 1;
      } else if (processedData.iterations > 100) {
        processedData.iterations = 100;
      }

      const document: BatchStudioDocument = {
        ...processedData,
        imageIds: processedData.imageIds || [],
        videoIds: processedData.videoIds || [],
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };

      const result = await collection.insertOne(document);
      return result.insertedId;
    } catch (error) {
      throw new Error(`Failed to create batch studio document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get batch studio document by ID
   */
  async getBatchStudioById(id: string | ObjectId): Promise<BatchStudioDocument | null> {
    try {
      await this.connect();
      const collection = this.getCollection();

      const objectId = typeof id === 'string' ? new ObjectId(id) : id;
      return await collection.findOne({ _id: objectId });
    } catch (error) {
      throw new Error(`Failed to get batch studio document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get batch studio documents by user ID
   */
  async getBatchStudioByUser(
    userObjId: string,
    options: QueryOptions = {}
  ): Promise<BatchStudioDocument[]> {
    try {
      await this.connect();
      const collection = this.getCollection();

      const query = { userObjId };
      let cursor = collection.find(query);

      if (options.sort) {
        cursor = cursor.sort(options.sort);
      } else {
        cursor = cursor.sort({ created_date: -1 }); // Default: newest first
      }

      if (options.skip) {
        cursor = cursor.skip(options.skip);
      }

      if (options.limit) {
        cursor = cursor.limit(options.limit);
      }

      if (options.projection) {
        cursor = cursor.project(options.projection);
      }

      return await cursor.toArray();
    } catch (error) {
      throw new Error(`Failed to get user batch studio documents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update batch studio document
   */
  async updateBatchStudio(
    id: string | ObjectId,
    updates: UpdateBatchStudioDocument
  ): Promise<boolean> {
    try {
      await this.connect();
      const collection = this.getCollection();

      const objectId = typeof id === 'string' ? new ObjectId(id) : id;
      const updateData = {
        ...updates,
        updated_date: new Date().toISOString()
      };

      const result = await collection.updateOne(
        { _id: objectId },
        { $set: updateData }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      throw new Error(`Failed to update batch studio document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add image to batch studio document
   */
  async addImageToBatchStudio(
    id: string | ObjectId,
    imageData: ImageData
  ): Promise<boolean> {
    try {
      await this.connect();
      const collection = this.getCollection();

      const objectId = typeof id === 'string' ? new ObjectId(id) : id;

      const result = await collection.updateOne(
        { _id: objectId },
        {
          $push: { imageIds: imageData },
          $set: { updated_date: new Date().toISOString() }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      throw new Error(`Failed to add image to batch studio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add video to batch studio document
   */
  async addVideoToBatchStudio(
    id: string | ObjectId,
    videoData: VideoData
  ): Promise<boolean> {
    try {
      await this.connect();
      const collection = this.getCollection();

      const objectId = typeof id === 'string' ? new ObjectId(id) : id;

      const result = await collection.updateOne(
        { _id: objectId },
        {
          $push: { videoIds: videoData },
          $set: { updated_date: new Date().toISOString() }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      throw new Error(`Failed to add video to batch studio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove image from batch studio document
   */
  async removeImageFromBatchStudio(
    id: string | ObjectId,
    mediaId: string
  ): Promise<boolean> {
    try {
      await this.connect();
      const collection = this.getCollection();

      const objectId = typeof id === 'string' ? new ObjectId(id) : id;

      const result = await collection.updateOne(
        { _id: objectId },
        {
          $pull: { imageIds: { mediaId } },
          $set: { updated_date: new Date().toISOString() }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      throw new Error(`Failed to remove image from batch studio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove video from batch studio document
   */
  async removeVideoFromBatchStudio(
    id: string | ObjectId,
    mediaId: string
  ): Promise<boolean> {
    try {
      await this.connect();
      const collection = this.getCollection();

      const objectId = typeof id === 'string' ? new ObjectId(id) : id;

      const result = await collection.updateOne(
        { _id: objectId },
        {
          $pull: { videoIds: { mediaId } },
          $set: { updated_date: new Date().toISOString() }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      throw new Error(`Failed to remove video from batch studio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update image status in batch studio document
   */
  async updateImageStatus(
    id: string | ObjectId,
    mediaId: string,
    updates: Partial<ImageData>
  ): Promise<boolean> {
    try {
      await this.connect();
      const collection = this.getCollection();

      const objectId = typeof id === 'string' ? new ObjectId(id) : id;

      const updateFields: Record<string, any> = {};
      Object.keys(updates).forEach(key => {
        updateFields[`imageIds.$.${key}`] = updates[key as keyof ImageData];
      });
      updateFields['updated_date'] = new Date().toISOString();

      const result = await collection.updateOne(
        { _id: objectId, 'imageIds.mediaId': mediaId },
        { $set: updateFields }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      throw new Error(`Failed to update image status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update video status in batch studio document
   */
  async updateVideoStatus(
    id: string | ObjectId,
    mediaId: string,
    updates: Partial<VideoData>
  ): Promise<boolean> {
    try {
      await this.connect();
      const collection = this.getCollection();

      const objectId = typeof id === 'string' ? new ObjectId(id) : id;

      const updateFields: Record<string, any> = {};
      Object.keys(updates).forEach(key => {
        updateFields[`videoIds.$.${key}`] = updates[key as keyof VideoData];
      });
      updateFields['updated_date'] = new Date().toISOString();

      const result = await collection.updateOne(
        { _id: objectId, 'videoIds.mediaId': mediaId },
        { $set: updateFields }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      throw new Error(`Failed to update video status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete batch studio document
   */
  async deleteBatchStudio(id: string | ObjectId): Promise<boolean> {
    try {
      await this.connect();
      const collection = this.getCollection();

      const objectId = typeof id === 'string' ? new ObjectId(id) : id;
      const result = await collection.deleteOne({ _id: objectId });

      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete batch studio document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get batch studio documents by status
   */
  async getBatchStudioByStatus(
    status: 'Pending' | 'InProgress' | 'Completed' | 'Failed',
    options: QueryOptions = {}
  ): Promise<BatchStudioDocument[]> {
    try {
      await this.connect();
      const collection = this.getCollection();

      const query = { status };
      let cursor = collection.find(query);

      if (options.sort) {
        cursor = cursor.sort(options.sort);
      } else {
        cursor = cursor.sort({ created_date: -1 });
      }

      if (options.skip) cursor = cursor.skip(options.skip);
      if (options.limit) cursor = cursor.limit(options.limit);
      if (options.projection) cursor = cursor.project(options.projection);

      return await cursor.toArray();
    } catch (error) {
      throw new Error(`Failed to get batch studio by status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get batch studio statistics for user
   */
  async getUserBatchStudioStats(userObjId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    totalImages: number;
    totalVideos: number;
    totalDiamondsUsed: number;
  }> {
    try {
      await this.connect();
      const collection = this.getCollection();

      const pipeline = [
        { $match: { userObjId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalImages: { $sum: { $size: '$imageIds' } },
            totalVideos: { $sum: { $size: '$videoIds' } },
            totalDiamondsUsed: { $sum: { $ifNull: ['$diamondsUsed', 0] } },
            statuses: { $push: '$status' }
          }
        }
      ];

      const result = await collection.aggregate(pipeline).toArray();

      if (result.length === 0) {
        return {
          total: 0,
          byStatus: {},
          totalImages: 0,
          totalVideos: 0,
          totalDiamondsUsed: 0
        };
      }

      const stats = result[0];
      const byStatus: Record<string, number> = {};

      stats.statuses.forEach((status: string) => {
        byStatus[status] = (byStatus[status] || 0) + 1;
      });

      return {
        total: stats.total,
        byStatus,
        totalImages: stats.totalImages,
        totalVideos: stats.totalVideos,
        totalDiamondsUsed: stats.totalDiamondsUsed
      };
    } catch (error) {
      throw new Error(`Failed to get user batch studio stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search batch studio documents
   */
  async searchBatchStudio(
    query: {
      userObjId?: string;
      prompt?: string;
      status?: string;
      tool_used?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    options: QueryOptions = {}
  ): Promise<BatchStudioDocument[]> {
    try {
      await this.connect();
      const collection = this.getCollection();

      const mongoQuery: any = {};

      if (query.userObjId) mongoQuery.userObjId = query.userObjId;
      if (query.status) mongoQuery.status = query.status;
      if (query.tool_used) mongoQuery.tool_used = query.tool_used;

      if (query.prompt) {
        mongoQuery.prompt = { $regex: query.prompt, $options: 'i' };
      }

      if (query.dateFrom || query.dateTo) {
        mongoQuery.created_date = {};
        if (query.dateFrom) mongoQuery.created_date.$gte = query.dateFrom;
        if (query.dateTo) mongoQuery.created_date.$lte = query.dateTo;
      }

      let cursor = collection.find(mongoQuery);

      if (options.sort) {
        cursor = cursor.sort(options.sort);
      } else {
        cursor = cursor.sort({ created_date: -1 });
      }

      if (options.skip) cursor = cursor.skip(options.skip);
      if (options.limit) cursor = cursor.limit(options.limit);
      if (options.projection) cursor = cursor.project(options.projection);

      return await cursor.toArray();
    } catch (error) {
      throw new Error(`Failed to search batch studio documents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get batch studio documents by status array (for process recovery)
   */
  async getBatchStudiosByStatuses(statuses: string[]): Promise<BatchStudioDocument[]> {
    try {
      await this.connect();
      const collection = this.getCollection();

      const result = await collection.find({
        status: { $in: statuses }
      }).sort({ updated_date: -1 }).toArray();

      return result;
    } catch (error) {
      throw new Error(`Failed to get batch studios by statuses: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Health check - test connection
   */
  async healthCheck(): Promise<{ connected: boolean; message: string }> {
    try {
      await this.connect();
      await this.db!.admin().ping();
      return { connected: true, message: 'MongoDB connection healthy' };
    } catch (error) {
      return {
        connected: false,
        message: `MongoDB connection failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

/**
 * Create MongoDB manager with environment configuration
 */
export function createBatchStudioMongoManager(config: Partial<MongoConfig> = {}): BatchStudioMongoManager {
  return new BatchStudioMongoManager(config);
}

/**
 * Utility functions for MongoDB operations
 */
export const MongoUtils = {
  /**
   * Validate ObjectId string
   */
  isValidObjectId(id: string): boolean {
    try {
      new ObjectId(id);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Convert string to ObjectId safely
   */
  toObjectId(id: string): ObjectId {
    if (!this.isValidObjectId(id)) {
      throw new Error(`Invalid ObjectId: ${id}`);
    }
    return new ObjectId(id);
  },

  /**
   * Create pagination parameters
   */
  createPagination(page: number = 1, limit: number = 20): { skip: number; limit: number } {
    const skip = Math.max(0, (page - 1) * limit);
    return { skip, limit: Math.min(100, Math.max(1, limit)) }; // Max 100 items per page
  },

  /**
   * Create sort parameters
   */
  createSort(sortBy: string = 'created_date', order: 'asc' | 'desc' = 'desc'): Record<string, 1 | -1> {
    return { [sortBy]: order === 'asc' ? 1 : -1 };
  },

  /**
   * Validate batch studio data
   */
  validateBatchStudioData(data: CreateBatchStudioDocument): string[] {
    const errors: string[] = [];

    if (!data.prompt?.trim()) {
      errors.push('Prompt is required');
    }

    if (!data.userObjId?.trim()) {
      errors.push('User ID is required');
    }

    if (!['16:9', '4:3', '1:1', '9:16'].includes(data.ratio)) {
      errors.push('Invalid ratio. Must be 16:9, 4:3, 1:1, or 9:16');
    }

    if (!['Low', 'Medium', 'High'].includes(data.quality)) {
      errors.push('Invalid quality. Must be Low, Medium, or High');
    }

    if (data.iterations < 1 || data.iterations > 100) {
      errors.push('Iterations must be between 1 and 100');
    }

    return errors;
  },

  /**
   * Sanitize user input for MongoDB queries
   */
  sanitizeQuery(query: any): any {
    const sanitized = { ...query };

    // Remove MongoDB operators from user input
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        Object.keys(sanitized[key]).forEach(subKey => {
          if (subKey.startsWith('$')) {
            delete sanitized[key][subKey];
          }
        });
      }
      if (key.startsWith('$')) {
        delete sanitized[key];
      }
    });

    return sanitized;
  }
};

/**
 * Configuration validation
 */
export function validateMongoConfig(config: Partial<MongoConfig> = {}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const finalConfig = { ...DEFAULT_MONGO_CONFIG, ...config };

  if (!finalConfig.host) {
    errors.push('MongoDB host is required');
  }

  if (!finalConfig.port || finalConfig.port < 1 || finalConfig.port > 65535) {
    errors.push('Valid MongoDB port is required');
  }

  if (!finalConfig.database) {
    errors.push('MongoDB database name is required');
  }

  if (!finalConfig.username) {
    errors.push('MongoDB username is required');
  }

  if (!finalConfig.password) {
    errors.push('MongoDB password is required');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Default export
 */
export default BatchStudioMongoManager;
