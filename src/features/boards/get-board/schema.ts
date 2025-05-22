import { z } from 'zod';
import { boardParamsSchema } from '../schemas'; // Assuming boardParamsSchema is defined in the main schemas.ts

// Re-exporting with a more specific name for this operation
export const GetBoardSchema = boardParamsSchema;

export type GetBoardArgs = z.infer<typeof GetBoardSchema>;
