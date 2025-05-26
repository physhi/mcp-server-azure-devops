import { z } from 'zod';
import { WorkItemExpand } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import {
  defaultOrg,
  defaultProject,
  defaultTeam,
} from '../../../utils/environment';

/**
 * Schema for getting work items by iteration
 */
export const GetWorkItemsByIterationSchema = z.object({
  organization: z
    .string()
    .default(defaultOrg)
    .describe(`The ID or name of the organization (Default: ${defaultOrg})`),
  project: z
    .string()
    .default(defaultProject)
    .describe(`The ID or name of the project (Default: ${defaultProject})`),
  team: z
    .string()
    .optional()
    .default(defaultTeam)
    .describe(`The ID or name of the team (Default: ${defaultTeam})`),
  iterationId: z
    .string()
    .describe('The ID of the iteration to get work items for'),
  expand: z
    .nativeEnum(WorkItemExpand)
    .optional()
    .default(WorkItemExpand.All)
    .describe(
      'The level of detail to include in the work items (Default: All)',
    ),
  state: z
    .string()
    .optional()
    .describe('Filter work items by state (e.g., "Active", "Closed")'),
  workItemType: z
    .string()
    .optional()
    .describe('Filter work items by type (e.g., "User Story", "Bug")'),
});

export type GetWorkItemsByIterationArgs = z.infer<
  typeof GetWorkItemsByIterationSchema
>;
