// New exports for request handling
import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { WebApi } from 'azure-devops-node-api';
import {
  RequestIdentifier,
  RequestHandler,
} from '../../shared/types/request-handler';
import { defaultOrg, defaultProject } from '../../utils/environment';

// Import new modular features
import { CreateBoardRowSchema, createBoardRow } from './create-board-row';
import { DeleteBoardRowSchema, deleteBoardRow } from './delete-board-row';
import { UpdateBoardRowSchema, updateBoardRow } from './update-board-row';
import { ListBoardsSchema, listBoards } from './list-boards';
import { GetBoardSchema, getBoard } from './get-board';
import { GetBoardColumnsSchema, getBoardColumns } from './get-board-columns';
import {
  GetBoardWorkItemsSchema,
  getBoardWorkItems,
} from './get-board-work-items';
import { MoveWorkItemSchema, moveWorkItem } from './move-work-item';
// ... other modular imports will go here

// Define the response type based on observed usage
interface CallToolResponse {
  content: Array<{ type: string; text: string }>;
}

/**
 * Checks if the request is for the boards feature
 */
export const isBoardsRequest: RequestIdentifier = (
  request: CallToolRequest,
): boolean => {
  const toolName = request.params.name;
  return [
    'list_boards',
    'get_board',
    'get_board_columns',
    'get_board_work_items',
    'create_board_row', // This will be handled by the new structure
    'update_board_row',
    'delete_board_row',
    'move_work_item',
  ].includes(toolName);
};

/**
 * Handles boards feature requests
 */
export const handleBoardsRequest: RequestHandler = async (
  connection: WebApi,
  request: CallToolRequest,
): Promise<CallToolResponse> => {
  // Extract tool name and arguments
  const { name, arguments: args = {} } = request.params;

  // Ensure we have default values for organization and project
  const argsWithDefaults = {
    organization: defaultOrg,
    project: defaultProject,
    ...args,
  };

  switch (name) {
    case 'list_boards': {
      const parsedArgs = ListBoardsSchema.parse(argsWithDefaults);
      const result = await listBoards(connection, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'get_board': {
      const parsedArgs = GetBoardSchema.parse(argsWithDefaults);
      const result = await getBoard(connection, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'get_board_columns': {
      const parsedArgs = GetBoardColumnsSchema.parse(argsWithDefaults);
      const result = await getBoardColumns(connection, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'get_board_work_items': {
      const parsedArgs = GetBoardWorkItemsSchema.parse(argsWithDefaults);
      const result = await getBoardWorkItems(connection, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'create_board_row': {
      const parsedArgs = CreateBoardRowSchema.parse(argsWithDefaults);
      const result = await createBoardRow(connection, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'update_board_row': {
      const parsedArgs = UpdateBoardRowSchema.parse(argsWithDefaults);
      const result = await updateBoardRow(connection, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'delete_board_row': {
      const parsedArgs = DeleteBoardRowSchema.parse(argsWithDefaults);
      await deleteBoardRow(connection, parsedArgs);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: true, message: 'Row deleted successfully' },
              null,
              2,
            ),
          },
        ],
      };
    }
    case 'move_work_item': {
      const parsedArgs = MoveWorkItemSchema.parse(argsWithDefaults);
      const result = await moveWorkItem(connection, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    default:
      throw new Error(`Unknown board tool: ${name}`);
  }
};

export * from './types';
export * from './schemas';
export * from './tool-definitions';
