/**
 * Types for the teams feature
 */

import { WebApiTeam } from 'azure-devops-node-api/interfaces/CoreInterfaces';

/**
 * Team type from Azure DevOps API
 */
export type Team = WebApiTeam;

/**
 * Parameters for listing teams
 */
export interface ListTeamsParams {
  organization: string;
  project: string;
  expandIdentity?: boolean;
}

/**
 * Parameters for getting all teams across the organization
 */
export interface ListAllTeamsParams {
  organization: string;
  expandIdentity?: boolean;
}
