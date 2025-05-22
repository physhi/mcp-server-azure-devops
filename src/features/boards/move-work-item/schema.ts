import { z } from 'zod';
import { moveWorkItemParamsSchema } from '../schemas'; // Assuming this schema exists in the main schemas.ts

export const MoveWorkItemSchema = moveWorkItemParamsSchema;

export type MoveWorkItemArgs = z.infer<typeof MoveWorkItemSchema>;
