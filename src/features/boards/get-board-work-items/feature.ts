import { WebApi } from 'azure-devops-node-api';
import { BoardWorkItemsResult } from '../types';
import { GetBoardWorkItemsArgs } from './schema';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';
import { resolveBoardNameToId, createTeamContext } from '../utils';
import { resolveIterationNameToId } from '../../iterations/utils';

/**
 * Gets work items for a specific board by name (or ID for backward compatibility), optionally filtered by iteration.
 *
 * Note: Azure DevOps does not have a direct "board work items" REST API endpoint.
 * This implementation queries work items that would be displayed on the board based on:
 * - Team's area paths
 * - Board's associated work item types
 * - Optional iteration filtering
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
    // Resolve board name to ID and get board details
    const teamContext = createTeamContext(args.project, args.team);

    console.log(
      `[DEBUG] Resolving board name: "${args.boardName}" for project: ${args.project}, team: ${args.team}`,
    );
    const boardId = await resolveBoardNameToId(
      connection,
      teamContext,
      args.boardName,
    );
    console.log(`[DEBUG] Resolved board ID: ${boardId}`);

    // Get the board details to understand its configuration
    const workApi = await connection.getWorkApi();
    const board = await workApi.getBoard(teamContext, boardId);

    if (!board) {
      throw new AzureDevOpsResourceNotFoundError(
        `Board "${args.boardName}" not found in project/team ${args.project}/${args.team}`,
      );
    }

    console.log(`[DEBUG] Board details: ${board.name} (${board.id})`);

    // Get work item tracking API
    const witApi = await connection.getWorkItemTrackingApi();

    // Build a WIQL query to get work items that would appear on this board
    let wiqlQuery = `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType], [System.AssignedTo], [System.AreaPath], [System.IterationPath]
FROM WorkItems
WHERE [System.TeamProject] = '${args.project}'`;

    // Add team area path filter (boards typically show work items in team's area paths)
    // Get team settings to determine area paths
    const teamSettings = await workApi.getTeamSettings(teamContext);
    if (teamSettings.defaultIteration) {
      // Add area path filtering based on team settings if available
      // This is a simplified approach - in practice, you'd want to get the team's specific area paths
      wiqlQuery += ` AND [System.AreaPath] UNDER '${args.project}'`;
    }

    // Add iteration filtering if specified
    if (args.iterationName) {
      const iterationId = await resolveIterationNameToId(
        connection,
        teamContext,
        args.iterationName,
      );
      // Get iteration details to build proper iteration path
      const iteration = await workApi.getTeamIteration(
        teamContext,
        iterationId,
      );
      if (iteration && iteration.path) {
        wiqlQuery += ` AND [System.IterationPath] = '${iteration.path}'`;
      }
    } else if (args.iterationPath) {
      wiqlQuery += ` AND [System.IterationPath] = '${args.iterationPath}'`;
    }

    // Add work item type filtering based on board configuration
    // This is board-specific and would need to be determined from board settings
    // For now, we'll include common work item types that typically appear on boards
    wiqlQuery += ` AND [System.WorkItemType] IN ('User Story', 'Bug', 'Task', 'Feature', 'Epic', 'Product Backlog Item', 'Issue')`;

    // Add state filtering to exclude removed/completed items if needed
    wiqlQuery += ` AND [System.State] <> 'Removed'`;

    // Order by backlog priority or rank
    wiqlQuery += ` ORDER BY [Microsoft.VSTS.Common.BacklogPriority] ASC, [System.Id] ASC`;

    console.log(`[DEBUG] WIQL Query: ${wiqlQuery}`);

    // Execute the query
    const queryResult = await witApi.queryByWiql(
      { query: wiqlQuery },
      teamContext,
    );

    if (!queryResult.workItems || queryResult.workItems.length === 0) {
      return {
        workItems: [],
        url: `${connection.serverUrl}/${args.project}/${args.team}/_boards/board/t/${args.team}/${args.boardName}`,
      };
    }

    // Transform query results to board work item references
    const workItemReferences = queryResult.workItems
      .filter((wi) => wi.id !== undefined)
      .map((wi) => ({
        id: wi.id!,
        url: wi.url || `${connection.serverUrl}/_apis/wit/workItems/${wi.id}`,
      }));

    // Return the board work items result
    return {
      workItems: workItemReferences,
      url: `${connection.serverUrl}/${args.project}/${args.team}/_boards/board/t/${args.team}/${args.boardName}`,
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
          `Board or work items not found: ${args.boardName} in project/team ${args.project}/${args.team}. 

          Note: This API queries work items that would appear on the board since Azure DevOps doesn't have a direct board work items REST API endpoint.`,
        );
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to get board work items: ${message}`);
  }
}
