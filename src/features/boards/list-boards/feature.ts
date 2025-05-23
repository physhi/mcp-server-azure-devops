import { WebApi } from 'azure-devops-node-api';
import { TeamContext } from 'azure-devops-node-api/interfaces/CoreInterfaces';
import { Board } from '../types';
import { ListBoardsArgs } from './schema';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';

/**
 * Lists boards for a given project and team.
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for listing boards.
 * @returns A promise that resolves to an array of boards.
 */
export async function listBoards(
  connection: WebApi,
  args: ListBoardsArgs,
): Promise<Board[]> {
  try {
    // Use the Work API to get boards
    const workApi = await connection.getWorkApi();

    // Create a team context for the API call
    const teamContext: TeamContext = {
      project: args.project,
      team: args.team,
    };

    // Get the boards for the specified team
    const boards = await workApi.getBoards(teamContext);
    return boards as unknown as Board[];
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
          `Project or team not found: ${args.project}/${args.team}`,
        );
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to list boards: ${message}`);
  }
}
