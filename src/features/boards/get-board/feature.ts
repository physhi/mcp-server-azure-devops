import { BoardClient } from '../../../clients/board-client';
import { Board } from '../types';
import { GetBoardArgs } from './schema';
import { AzureDevOpsError } from '../../../shared/errors';

/**
 * Gets a specific board by its ID.
 *
 * @param client The BoardClient instance.
 * @param args The arguments for getting the board.
 * @returns A promise that resolves to the board details.
 */
export async function getBoard(
  client: BoardClient,
  args: GetBoardArgs,
): Promise<Board> {
  try {
    // The 'organization' from args is used by the caller to initialize the client.
    const board = await client.getBoard(args.project, args.team, args.boardId);
    return board;
  } catch (error: unknown) {
    if (error instanceof AzureDevOpsError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to get board: ${message}`);
  }
}
