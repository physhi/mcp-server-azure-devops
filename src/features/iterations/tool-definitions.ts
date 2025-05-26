import { zodToJsonSchema } from 'zod-to-json-schema';
import { ToolDefinition } from '../../shared/types/tool-definition';
import {
  iterationListParamsSchema,
  iterationDetailsParamsSchema,
  teamCurrentIterationParamsSchema,
  sprintBurndownParamsSchema,
  teamVelocityParamsSchema,
} from './schemas';

/**
 * List of iteration tools
 */
export const iterationTools: ToolDefinition[] = [
  {
    name: 'list_iterations',
    description: 'Get all iterations/sprints for a team',
    inputSchema: zodToJsonSchema(iterationListParamsSchema),
  },
  {
    name: 'get_iteration_details',
    description: 'Get comprehensive details about a specific iteration by name',
    inputSchema: zodToJsonSchema(iterationDetailsParamsSchema),
  },
  {
    name: 'get_team_current_iteration',
    description: "Get the team's current active sprint",
    inputSchema: zodToJsonSchema(teamCurrentIterationParamsSchema),
  },
  {
    name: 'get_sprint_burndown',
    description: 'Get burndown chart data for a sprint by name',
    inputSchema: zodToJsonSchema(sprintBurndownParamsSchema),
  },
  {
    name: 'get_team_velocity',
    description: 'Get velocity data across iterations',
    inputSchema: zodToJsonSchema(teamVelocityParamsSchema),
  },
];
