import { z } from 'zod';
import { iterationListParamsSchema } from '../schemas';

// Re-exporting with a more specific name for this operation
export const ListIterationsSchema = iterationListParamsSchema;

export type ListIterationsArgs = z.infer<typeof ListIterationsSchema>;
