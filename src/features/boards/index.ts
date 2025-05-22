// New exports for request handling
import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { WebApi } from 'azure-devops-node-api';
import {
  RequestIdentifier,
  RequestHandler,
} from '../../shared/types/request-handler';

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
  _connection: WebApi, // Not using connection directly, using organization instead
  request: CallToolRequest,
): Promise<CallToolResponse> => {
  // Extract tool name and arguments
  const { name, arguments: args = {} } = request.params;

  // Get the organization from the args
  const organization = args.organization as string;

  // We need to use the organization string to create the client properly
  const { getBoardClient } = await import('../../clients/board-client.js');
  const boardClient = getBoardClient({ organizationId: organization });

  switch (name) {
    case 'list_boards': {
      const parsedArgs = ListBoardsSchema.parse(args);
      const result = await listBoards(boardClient, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'get_board': {
      const parsedArgs = GetBoardSchema.parse(args);
      const result = await getBoard(boardClient, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'get_board_columns': {
      const parsedArgs = GetBoardColumnsSchema.parse(args);
      const result = await getBoardColumns(boardClient, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'get_board_work_items': {
      const parsedArgs = GetBoardWorkItemsSchema.parse(args);
      const result = await getBoardWorkItems(boardClient, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'create_board_row': {
      const parsedArgs = CreateBoardRowSchema.parse(args);
      const result = await createBoardRow(boardClient, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'update_board_row': {
      const parsedArgs = UpdateBoardRowSchema.parse(args);
      const result = await updateBoardRow(boardClient, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'delete_board_row': {
      const parsedArgs = DeleteBoardRowSchema.parse(args);
      await deleteBoardRow(boardClient, parsedArgs);
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
      const parsedArgs = MoveWorkItemSchema.parse(args);
      const result = await moveWorkItem(boardClient, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    default:
      throw new Error(`Unknown board tool: ${name}`);
  }
};

export * from '@/features/boards/types';
export * from '@/features/boards/schemas';
export * from '@/features/boards/tool-definitions';
