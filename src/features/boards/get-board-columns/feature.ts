import { WebApi } from 'azure-devops-node-api';
import { BoardColumn } from '../types';
import { GetBoardColumnsArgs } from './schema';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';
import { resolveBoardNameToId, createTeamContext } from '../utils';

/**
 * Gets the columns of a specific board by name (or ID for backward compatibility).
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for getting the board columns.
 * @returns A promise that resolves to an array of board columns.
 */
export async function getBoardColumns(
  connection: WebApi,
  args: GetBoardColumnsArgs,
): Promise<BoardColumn[]> {
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

    // Get the board details which include columns
    const board = await workApi.getBoard(teamContext, boardId);

    if (!board || !board.columns) {
      throw new AzureDevOpsResourceNotFoundError(
        `Columns not found for board ${args.boardName}`,
      );
    }

    return board.columns as unknown as BoardColumn[];
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
    throw new AzureDevOpsError(`Failed to get board columns: ${message}`);
  }
}
