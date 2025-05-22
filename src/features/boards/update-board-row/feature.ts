import { BoardClient } from '../../../clients/board-client';
import { BoardRow } from '../types';
import { UpdateBoardRowArgs } from './schema';
import { AzureDevOpsError } from '../../../shared/errors';

/**
 * Updates an existing row (swimlane) on a board.
 *
 * @param client The BoardClient instance.
 * @param args The arguments for updating the board row.
 * @returns The updated board row.
 */
export async function updateBoardRow(
  client: BoardClient,
  args: UpdateBoardRowArgs,
): Promise<BoardRow> {
  try {
    // The 'organization' from args is used by the caller to initialize the client.
    const result = await client.updateBoardRow(
      args.project,
      args.team,
      args.boardId,
      args.rowId,
      args.newName,
    );
    return result;
  } catch (error: unknown) {
    if (error instanceof AzureDevOpsError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to update board row: ${message}`);
  }
}
