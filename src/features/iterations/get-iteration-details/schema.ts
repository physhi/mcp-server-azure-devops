import { z } from 'zod';
import { iterationDetailsParamsSchema } from '../schemas';

// Re-exporting with a more specific name for this operation
export const GetIterationDetailsSchema = iterationDetailsParamsSchema;

export type GetIterationDetailsArgs = z.infer<typeof GetIterationDetailsSchema>;
