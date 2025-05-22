import { z } from 'zod';

export const DeleteBoardRowSchema = z.object({
  organization: z
    .string()
    .describe(
      'The Azure DevOps organization. This is used to initialize the BoardClient.',
    ),
  project: z.string().describe('The project name or ID.'),
  team: z.string().describe('The team name or ID.'),
  boardId: z.string().describe('The ID of the board.'),
  rowId: z.string().describe('The ID of the row (swimlane) to delete.'),
});

export type DeleteBoardRowArgs = z.infer<typeof DeleteBoardRowSchema>;
