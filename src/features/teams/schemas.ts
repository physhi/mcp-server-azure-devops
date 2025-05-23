import { z } from 'zod';
import { defaultOrg, defaultProject } from '../../utils/environment';

/**
 * Common schemas for the teams feature
 */

// Team schema based on WebApiTeam interface
export const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  description: z.string().optional(),
  identityUrl: z.string().url().optional(),
  projectName: z.string().optional(),
  projectId: z.string().optional(),
});

// Request parameter schemas
export const listTeamsParamsSchema = z.object({
  organization: z
    .string()
    .describe(`The ID or name of the organization (Default: ${defaultOrg})`),
  project: z
    .string()
    .describe(`The ID or name of the project (Default: ${defaultProject})`),
  expandIdentity: z
    .boolean()
    .optional()
    .describe('Optional. Whether to expand team identity information'),
});

export const listAllTeamsParamsSchema = z.object({
  organization: z
    .string()
    .describe(`The ID or name of the organization (Default: ${defaultOrg})`),
  expandIdentity: z
    .boolean()
    .optional()
    .describe('Optional. Whether to expand team identity information'),
});

// Response schemas
export const teamsResponseSchema = z.object({
  count: z.number(),
  value: z.array(teamSchema),
});
