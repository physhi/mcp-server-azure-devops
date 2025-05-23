import { WebApi } from 'azure-devops-node-api';
import { BoardWorkItemsResult } from '../types';
import { GetBoardWorkItemsArgs } from './schema';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';
import axios from 'axios';
import { getAuthorizationHeader } from '../../../clients/azure-devops';

/**
 * Gets work items for a specific board, optionally filtered by iteration.
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for getting board work items.
 * @returns A promise that resolves to the board work items result.
 */
export async function getBoardWorkItems(
  connection: WebApi,
  args: GetBoardWorkItemsArgs,
): Promise<BoardWorkItemsResult> {
  try {
    // Since the Azure DevOps Node API doesn't have a direct method for board work items,
    // we need to make a direct REST API call

    // Get the organization URL from the connection
    const baseUrl = connection.serverUrl;
    if (!baseUrl) {
      throw new AzureDevOpsError('Server URL not available in connection');
    }

    // Construct the API URL for board work items
    let url = `${baseUrl}/${args.project}/${args.team}/_apis/work/boards/${args.boardId}/workitems?api-version=7.1`;

    // Add optional query parameters
    if (args.iterationId) {
      url += `&iterationId=${encodeURIComponent(args.iterationId)}`;
    } else if (args.iterationPath) {
      url += `&iterationPath=${encodeURIComponent(args.iterationPath)}`;
    }

    // Make the REST API call using axios
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: await getAuthorizationHeader(),
      },
    });

    return response.data as BoardWorkItemsResult;
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
          `Board or work items not found: ${args.boardId} in project/team ${args.project}/${args.team}`,
        );
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to get board work items: ${message}`);
  }
}
