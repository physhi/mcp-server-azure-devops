import { WebApi } from 'azure-devops-node-api';
import { WorkItemUpdate } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';
import { GetWorkItemHistoryArgs } from './schema';

/**
 * Gets the history of changes to a work item.
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for getting work item history.
 * @returns A promise that resolves to an array of work item updates.
 */
export async function getWorkItemHistory(
  connection: WebApi,
  args: GetWorkItemHistoryArgs,
): Promise<WorkItemUpdate[]> {
  try {
    // Use the Work Item Tracking API to get work item updates
    const witApi = await connection.getWorkItemTrackingApi();

    // Get the work item updates
    const updates = await witApi.getUpdates(
      args.workItemId,
      args.top,
      args.skip,
      args.projectId,
    );

    if (!updates) {
      return [];
    }

    // Sort updates by revision descending (newest first)
    return updates.sort((a, b) => {
      const revA = a.rev || 0;
      const revB = b.rev || 0;
      return revB - revA;
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
          `Work item not found: ${args.workItemId}`,
        );
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to get work item history: ${message}`);
  }
}
