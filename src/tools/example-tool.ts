/**
 * Example MCP Tool - NetADX AI-CORE Boilerplate
 * 
 * This is a simple example tool demonstrating the basic structure
 * of an MCP tool in the NetADX AI-CORE framework.
 * 
 * Use this as a template to create your own tools.
 */

import { z } from 'zod';
import type { MongoDBManager } from '../utils/mongodb';
import type { Logger } from '../utils/logger';

/**
 * Input schema validation using Zod
 */
const ExampleToolInputSchema = z.object({
  action: z.enum(['get_data', 'create_item', 'update_item', 'delete_item', 'list_items']),
  id: z.string().optional(),
  data: z.record(z.any()).optional(),
});

export type ExampleToolInput = z.infer<typeof ExampleToolInputSchema>;

/**
 * Example Tool Implementation
 * 
 * @param mongodb - MongoDB manager instance
 * @param logger - Logger instance
 * @returns MCP Tool definition
 */
export function createExampleTool(
  mongodb: MongoDBManager,
  logger: Logger
) {
  return {
    name: 'example_tool',
    description: 'Example tool demonstrating basic CRUD operations',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get_data', 'create_item', 'update_item', 'delete_item', 'list_items'],
          description: 'Action to perform',
        },
        id: {
          type: 'string',
          description: 'Item ID (required for get, update, delete)',
        },
        data: {
          type: 'object',
          description: 'Item data (required for create, update)',
        },
      },
      required: ['action'],
    },

    /**
     * Tool execution handler
     */
    async execute(input: unknown) {
      try {
        // Validate input
        const validatedInput = ExampleToolInputSchema.parse(input);
        const { action, id, data } = validatedInput;

        logger.info('Executing example tool', { action, id });

        // Get MongoDB collection
        const db = mongodb.getDb();
        const collection = db.collection('example_items');

        let result: any;

        // Handle different actions
        switch (action) {
          case 'get_data':
            if (!id) {
              throw new Error('id is required for get_data action');
            }
            result = await collection.findOne({ _id: id });
            if (!result) {
              throw new Error(`Item not found: ${id}`);
            }
            break;

          case 'create_item':
            if (!data) {
              throw new Error('data is required for create_item action');
            }
            const insertResult = await collection.insertOne({
              ...data,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            result = {
              id: insertResult.insertedId,
              success: true,
              message: 'Item created successfully',
            };
            break;

          case 'update_item':
            if (!id) {
              throw new Error('id is required for update_item action');
            }
            if (!data) {
              throw new Error('data is required for update_item action');
            }
            const updateResult = await collection.updateOne(
              { _id: id },
              { 
                $set: {
                  ...data,
                  updatedAt: new Date(),
                }
              }
            );
            if (updateResult.matchedCount === 0) {
              throw new Error(`Item not found: ${id}`);
            }
            result = {
              success: true,
              message: 'Item updated successfully',
              modifiedCount: updateResult.modifiedCount,
            };
            break;

          case 'delete_item':
            if (!id) {
              throw new Error('id is required for delete_item action');
            }
            const deleteResult = await collection.deleteOne({ _id: id });
            if (deleteResult.deletedCount === 0) {
              throw new Error(`Item not found: ${id}`);
            }
            result = {
              success: true,
              message: 'Item deleted successfully',
            };
            break;

          case 'list_items':
            const items = await collection.find({}).limit(100).toArray();
            result = {
              items,
              count: items.length,
            };
            break;

          default:
            throw new Error(`Unknown action: ${action}`);
        }

        logger.info('Example tool executed successfully', { action, result });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Example tool execution failed', { error });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    },
  };
}
