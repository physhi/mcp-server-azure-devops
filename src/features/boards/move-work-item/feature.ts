import { BoardClient } from '../../../clients/board-client';
import { MoveWorkItemArgs } from './schema';
import { AzureDevOpsError } from '../../../shared/errors';

/**
 * Moves a work item to a specified column and/or row on a board.
 *
 * @param client The BoardClient instance.
 * @param args The arguments for moving the work item.
 * @returns A promise that resolves to the result of the move operation (typically the updated work item).
 */
export async function moveWorkItem(
  client: BoardClient,
  args: MoveWorkItemArgs,
): Promise<any> {
  // The BoardClient.moveWorkItemToColumnRow returns Promise<any>
  try {
    // The 'organization' from args is used by the caller to initialize the client.
    // Construct the updates object based on provided columnId and rowId
    const updates: Record<string, any> = {};
    if (args.columnId) {
      // Assuming the board's column field reference name is 'System.BoardColumn'
      // This might need to be fetched dynamically from board settings if it can vary
      updates['System.BoardColumn'] = args.columnId;
    }
    if (args.rowId) {
      // Assuming the board's row field reference name is 'System.BoardLane'
      updates['System.BoardLane'] = args.rowId;
    }

    if (Object.keys(updates).length === 0) {
      throw new AzureDevOpsError(
        'No columnId or rowId provided for moving the work item.',
      );
    }

    const result = await client.moveWorkItemToColumnRow(
      args.workItemId,
      args.project,
      updates,
    );
    return result;
  } catch (error: unknown) {
    if (error instanceof AzureDevOpsError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to move work item: ${message}`);
  }
}
