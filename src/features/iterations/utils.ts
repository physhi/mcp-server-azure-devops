import { WebApi } from 'azure-devops-node-api';
import { TeamContext } from 'azure-devops-node-api/interfaces/CoreInterfaces';
import { Iteration } from './types';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../shared/errors';

/**
 * Resolves an iteration name to its ID by searching through available iterations.
 * If the input is already a valid iteration ID, it returns the ID as-is.
 *
 * @param connection The Azure DevOps WebApi connection
 * @param teamContext The team context containing project and team info
 * @param iterationNameOrId The iteration name or ID to resolve
 * @returns Promise<string> The iteration ID
 * @throws AzureDevOpsResourceNotFoundError if iteration is not found
 */
export async function resolveIterationNameToId(
  connection: WebApi,
  teamContext: TeamContext,
  iterationNameOrId: string,
): Promise<string> {
  try {
    const workApi = await connection.getWorkApi();

    // First, try to get the iteration directly by ID (in case it's already an ID)
    try {
      const directIteration = await workApi.getTeamIteration(
        teamContext,
        iterationNameOrId,
      );
      if (directIteration && directIteration.id) {
        return directIteration.id;
      }
    } catch {
      // If direct lookup fails, continue with name resolution
    }

    // Get all iterations for the team
    const iterations = await workApi.getTeamIterations(teamContext);

    if (!iterations || iterations.length === 0) {
      throw new AzureDevOpsResourceNotFoundError(
        `No iterations found for project/team ${teamContext.project}/${teamContext.team || 'undefined'}`,
      );
    }

    // Cast to Iteration[] since we know the structure (same as listIterations does)
    const iterationList = iterations as unknown as Iteration[];

    // Look for an iteration with matching name (case-insensitive)
    const matchingIteration = iterationList.find(
      (iteration: Iteration) =>
        iteration.name.toLowerCase() === iterationNameOrId.toLowerCase(),
    );

    if (!matchingIteration) {
      // Provide helpful error message with available iteration names
      const availableIterations = iterationList
        .map((iteration: Iteration) => iteration.name)
        .join(', ');
      throw new AzureDevOpsResourceNotFoundError(
        `Iteration '${iterationNameOrId}' not found. Available iterations: ${availableIterations}`,
      );
    }

    return matchingIteration.id;
  } catch (error: unknown) {
    if (error instanceof AzureDevOpsError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to resolve iteration name: ${message}`);
  }
}

/**
 * Helper function to create team context from common parameters
 */
export function createTeamContext(project: string, team?: string): TeamContext {
  return {
    project,
    team,
  };
}
