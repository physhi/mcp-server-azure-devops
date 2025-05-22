import { BoardClient } from '../../../clients/board-client';
import { BoardColumn } from '../types';
import { GetBoardColumnsArgs } from './schema';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';

/**
 * Gets the columns of a specific board.
 *
 * @param client The BoardClient instance.
 * @param args The arguments for getting the board columns.
 * @returns A promise that resolves to an array of board columns.
 */
export async function getBoardColumns(
  client: BoardClient,
  args: GetBoardColumnsArgs,
): Promise<BoardColumn[]> {
  try {
    // The 'organization' from args is used by the caller to initialize the client.
    const board = await client.getBoard(args.project, args.team, args.boardId);
    if (!board || !board.columns) {
      throw new AzureDevOpsResourceNotFoundError(
        `Columns not found for board ${args.boardId}`,
      );
    }
    return board.columns;
  } catch (error: unknown) {
    if (error instanceof AzureDevOpsError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to get board columns: ${message}`);
  }
}
