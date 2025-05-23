import { z } from 'zod';
import { listAllTeamsParamsSchema } from '../schemas';

// Re-exporting with a more specific name for this operation
export const ListAllTeamsSchema = listAllTeamsParamsSchema;

export type ListAllTeamsArgs = z.infer<typeof ListAllTeamsSchema>;
