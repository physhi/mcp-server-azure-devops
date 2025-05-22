import { BoardClient } from '../../../clients/board-client';
import { BoardWorkItemsResult } from '../types';
import { GetBoardWorkItemsArgs } from './schema';
import { AzureDevOpsError } from '../../../shared/errors';

/**
 * Gets work items for a specific board, optionally filtered by iteration.
 *
 * @param client The BoardClient instance.
 * @param args The arguments for getting board work items.
 * @returns A promise that resolves to the board work items result.
 */
export async function getBoardWorkItems(
  client: BoardClient,
  args: GetBoardWorkItemsArgs,
): Promise<BoardWorkItemsResult> {
  try {
    // The 'organization' from args is used by the caller to initialize the client.
    const workItems = await client.getBoardWorkItems(
      args.project,
      args.team,
      args.boardId,
      { iterationId: args.iterationId, iterationPath: args.iterationPath },
    );
    return workItems;
  } catch (error: unknown) {
    if (error instanceof AzureDevOpsError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to get board work items: ${message}`);
  }
}
