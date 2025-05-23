import { WebApi } from 'azure-devops-node-api';
import { BoardRow } from '../types';
import { UpdateBoardRowArgs } from './schema';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';
import axios from 'axios';
import { getAuthorizationHeader } from '../../../clients/azure-devops';

/**
 * Updates an existing row (swimlane) on a board.
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for updating the board row.
 * @returns The updated board row.
 */
export async function updateBoardRow(
  connection: WebApi,
  args: UpdateBoardRowArgs,
): Promise<BoardRow> {
  try {
    // Get the organization URL from the connection
    const baseUrl = connection.serverUrl;
    if (!baseUrl) {
      throw new AzureDevOpsError('Server URL not available in connection');
    }

    // Construct the API URL for updating a board row
    const url = `${baseUrl}/${args.project}/${args.team}/_apis/work/boards/${args.boardId}/rows/${args.rowId}?api-version=7.1`;

    // Make the REST API call using axios
    const response = await axios.patch(
      url,
      { name: args.newName },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: await getAuthorizationHeader(),
        },
      },
    );

    return response.data as BoardRow;
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
          `Board row not found: ${args.rowId} in board ${args.boardId}`,
        );
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to update board row: ${message}`);
  }
}
