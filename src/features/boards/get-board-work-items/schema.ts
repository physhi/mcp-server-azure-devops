import { z } from 'zod';
import { boardWorkItemsParamsSchema } from '../schemas'; // Assuming this schema exists in the main schemas.ts

export const GetBoardWorkItemsSchema = boardWorkItemsParamsSchema;

export type GetBoardWorkItemsArgs = z.infer<typeof GetBoardWorkItemsSchema>;
