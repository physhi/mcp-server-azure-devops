import { WebApi } from 'azure-devops-node-api';
import { TeamContext } from 'azure-devops-node-api/interfaces/CoreInterfaces';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';
import { WorkItem } from '../types';
import { GetWorkItemsByIterationArgs } from './schema';
import { getWorkItem } from '../get-work-item';

/**
 * Gets all work items in a specific iteration with complete details.
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for getting work items by iteration.
 * @returns A promise that resolves to an array of work items.
 */
export async function getWorkItemsByIteration(
  connection: WebApi,
  args: GetWorkItemsByIterationArgs,
): Promise<WorkItem[]> {
  try {
    // Use the Work API to get iteration work items
    const workApi = await connection.getWorkApi();
    const witApi = await connection.getWorkItemTrackingApi();

    // Create a team context for the API call
    const teamContext: TeamContext = {
      project: args.project,
      team: args.team,
    };

    // Get work items for the iteration
    const iterationWorkItems = await workApi.getIterationWorkItems(
      teamContext,
      args.iterationId,
    );

    if (!iterationWorkItems || !iterationWorkItems.workItemRelations) {
      return [];
    }

    // Extract work item IDs
    const workItemIds = iterationWorkItems.workItemRelations
      .filter((relation) => relation.target)
      .map((relation) => relation.target!.id)
      .filter((id): id is number => id !== undefined);

    if (workItemIds.length === 0) {
      return [];
    }

    // Get detailed information for each work item
    let workItems: WorkItem[] = [];

    // Get work items in batches to avoid API limitations
    const batchSize = 100;
    for (let i = 0; i < workItemIds.length; i += batchSize) {
      const batchIds = workItemIds.slice(i, i + batchSize);
      const batchItems = await witApi.getWorkItems(
        batchIds,
        undefined,
        undefined,
        args.expand,
      );

      if (batchItems && batchItems.length > 0) {
        workItems = [...workItems, ...(batchItems as unknown as WorkItem[])];
      }
    }

    // Apply filters if specified
    if (args.state) {
      workItems = workItems.filter(
        (item) => item.fields && item.fields['System.State'] === args.state,
      );
    }

    if (args.workItemType) {
      workItems = workItems.filter(
        (item) =>
          item.fields &&
          item.fields['System.WorkItemType'] === args.workItemType,
      );
    }

    // For each work item, get enhanced details with all fields
    const enhancedWorkItems: WorkItem[] = [];

    for (const workItem of workItems) {
      if (workItem.id) {
        try {
          // Use the existing getWorkItem function to get enhanced details
          const enhancedWorkItem = await getWorkItem(
            connection,
            workItem.id,
            args.expand,
          );

          enhancedWorkItems.push(enhancedWorkItem);
        } catch (error) {
          // Log the error but continue with other work items
          console.error(
            `Error getting enhanced details for work item ${workItem.id}:`,
            error,
          );
          enhancedWorkItems.push(workItem as WorkItem);
        }
      }
    }

    return enhancedWorkItems;
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
          `Project, team, or iteration not found: ${args.project}/${args.team}/${args.iterationId}`,
        );
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(
      `Failed to get work items by iteration: ${message}`,
    );
  }
}
