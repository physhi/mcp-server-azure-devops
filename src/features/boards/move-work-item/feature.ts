import { WebApi } from 'azure-devops-node-api';
import { MoveWorkItemArgs } from './schema';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';
import axios from 'axios';
import { getAuthorizationHeader } from '../../../clients/azure-devops';

/**
 * Moves a work item to a specified column and/or row on a board.
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for moving the work item.
 * @returns A promise that resolves to the result of the move operation (typically the updated work item).
 */
export async function moveWorkItem(
  connection: WebApi,
  args: MoveWorkItemArgs,
): Promise<any> {
  try {
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

    // Get the organization URL from the connection
    const baseUrl = connection.serverUrl;
    if (!baseUrl) {
      throw new AzureDevOpsError('Server URL not available in connection');
    }

    // Construct the API URL for updating work item
    const url = `${baseUrl}/${args.project}/_apis/wit/workitems/${args.workItemId}?api-version=7.1`;

    // Format the updates as a JSON patch document
    const patchOps = Object.entries(updates).map(([field, value]) => ({
      op: 'add',
      path: `/fields/${field}`,
      value,
    }));

    // Make the REST API call using axios
    const response = await axios.patch(url, patchOps, {
      headers: {
        'Content-Type': 'application/json-patch+json',
        Authorization: await getAuthorizationHeader(),
      },
    });

    return response.data;
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
          `Work item not found: ${args.workItemId} in project ${args.project}`,
        );
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to move work item: ${message}`);
  }
}
