import { z } from 'zod';
import { boardListParamsSchema } from '../schemas'; // Assuming boardListParamsSchema is defined in the main schemas.ts

// Re-exporting with a more specific name for this operation, or you can use boardListParamsSchema directly
export const ListBoardsSchema = boardListParamsSchema;

export type ListBoardsArgs = z.infer<typeof ListBoardsSchema>;
