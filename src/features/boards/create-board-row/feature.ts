import { WebApi } from 'azure-devops-node-api';
import { BoardRow } from '../types';
import { CreateBoardRowArgs } from './schema';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';
import axios from 'axios';
import { getAuthorizationHeader } from '../../../clients/azure-devops';
import { resolveBoardNameToId, createTeamContext } from '../utils';

/**
 * Creates a new row (swimlane) on a board by name (or ID for backward compatibility).
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for creating the board row.
 * @returns The created board row.
 */
export async function createBoardRow(
  connection: WebApi,
  args: CreateBoardRowArgs,
): Promise<BoardRow> {
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

    // Construct the API URL for creating a board row
    const url = `${baseUrl}/${args.project}/${args.team}/_apis/work/boards/${boardId}/rows?api-version=7.1`;

    // Make the REST API call using axios
    const response = await axios.post(
      url,
      { name: args.rowName },
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
          `Board not found: ${args.boardName} in project/team ${args.project}/${args.team}`,
        );
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to create board row: ${message}`);
  }
}
