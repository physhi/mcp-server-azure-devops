import { WebApi } from 'azure-devops-node-api';
import { IterationDetails } from '../types';
import { GetIterationDetailsArgs } from './schema';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';
import { resolveIterationNameToId, createTeamContext } from '../utils';

/**
 * Gets detailed information about a specific iteration by name (or ID for backward compatibility).
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for getting iteration details.
 * @returns A promise that resolves to iteration details.
 */
export async function getIterationDetails(
  connection: WebApi,
  args: GetIterationDetailsArgs,
): Promise<IterationDetails> {
  try {
    // Use the Work API to get iteration details
    const workApi = await connection.getWorkApi();

    // Create a team context for the API call
    const teamContext = createTeamContext(args.project || '', args.team);

    // Resolve iteration name to ID
    const iterationId = await resolveIterationNameToId(
      connection,
      teamContext,
      args.iterationName,
    );

    // Get the specific iteration by ID
    const iteration = await workApi.getTeamIteration(teamContext, iterationId);

    if (!iteration) {
      throw new AzureDevOpsResourceNotFoundError(
        `Iteration not found: ${args.iterationName}`,
      );
    }

    // Convert to our IterationDetails type
    const iterationDetails: IterationDetails = {
      ...iteration,
      workItemCount: 0,
      teamCapacity: 0,
      remainingWorkItems: 0,
      completedWorkItems: 0,
    } as unknown as IterationDetails;

    // If includeWorkItems is true, get work items for this iteration
    if (args.includeWorkItems) {
      try {
        // Get work items for the iteration
        const workItems = await workApi.getIterationWorkItems(
          teamContext,
          iterationId,
        );

        // Calculate work item statistics
        iterationDetails.workItemCount =
          workItems.workItemRelations?.length || 0;

        // Get team capacity - Note: This API might not be directly available in the SDK
        // For now, we'll set a default value
        // In a real implementation, you might need to use a custom API call
        iterationDetails.teamCapacity = 0;

        // If we have work items, we can calculate more statistics
        if (
          workItems.workItemRelations &&
          workItems.workItemRelations.length > 0
        ) {
          // Get work item IDs
          const workItemIds = workItems.workItemRelations
            .filter((relation) => relation.target)
            .map((relation) => relation.target!.id)
            .filter((id): id is number => id !== undefined);

          // Get work item details using the Work Item Tracking API
          const witApi = await connection.getWorkItemTrackingApi();
          const workItemDetails = await witApi.getWorkItems(workItemIds);

          // Calculate completed and remaining work items
          iterationDetails.completedWorkItems = workItemDetails.filter(
            (item) =>
              item.fields &&
              (item.fields['System.State'] === 'Closed' ||
                item.fields['System.State'] === 'Done' ||
                item.fields['System.State'] === 'Completed'),
          ).length;

          iterationDetails.remainingWorkItems =
            iterationDetails.workItemCount -
            iterationDetails.completedWorkItems;
        }
      } catch (workItemError) {
        // Log the error but don't fail the entire request
        console.error('Error fetching work items:', workItemError);
      }
    }

    return iterationDetails;
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
          `Project, team, or iteration not found: ${args.project}/${args.team}/${args.iterationName}`,
        );
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to get iteration details: ${message}`);
  }
}
