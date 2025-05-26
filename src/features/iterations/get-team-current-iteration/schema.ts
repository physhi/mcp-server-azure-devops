import { z } from 'zod';
import { teamCurrentIterationParamsSchema } from '../schemas';

// Re-exporting with a more specific name for this operation
export const GetTeamCurrentIterationSchema = teamCurrentIterationParamsSchema;

export type GetTeamCurrentIterationArgs = z.infer<
  typeof GetTeamCurrentIterationSchema
>;
