import { WebApi } from 'azure-devops-node-api';
import { TeamContext } from 'azure-devops-node-api/interfaces/CoreInterfaces';
import { TeamCurrentIteration } from '../types';
import { GetTeamCurrentIterationArgs } from './schema';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';

/**
 * Gets the current iteration for a team.
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for getting the team's current iteration.
 * @returns A promise that resolves to the team's current iteration.
 */
export async function getTeamCurrentIteration(
  connection: WebApi,
  args: GetTeamCurrentIterationArgs,
): Promise<TeamCurrentIteration> {
  try {
    // Use the Work API to get the team's current iteration
    const workApi = await connection.getWorkApi();

    // Create a team context for the API call
    const teamContext: TeamContext = {
      project: args.project,
      team: args.team,
    };

    // Get the team's current iterations
    const currentIterations = await workApi.getTeamIterations(
      teamContext,
      'current',
    );

    if (!currentIterations || currentIterations.length === 0) {
      throw new AzureDevOpsResourceNotFoundError(
        `No current iteration found for team: ${args.team}`,
      );
    }

    // Get the first current iteration (there should typically be only one)
    const currentIteration = currentIterations[0];

    // Convert to our TeamCurrentIteration type
    const teamCurrentIteration: TeamCurrentIteration = {
      ...currentIteration,
      isCurrentIteration: true,
    } as unknown as TeamCurrentIteration;

    // If includeProgress is true, calculate additional progress information
    if (args.includeProgress) {
      // Calculate remaining days and total days
      const startDateStr = currentIteration.attributes?.startDate;
      const finishDateStr = currentIteration.attributes?.finishDate;

      const startDate = startDateStr ? new Date(startDateStr) : null;
      const finishDate = finishDateStr ? new Date(finishDateStr) : null;

      const now = new Date();

      if (startDate && finishDate) {
        // Calculate total days in the iteration
        const totalDays = Math.ceil(
          (finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        teamCurrentIteration.totalDays = totalDays;

        // Calculate remaining days
        const remainingDays = Math.ceil(
          (finishDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        teamCurrentIteration.remainingDays = Math.max(0, remainingDays);

        // Calculate progress percentage
        const elapsedDays = totalDays - teamCurrentIteration.remainingDays;
        teamCurrentIteration.progressPercentage = Math.min(
          100,
          Math.round((elapsedDays / totalDays) * 100),
        );
      }

      // Get work items for the current iteration to calculate progress
      try {
        // Get work items for the iteration
        const iterationId = currentIteration.id;
        if (!iterationId) {
          throw new AzureDevOpsResourceNotFoundError(
            `Invalid iteration ID for team: ${args.team}`,
          );
        }

        const workItems = await workApi.getIterationWorkItems(
          teamContext,
          iterationId,
        );

        // If we have work items, we can calculate work item progress
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

          // Calculate completed work items percentage
          const completedWorkItems = workItemDetails.filter(
            (item) =>
              item.fields &&
              (item.fields['System.State'] === 'Closed' ||
                item.fields['System.State'] === 'Done' ||
                item.fields['System.State'] === 'Completed'),
          ).length;

          const totalWorkItems = workItemDetails.length;

          // If we have work item progress, use it instead of time-based progress
          if (totalWorkItems > 0) {
            teamCurrentIteration.progressPercentage = Math.round(
              (completedWorkItems / totalWorkItems) * 100,
            );
          }
        }
      } catch (workItemError) {
        // Log the error but don't fail the entire request
        console.error('Error fetching work items:', workItemError);
      }
    }

    return teamCurrentIteration;
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
    throw new AzureDevOpsError(
      `Failed to get team's current iteration: ${message}`,
    );
  }
}
