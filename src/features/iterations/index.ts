// New exports for request handling
import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { WebApi } from 'azure-devops-node-api';
import {
  RequestIdentifier,
  RequestHandler,
} from '../../shared/types/request-handler';
import {
  defaultOrg,
  defaultProject,
  defaultTeam,
} from '../../utils/environment';

// Import new modular features
// We'll create placeholder imports until the modules are fully implemented

// Import schemas from the local schemas.ts file
import {
  iterationListParamsSchema as ListIterationsSchema,
  iterationDetailsParamsSchema as GetIterationDetailsSchema,
  teamCurrentIterationParamsSchema as GetTeamCurrentIterationSchema,
  sprintBurndownParamsSchema as GetSprintBurndownSchema,
  teamVelocityParamsSchema as GetTeamVelocitySchema,
} from './schemas';

// Import feature implementations
import { listIterations } from './list-iterations/feature';
import { getIterationDetails } from './get-iteration-details/feature';
import { getTeamCurrentIteration } from './get-team-current-iteration/feature';
import { getSprintBurndown } from './get-sprint-burndown/feature';
import { getTeamVelocity } from './get-team-velocity/feature';

// Define the response type based on observed usage
interface CallToolResponse {
  content: Array<{ type: string; text: string }>;
}

/**
 * Checks if the request is for the iterations feature
 */
export const isIterationsRequest: RequestIdentifier = (
  request: CallToolRequest,
): boolean => {
  const toolName = request.params.name;
  return [
    'list_iterations',
    'get_iteration_details',
    'get_team_current_iteration',
    'get_sprint_burndown',
    'get_team_velocity',
  ].includes(toolName);
};

/**
 * Handles iterations feature requests
 */
export const handleIterationsRequest: RequestHandler = async (
  connection: WebApi,
  request: CallToolRequest,
): Promise<CallToolResponse> => {
  // Extract tool name and arguments
  const { name, arguments: args = {} } = request.params;

  // Ensure we have default values for organization, project, and team
  const argsWithDefaults = {
    organization: defaultOrg,
    project: defaultProject,
    team: defaultTeam,
    ...args,
  };

  switch (name) {
    case 'list_iterations': {
      const parsedArgs = ListIterationsSchema.parse(argsWithDefaults);
      const result = await listIterations(connection, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'get_iteration_details': {
      const parsedArgs = GetIterationDetailsSchema.parse(argsWithDefaults);
      const result = await getIterationDetails(connection, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'get_team_current_iteration': {
      const parsedArgs = GetTeamCurrentIterationSchema.parse(argsWithDefaults);
      const result = await getTeamCurrentIteration(connection, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'get_sprint_burndown': {
      const parsedArgs = GetSprintBurndownSchema.parse(argsWithDefaults);
      const result = await getSprintBurndown(connection, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    case 'get_team_velocity': {
      const parsedArgs = GetTeamVelocitySchema.parse(argsWithDefaults);
      const result = await getTeamVelocity(connection, parsedArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
    default:
      throw new Error(`Unknown iteration tool: ${name}`);
  }
};

export * from './types';
export * from './schemas';
export * from './tool-definitions';
export * from './get-sprint-burndown';
export * from './get-team-velocity';
