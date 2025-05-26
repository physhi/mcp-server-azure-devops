import { z } from 'zod';
import {
  defaultOrg,
  defaultProject,
  defaultTeam,
} from '../../utils/environment';

/**
 * Base schema for iteration-related parameters
 */
export const baseIterationParamsSchema = z.object({
  organization: z
    .string()
    .optional()
    .describe(`The ID or name of the organization (Default: ${defaultOrg})`),
  project: z
    .string()
    .optional()
    .describe(`The ID or name of the project (Default: ${defaultProject})`),
  team: z
    .string()
    .optional()
    .describe(`The ID or name of the team (Default: ${defaultTeam})`),
});

/**
 * Schema for listing iterations
 */
export const iterationListParamsSchema = baseIterationParamsSchema
  .extend({
    timeFrame: z
      .enum(['past', 'current', 'future', 'all'])
      .optional()
      .describe(
        'Filter iterations by timeframe past / current / future / all (Default: all)',
      ),
  })
  .transform((data) => ({
    ...data,
    organization: data.organization ?? defaultOrg,
    project: data.project ?? defaultProject,
    team: data.team ?? defaultTeam,
  }));

/**
 * Schema for getting iteration details
 */
export const iterationDetailsParamsSchema = baseIterationParamsSchema.extend({
  iterationId: z
    .string()
    .describe('The ID of the iteration to get details for'),
  includeWorkItems: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to include work item information (Default: false)'),
});

/**
 * Schema for getting team's current iteration
 */
export const teamCurrentIterationParamsSchema =
  baseIterationParamsSchema.extend({
    includeProgress: z
      .boolean()
      .optional()
      .default(false)
      .describe('Whether to include progress information (Default: false)'),
  });

/**
 * Schema for getting sprint burndown data
 */
export const sprintBurndownParamsSchema = baseIterationParamsSchema.extend({
  iterationId: z
    .string()
    .describe('The ID of the iteration to get burndown data for'),
  includeIdealLine: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to include the ideal burndown line (Default: true)'),
  workItemTypes: z
    .array(z.string())
    .optional()
    .describe(
      'Filter by specific work item types (e.g., ["User Story", "Bug"])',
    ),
});

/**
 * Schema for getting team velocity data
 */
export const teamVelocityParamsSchema = baseIterationParamsSchema.extend({
  iterationCount: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .default(6)
    .describe(
      'Number of past iterations to include in velocity calculation (Default: 6)',
    ),
  includeCurrentIteration: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Whether to include the current iteration in velocity calculation (Default: false)',
    ),
  workItemTypes: z
    .array(z.string())
    .optional()
    .describe(
      'Filter by specific work item types (e.g., ["User Story", "Bug"])',
    ),
});

// Export argument types
export type ListIterationsArgs = z.infer<typeof iterationListParamsSchema>;
export type GetIterationDetailsArgs = z.infer<
  typeof iterationDetailsParamsSchema
>;
export type GetTeamCurrentIterationArgs = z.infer<
  typeof teamCurrentIterationParamsSchema
>;
export type GetSprintBurndownArgs = z.infer<typeof sprintBurndownParamsSchema>;
export type GetTeamVelocityArgs = z.infer<typeof teamVelocityParamsSchema>;
