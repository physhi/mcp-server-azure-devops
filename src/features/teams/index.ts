// New exports for request handling
import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { WebApi } from 'azure-devops-node-api';
import {
  RequestIdentifier,
  RequestHandler,
} from '../../shared/types/request-handler';
import { defaultOrg, defaultProject } from '../../utils/environment';

// Import new modular features
import { ListTeamsSchema, listTeams } from './list-teams';
import { ListAllTeamsSchema, listAllTeams } from './list-all-teams';

// Define the response type based on observed usage
interface CallToolResponse {
  content: Array<{ type: string; text: string }>;
}

/**
 * Checks if the request is for the teams feature
 */
export const isTeamsRequest: RequestIdentifier = (
  request: CallToolRequest,
): boolean => {
  const toolName = request.params.name;
  return ['list_teams', 'list_all_teams'].includes(toolName);
};

/**
 * Handles teams feature requests
 */
export const handleTeamsRequest: RequestHandler = async (
  connection: WebApi,
  request: CallToolRequest,
): Promise<CallToolResponse> => {
  // Extract tool name and arguments
  const { name, arguments: args = {} } = request.params;

  // Ensure we have default values for organization and project
  const argsWithDefaults = {
    organization: defaultOrg,
    project: defaultProject,
    ...args,
  };

  switch (name) {
    case 'list_teams': {
      const parsedArgs = ListTeamsSchema.parse(argsWithDefaults);
      const result = await listTeams(connection, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'list_all_teams': {
      const parsedArgs = ListAllTeamsSchema.parse(argsWithDefaults);
      const result = await listAllTeams(connection, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    default:
      throw new Error(`Unknown teams tool: ${name}`);
  }
};

export * from './types';
export * from './schemas';
export * from './tool-definitions';
