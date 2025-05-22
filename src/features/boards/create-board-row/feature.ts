import { BoardClient } from '../../../clients/board-client';
import { BoardRow } from '../types';
import { CreateBoardRowArgs } from './schema';
import { AzureDevOpsError } from '../../../shared/errors';

/**
 * Creates a new row (swimlane) on a board.
 *
 * @param client The BoardClient instance.
 * @param args The arguments for creating the board row.
 * @returns The created board row.
 */
export async function createBoardRow(
  client: BoardClient,
  args: CreateBoardRowArgs,
): Promise<BoardRow> {
  try {
    // The 'organization' from args is used by the caller to initialize the client,
    // not passed directly to this specific client method.
    const result = await client.createBoardRow(
      args.project,
      args.team,
      args.boardId,
      args.rowName,
    );
    return result;
  } catch (error: unknown) {
    if (error instanceof AzureDevOpsError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    // TODO: Consider more specific error types like AzureDevOpsResourceNotFoundError if applicable
    throw new AzureDevOpsError(`Failed to create board row: ${message}`);
  }
}
