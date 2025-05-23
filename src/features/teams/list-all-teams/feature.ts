import { WebApi } from 'azure-devops-node-api';
import { Team } from '../types';
import { ListAllTeamsArgs } from './schema';
import { AzureDevOpsError } from '../../../shared/errors';

/**
 * Lists all teams across the organization.
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for listing all teams.
 * @returns A promise that resolves to an array of teams.
 */
export async function listAllTeams(
  connection: WebApi,
  args: ListAllTeamsArgs,
): Promise<Team[]> {
  try {
    // Use the Core API to get all teams
    const coreApi = await connection.getCoreApi();

    // Get all teams across the organization
    // The expandIdentity parameter allows for additional team identity information
    const teams = await coreApi.getAllTeams(args.expandIdentity);
    return teams as Team[];
  } catch (error: unknown) {
    if (error instanceof AzureDevOpsError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to list all teams: ${message}`);
  }
}
