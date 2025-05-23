import { z } from 'zod';
import { listTeamsParamsSchema } from '../schemas';

// Re-exporting with a more specific name for this operation
export const ListTeamsSchema = listTeamsParamsSchema;

export type ListTeamsArgs = z.infer<typeof ListTeamsSchema>;
