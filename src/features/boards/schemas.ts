import { z } from 'zod';
import {
  Board,
  BoardColumn,
  BoardFields,
  BoardRow,
  BoardWorkItemsResult,
} from '@/features/boards/types';

// Common schemas
export const fieldReferenceSchema = z.object({
  referenceName: z.string(),
  url: z.string().url(),
});

export const boardFieldsSchema: z.ZodType<BoardFields> = z.object({
  columnField: fieldReferenceSchema,
  doneField: fieldReferenceSchema,
  rowField: fieldReferenceSchema,
});

export const boardColumnSchema: z.ZodType<BoardColumn> = z.object({
  id: z.string(),
  name: z.string(),
  itemLimit: z.number().optional(),
  columnType: z.enum(['incoming', 'inProgress', 'outgoing', 'custom']),
  stateMappings: z.record(z.array(z.string())),
  isSplit: z.boolean(),
  description: z.string().optional(),
});

export const boardRowSchema: z.ZodType<BoardRow> = z.object({
  id: z.string(),
  name: z.string(),
});

// Board schemas
export const boardSchema: z.ZodType<Board> = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  columns: z.array(boardColumnSchema),
  isValid: z.boolean(),
  allowedMappings: z.record(z.array(z.string())),
  canEdit: z.boolean(),
  fields: boardFieldsSchema,
  revision: z.number(),
  rows: z.array(boardRowSchema),
});

export const boardWorkItemReferenceSchema = z.object({
  id: z.number(),
  url: z.string().url(),
});

export const boardWorkItemsResultSchema: z.ZodType<BoardWorkItemsResult> =
  z.object({
    workItems: z.array(boardWorkItemReferenceSchema),
    url: z.string().url(),
  });

// Request parameter schemas
export const boardListParamsSchema = z.object({
  organization: z.string(),
  project: z.string(),
  team: z.string(),
});

export const boardParamsSchema = boardListParamsSchema.extend({
  boardId: z.string(),
});

export const boardWorkItemsParamsSchema = boardParamsSchema.extend({
  iterationId: z.string().optional(),
  iterationPath: z.string().optional(),
});

export const moveWorkItemParamsSchema = z.object({
  organization: z.string(),
  project: z.string(),
  workItemId: z.number(),
  columnId: z.string().optional(),
  rowId: z.string().optional(),
});

// Response schemas
export const boardResponseSchema = z.object({
  board: boardSchema,
});

export const boardListResponseSchema = z.object({
  count: z.number(),
  value: z.array(boardSchema),
});

export const boardWorkItemsResponseSchema = z.object({
  result: boardWorkItemsResultSchema,
});

export const boardColumnsResponseSchema = z.object({
  columns: z.array(boardColumnSchema),
});
