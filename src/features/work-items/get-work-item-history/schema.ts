import { z } from 'zod';
import { defaultProject } from '../../../utils/environment';

/**
 * Schema for getting work item history
 */
export const GetWorkItemHistorySchema = z.object({
  workItemId: z.number().describe('The ID of the work item to get history for'),
  projectId: z
    .string()
    .optional()
    .describe(`The ID or name of the project (Default: ${defaultProject})`),
  top: z
    .number()
    .optional()
    .default(100)
    .describe('The maximum number of updates to return (Default: 100)'),
  skip: z
    .number()
    .optional()
    .default(0)
    .describe('The number of updates to skip (Default: 0)'),
});

export type GetWorkItemHistoryArgs = z.infer<typeof GetWorkItemHistorySchema>;
