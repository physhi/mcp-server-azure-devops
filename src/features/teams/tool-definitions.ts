import { zodToJsonSchema } from 'zod-to-json-schema';
import { ToolDefinition } from '../../shared/types/tool-definition';
import { listTeamsParamsSchema, listAllTeamsParamsSchema } from './schemas';

/**
 * List of team tools
 */
export const teamsTools: ToolDefinition[] = [
  {
    name: 'list_teams',
    description: 'Get a list of teams for a specific project',
    inputSchema: zodToJsonSchema(listTeamsParamsSchema),
  },
  {
    name: 'list_all_teams',
    description: 'Get a list of all teams across the organization',
    inputSchema: zodToJsonSchema(listAllTeamsParamsSchema),
  },
];
