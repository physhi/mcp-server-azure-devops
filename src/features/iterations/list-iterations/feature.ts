import { WebApi } from 'azure-devops-node-api';
import { TeamContext } from 'azure-devops-node-api/interfaces/CoreInterfaces';
import { Iteration } from '../types';
import { ListIterationsArgs } from './schema';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';

/**
 * Lists iterations for a given project and team.
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for listing iterations.
 * @returns A promise that resolves to an array of iterations.
 */
export async function listIterations(
  connection: WebApi,
  args: ListIterationsArgs,
): Promise<Iteration[]> {
  try {
    // Use the Work API to get iterations
    const workApi = await connection.getWorkApi();

    // Create a team context for the API call
    const teamContext: TeamContext = {
      project: args.project,
      team: args.team,
    };

    // According to the Azure DevOps API documentation, only 'Current' is supported
    // for direct filtering: "A filter for which iterations are returned based on relative time.
    // Only Current is supported currently."
    // Reference: https://learn.microsoft.com/en-us/rest/api/azure/devops/work/iterations/list

    // Special case for 'current' timeframe which we know works with the API
    if (args.timeFrame === 'current') {
      return (await workApi.getTeamIterations(
        teamContext,
        'current',
      )) as unknown as Iteration[];
    }

    // For all other cases, get all iterations
    const allIterations = await workApi.getTeamIterations(teamContext);

    // Add debug information about the iterations and their timeFrame values
    console.log('DEBUG: Iterations timeFrame values:');
    allIterations.forEach((iteration) => {
      console.log(
        `Iteration: ${iteration.name}, timeFrame: ${iteration.attributes?.timeFrame}`,
      );
    });

    // If timeFrame is specified and not 'all', filter the iterations
    if (args.timeFrame && args.timeFrame !== 'all') {
      // The timeFrame in the API is an enum, not a string
      // We need to handle it differently based on the actual values in the API

      return allIterations.filter((iteration) => {
        // Get the timeFrame attribute
        const iterationTimeFrame = iteration.attributes?.timeFrame;

        // If we're looking for 'past' iterations
        if (args.timeFrame === 'past') {
          // Check if the iteration's timeFrame indicates it's in the past
          // Since we don't know the exact enum value, we'll use string representation
          return String(iterationTimeFrame).includes('Past');
        }

        // If we're looking for 'future' iterations
        if (args.timeFrame === 'future') {
          // Check if the iteration's timeFrame indicates it's in the future
          return String(iterationTimeFrame).includes('Future');
        }

        // For any other timeFrame, try a direct comparison
        return String(iterationTimeFrame) === args.timeFrame;
      }) as unknown as Iteration[];
    }

    // Return all iterations if timeFrame is not specified or is 'all'
    return allIterations as unknown as Iteration[];
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
    throw new AzureDevOpsError(`Failed to list iterations: ${message}`);
  }
}
