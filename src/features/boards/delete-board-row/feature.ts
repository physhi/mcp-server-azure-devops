import { BoardClient } from '../../../clients/board-client';
import { DeleteBoardRowArgs } from './schema';
import { AzureDevOpsError } from '../../../shared/errors';

/**
 * Deletes a row (swimlane) from a board.
 *
 * @param client The BoardClient instance.
 * @param args The arguments for deleting the board row.
 * @returns A promise that resolves when the row is deleted.
 */
export async function deleteBoardRow(
  client: BoardClient,
  args: DeleteBoardRowArgs,
): Promise<void> {
  try {
    // The 'organization' from args is used by the caller to initialize the client.
    await client.deleteBoardRow(
      args.project,
      args.team,
      args.boardId,
      args.rowId,
    );
  } catch (error: unknown) {
    if (error instanceof AzureDevOpsError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    // TODO: Consider more specific error types like AzureDevOpsResourceNotFoundError if applicable
    throw new AzureDevOpsError(`Failed to delete board row: ${message}`);
  }
}
