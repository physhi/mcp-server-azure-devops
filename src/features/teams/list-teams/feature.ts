import { WebApi } from 'azure-devops-node-api';
import { Team } from '../types';
import { ListTeamsArgs } from './schema';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../../shared/errors';

/**
 * Lists teams for a given project.
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for listing teams.
 * @returns A promise that resolves to an array of teams.
 */
export async function listTeams(
  connection: WebApi,
  args: ListTeamsArgs,
): Promise<Team[]> {
  try {
    // Use the Core API to get teams
    const coreApi = await connection.getCoreApi();

    // Get the teams for the specified project
    // The expandIdentity parameter allows for additional team identity information
    const teams = await coreApi.getTeams(args.project, args.expandIdentity);
    return teams as Team[];
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
          `Project not found: ${args.project}`,
        );
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to list teams: ${message}`);
  }
}
