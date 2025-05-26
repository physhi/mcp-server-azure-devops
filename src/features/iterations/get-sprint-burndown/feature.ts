import { WebApi } from 'azure-devops-node-api';
import { SprintBurndown, BurndownDataPoint } from '../types';
import { GetSprintBurndownArgs } from './schema';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';
import { resolveIterationNameToId, createTeamContext } from '../utils';

/**
 * Gets burndown chart data for a specific sprint/iteration by name (or ID for backward compatibility).
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for getting sprint burndown data.
 * @returns A promise that resolves to sprint burndown data.
 */
export async function getSprintBurndown(
  connection: WebApi,
  args: GetSprintBurndownArgs,
): Promise<SprintBurndown> {
  try {
    // Use the Work API to get iteration details
    const workApi = await connection.getWorkApi();
    const witApi = await connection.getWorkItemTrackingApi();

    // Create a team context for the API call
    const teamContext = createTeamContext(args.project || '', args.team);

    // Resolve iteration name to ID
    const iterationId = await resolveIterationNameToId(
      connection,
      teamContext,
      args.iterationName,
    );

    // Get the specific iteration details
    const iteration = await workApi.getTeamIteration(teamContext, iterationId);

    if (!iteration) {
      throw new AzureDevOpsResourceNotFoundError(
        `Iteration not found: ${args.iterationName}`,
      );
    }

    // Get work items for the iteration
    const iterationWorkItems = await workApi.getIterationWorkItems(
      teamContext,
      iterationId,
    );

    if (!iterationWorkItems || !iterationWorkItems.workItemRelations) {
      return {
        iterationId: iterationId,
        iterationName: iteration.name || 'Unknown',
        startDate: iteration.attributes?.startDate?.toISOString() || '',
        endDate: iteration.attributes?.finishDate?.toISOString() || '',
        dataPoints: [],
        totalWorkItems: 0,
        completedWorkItems: 0,
        remainingWorkItems: 0,
        progressPercentage: 0,
      };
    }

    // Extract work item IDs
    const workItemIds = iterationWorkItems.workItemRelations
      .filter((relation) => relation.target)
      .map((relation) => relation.target!.id)
      .filter((id): id is number => id !== undefined);

    if (workItemIds.length === 0) {
      return {
        iterationId: iterationId,
        iterationName: iteration.name || 'Unknown',
        startDate: iteration.attributes?.startDate?.toISOString() || '',
        endDate: iteration.attributes?.finishDate?.toISOString() || '',
        dataPoints: [],
        totalWorkItems: 0,
        completedWorkItems: 0,
        remainingWorkItems: 0,
        progressPercentage: 0,
      };
    }

    // Get work item details
    const workItems = await witApi.getWorkItems(workItemIds);

    // Filter by work item types if specified
    let filteredWorkItems = workItems;
    if (args.workItemTypes && args.workItemTypes.length > 0) {
      filteredWorkItems = workItems.filter(
        (item) =>
          item.fields &&
          args.workItemTypes!.includes(item.fields['System.WorkItemType']),
      );
    }

    // Calculate current status
    const totalWorkItems = filteredWorkItems.length;
    const completedWorkItems = filteredWorkItems.filter(
      (item) =>
        item.fields &&
        (item.fields['System.State'] === 'Closed' ||
          item.fields['System.State'] === 'Done' ||
          item.fields['System.State'] === 'Completed'),
    ).length;
    const remainingWorkItems = totalWorkItems - completedWorkItems;
    const progressPercentage =
      totalWorkItems > 0
        ? Math.round((completedWorkItems / totalWorkItems) * 100)
        : 0;

    // Generate burndown data points
    const dataPoints: BurndownDataPoint[] = [];
    const iterationStartDate = iteration.attributes?.startDate;
    const iterationEndDate = iteration.attributes?.finishDate;

    if (!iterationStartDate || !iterationEndDate) {
      // If we don't have valid dates, return basic data without burndown chart
      return {
        iterationId: iterationId,
        iterationName: iteration.name || 'Unknown',
        startDate: iterationStartDate?.toISOString() || '',
        endDate: iterationEndDate?.toISOString() || '',
        dataPoints: [],
        totalWorkItems,
        completedWorkItems,
        remainingWorkItems,
        progressPercentage,
      };
    }

    const startDate = new Date(iterationStartDate);
    const endDate = new Date(iterationEndDate);
    const today = new Date();

    // Calculate the number of days in the sprint
    const sprintDurationMs = endDate.getTime() - startDate.getTime();
    const sprintDurationDays = Math.ceil(
      sprintDurationMs / (1000 * 60 * 60 * 24),
    );

    // For now, we'll create a simplified burndown chart with current status
    // In a full implementation, we would need to query work item history
    // to get daily snapshots of completed work

    // Create data points for each day of the sprint
    for (
      let day = 0;
      day <=
      Math.min(
        sprintDurationDays,
        Math.ceil(
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
      day++
    ) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);

      // For simplicity, we'll assume linear progress
      // In a real implementation, you would query work item history for each day
      const progressRatio = Math.min(day / sprintDurationDays, 1);
      const estimatedCompletedWork = Math.floor(
        totalWorkItems * (progressPercentage / 100) * progressRatio,
      );
      const remainingWork = totalWorkItems - estimatedCompletedWork;

      // Calculate ideal remaining work (linear burndown)
      const idealRemainingWork = args.includeIdealLine
        ? Math.max(
            0,
            totalWorkItems -
              Math.floor((totalWorkItems * day) / sprintDurationDays),
          )
        : undefined;

      dataPoints.push({
        date: currentDate.toISOString().split('T')[0],
        remainingWork,
        completedWork: estimatedCompletedWork,
        totalWork: totalWorkItems,
        idealRemainingWork,
      });
    }

    return {
      iterationId: iterationId,
      iterationName: iteration.name || 'Unknown',
      startDate: iterationStartDate.toISOString(),
      endDate: iterationEndDate.toISOString(),
      dataPoints,
      totalWorkItems,
      completedWorkItems,
      remainingWorkItems,
      progressPercentage,
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
          `Project, team, or iteration not found: ${args.project}/${args.team}/${args.iterationId}`,
        );
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to get sprint burndown: ${message}`);
  }
}
