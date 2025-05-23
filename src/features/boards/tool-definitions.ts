import { zodToJsonSchema } from 'zod-to-json-schema';
import { ToolDefinition } from '../../shared/types/tool-definition';
import {
  boardListParamsSchema,
  boardParamsSchema,
  boardWorkItemsParamsSchema,
  moveWorkItemParamsSchema,
} from './schemas';

/**
 * List of board tools
 */
export const boardTools: ToolDefinition[] = [
  {
    name: 'list_boards',
    description: 'Get a list of boards for a team',
    inputSchema: zodToJsonSchema(boardListParamsSchema),
  },
  {
    name: 'get_board',
    description: 'Get details of a specific board',
    inputSchema: zodToJsonSchema(boardParamsSchema),
  },
  {
    name: 'get_board_columns',
    description: 'Get columns for a specific board',
    inputSchema: zodToJsonSchema(boardParamsSchema),
  },
  {
    name: 'get_board_work_items',
    description: 'Get work items for a specific board',
    inputSchema: zodToJsonSchema(boardWorkItemsParamsSchema),
  },
  {
    name: 'create_board_row',
    description: 'Create a new swim lane (row) on a board',
    inputSchema: zodToJsonSchema(
      boardParamsSchema.extend({
        rowName: boardListParamsSchema.shape.team,
      }),
    ),
  },
  {
    name: 'update_board_row',
    description: 'Update the name of a swim lane (row) on a board',
    inputSchema: zodToJsonSchema(
      boardParamsSchema.extend({
        rowId: boardListParamsSchema.shape.team,
        newName: boardListParamsSchema.shape.team,
      }),
    ),
  },
  {
    name: 'delete_board_row',
    description: 'Delete a swim lane (row) from a board',
    inputSchema: zodToJsonSchema(
      boardParamsSchema.extend({
        rowId: boardListParamsSchema.shape.team,
      }),
    ),
  },
  {
    name: 'move_work_item',
    description: 'Move a work item to a different column or swim lane (row)',
    inputSchema: zodToJsonSchema(moveWorkItemParamsSchema),
  },
];
