import { WebApi } from 'azure-devops-node-api';
import { Board } from '../types';
import { GetBoardArgs } from './schema';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';
import { resolveBoardNameToId, createTeamContext } from '../utils';

/**
 * Gets a specific board by its name (or ID for backward compatibility).
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for getting the board.
 * @returns A promise that resolves to the board details.
 */
export async function getBoard(
  connection: WebApi,
  args: GetBoardArgs,
): Promise<Board> {
  try {
    // Use the Work API to get board details
    const workApi = await connection.getWorkApi();

    // Create a team context for the API call
    const teamContext = createTeamContext(args.project, args.team);

    // Resolve board name to ID
    const boardId = await resolveBoardNameToId(
      connection,
      teamContext,
      args.boardName,
    );

    // Get the specific board by ID
    const board = await workApi.getBoard(teamContext, boardId);
    return board as unknown as Board;
  } catch (error: unknown) {
    if (error instanceof AzureDevOpsError) {
      throw error;
    }

    // Handle specific error cases
    if (error instanceof Error) {
      if (
        error.message.includes('not found') ||
        error.message.includes('does not exist')
      ) {
        throw new AzureDevOpsResourceNotFoundError(
          `Board not found: ${args.boardName} in project/team ${args.project}/${args.team}`,
        );
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to get board: ${message}`);
  }
}
