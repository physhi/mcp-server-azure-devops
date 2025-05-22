import { z } from 'zod';
import { boardParamsSchema } from '../schemas'; // Assuming boardParamsSchema is defined in the main schemas.ts

// Re-exporting with a more specific name for this operation
export const GetBoardColumnsSchema = boardParamsSchema;

export type GetBoardColumnsArgs = z.infer<typeof GetBoardColumnsSchema>;
