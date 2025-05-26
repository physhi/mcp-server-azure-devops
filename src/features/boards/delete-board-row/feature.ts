import { WebApi } from 'azure-devops-node-api';
import { DeleteBoardRowArgs } from './schema';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';
import axios from 'axios';
import { getAuthorizationHeader } from '../../../clients/azure-devops';
import { resolveBoardNameToId, createTeamContext } from '../utils';

/**
 * Deletes a row (swimlane) from a board by name (or ID for backward compatibility).
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for deleting the board row.
 * @returns A promise that resolves when the row is deleted.
 */
export async function deleteBoardRow(
  connection: WebApi,
  args: DeleteBoardRowArgs,
): Promise<void> {
  try {
    // Resolve board name to ID
    const teamContext = createTeamContext(args.project || '', args.team);
    const boardId = await resolveBoardNameToId(
      connection,
      teamContext,
      args.boardName,
    );

    // Get the organization URL from the connection
    const baseUrl = connection.serverUrl;
    if (!baseUrl) {
      throw new AzureDevOpsError('Server URL not available in connection');
    }

    // Construct the API URL for deleting a board row
    const url = `${baseUrl}/${args.project}/${args.team}/_apis/work/boards/${boardId}/rows/${args.rowId}?api-version=7.1`;

    // Make the REST API call using axios
    await axios.delete(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: await getAuthorizationHeader(),
      },
    });
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
          `Board row not found: ${args.rowId} in board ${args.boardName}`,
        );
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to delete board row: ${message}`);
  }
}
