import { BoardClient } from '../../../clients/board-client';
import { Board } from '../types';
import { ListBoardsArgs } from './schema';
import { AzureDevOpsError } from '../../../shared/errors';

/**
 * Lists boards for a given project and team.
 *
 * @param client The BoardClient instance.
 * @param args The arguments for listing boards.
 * @returns A promise that resolves to an array of boards.
 */
export async function listBoards(
  client: BoardClient,
  args: ListBoardsArgs,
): Promise<Board[]> {
  try {
    // The 'organization' from args is used by the caller to initialize the client.
    const boards = await client.getBoardList(args.project, args.team);
    return boards;
  } catch (error: unknown) {
    if (error instanceof AzureDevOpsError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to list boards: ${message}`);
  }
}
