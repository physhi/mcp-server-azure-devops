import { z } from 'zod';
import { WorkItemExpand } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';

/**
 * Schema for getting detailed information about a work item
 */
export const GetWorkItemDetailsSchema = z.object({
  workItemId: z.number().describe('The ID of the work item'),
  expand: z
    .nativeEnum(WorkItemExpand)
    .optional()
    .default(WorkItemExpand.All)
    .describe('The level of detail to include (Default: All)'),
});

export type GetWorkItemDetailsArgs = z.infer<typeof GetWorkItemDetailsSchema>;
