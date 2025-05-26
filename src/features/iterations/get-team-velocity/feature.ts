import { WebApi } from 'azure-devops-node-api';
import { TeamContext } from 'azure-devops-node-api/interfaces/CoreInterfaces';
import { TeamVelocity, IterationVelocity } from '../types';
import { GetTeamVelocityArgs } from './schema';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';
import { getTeam } from '../../../utils/defaults';

/**
 * Gets velocity data for a team across multiple iterations.
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for getting team velocity data.
 * @returns A promise that resolves to team velocity data.
 */
export async function getTeamVelocity(
  connection: WebApi,
  args: GetTeamVelocityArgs,
): Promise<TeamVelocity> {
  try {
    // Use the Work API to get iterations
    const workApi = await connection.getWorkApi();
    const witApi = await connection.getWorkItemTrackingApi();

    // Apply default team if not provided
    const teamName = getTeam(args.team);

    // Create a team context for the API call
    const teamContext: TeamContext = {
      project: args.project,
      team: teamName,
    };

    // Get all iterations for the team
    const allIterations = await workApi.getTeamIterations(teamContext);

    if (!allIterations || allIterations.length === 0) {
      throw new AzureDevOpsResourceNotFoundError(
        `No iterations found for team: ${teamName}`,
      );
    }

    // Filter iterations based on timeframe
    let relevantIterations = allIterations;

    // Exclude current iteration if specified
    if (!args.includeCurrentIteration) {
      relevantIterations = allIterations.filter(
        (iteration) =>
          iteration.attributes?.timeFrame &&
          String(iteration.attributes.timeFrame) !== 'Current',
      );
    }

    // Sort iterations by start date (most recent first) and limit to requested count
    const sortedIterations = relevantIterations
      .filter((iteration) => iteration.attributes?.startDate)
      .sort((a, b) => {
        const dateA = new Date(a.attributes!.startDate!);
        const dateB = new Date(b.attributes!.startDate!);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, args.iterationCount);

    if (sortedIterations.length === 0) {
      return {
        teamName: teamName,
        iterations: [],
        averageVelocity: 0,
        velocityTrend: 'stable',
        totalIterations: 0,
      };
    }

    // Calculate velocity for each iteration
    const iterationVelocities: IterationVelocity[] = [];

    for (const iteration of sortedIterations) {
      try {
        // Get work items for this iteration
        const iterationWorkItems = await workApi.getIterationWorkItems(
          teamContext,
          iteration.id!,
        );

        let plannedWork = 0;
        let completedWork = 0;
        let workItemCount = 0;
        let completedWorkItemCount = 0;

        if (iterationWorkItems && iterationWorkItems.workItemRelations) {
          // Extract work item IDs
          const workItemIds = iterationWorkItems.workItemRelations
            .filter((relation) => relation.target)
            .map((relation) => relation.target!.id)
            .filter((id): id is number => id !== undefined);

          if (workItemIds.length > 0) {
            // Get work item details
            const workItems = await witApi.getWorkItems(workItemIds);

            // Filter by work item types if specified
            let filteredWorkItems = workItems;
            if (args.workItemTypes && args.workItemTypes.length > 0) {
              filteredWorkItems = workItems.filter(
                (item) =>
                  item.fields &&
                  args.workItemTypes!.includes(
                    item.fields['System.WorkItemType'],
                  ),
              );
            }

            workItemCount = filteredWorkItems.length;

            // Calculate story points/effort
            for (const workItem of filteredWorkItems) {
              if (workItem.fields) {
                // Try to get story points or effort
                const storyPoints =
                  workItem.fields['Microsoft.VSTS.Scheduling.StoryPoints'] ||
                  workItem.fields['Microsoft.VSTS.Scheduling.Effort'] ||
                  1; // Default to 1 if no effort is specified

                plannedWork += Number(storyPoints) || 1;

                // Check if work item is completed
                const state = workItem.fields['System.State'];
                if (
                  state === 'Closed' ||
                  state === 'Done' ||
                  state === 'Completed'
                ) {
                  completedWork += Number(storyPoints) || 1;
                  completedWorkItemCount++;
                }
              }
            }
          }
        }

        // Calculate velocity for this iteration (completed work)
        const velocity = completedWork;

        iterationVelocities.push({
          iterationId: iteration.id!,
          iterationName: iteration.name || 'Unknown',
          startDate: iteration.attributes?.startDate?.toISOString() || '',
          endDate: iteration.attributes?.finishDate?.toISOString() || '',
          plannedWork,
          completedWork,
          velocity,
          workItemCount,
          completedWorkItemCount,
        });
      } catch (error) {
        // Log the error but continue with other iterations
        console.error(
          `Error calculating velocity for iteration ${iteration.id}:`,
          error,
        );
      }
    }

    // Calculate average velocity
    const totalVelocity = iterationVelocities.reduce(
      (sum, iteration) => sum + iteration.velocity,
      0,
    );
    const averageVelocity =
      iterationVelocities.length > 0
        ? Math.round((totalVelocity / iterationVelocities.length) * 100) / 100
        : 0;

    // Determine velocity trend
    let velocityTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (iterationVelocities.length >= 2) {
      const recentVelocities = iterationVelocities
        .slice(0, Math.min(3, iterationVelocities.length))
        .map((iteration) => iteration.velocity);
      const earlierVelocities = iterationVelocities
        .slice(Math.min(3, iterationVelocities.length))
        .map((iteration) => iteration.velocity);

      if (recentVelocities.length > 0 && earlierVelocities.length > 0) {
        const recentAvg =
          recentVelocities.reduce((sum, v) => sum + v, 0) /
          recentVelocities.length;
        const earlierAvg =
          earlierVelocities.reduce((sum, v) => sum + v, 0) /
          earlierVelocities.length;

        const change = (recentAvg - earlierAvg) / earlierAvg;
        if (change > 0.1) {
          velocityTrend = 'increasing';
        } else if (change < -0.1) {
          velocityTrend = 'decreasing';
        }
      }
    }

    return {
      teamName: teamName,
      iterations: iterationVelocities,
      averageVelocity,
      velocityTrend,
      totalIterations: iterationVelocities.length,
    };
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
          `Project or team not found: ${args.project}/${getTeam(args.team)}`,
        );
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to get team velocity: ${message}`);
  }
}
