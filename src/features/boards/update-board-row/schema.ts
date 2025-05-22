import { z } from 'zod';

export const UpdateBoardRowSchema = z.object({
  organization: z
    .string()
    .describe(
      'The Azure DevOps organization. This is used to initialize the BoardClient.',
    ),
  project: z.string().describe('The project name or ID.'),
  team: z.string().describe('The team name or ID.'),
  boardId: z.string().describe('The ID of the board.'),
  rowId: z.string().describe('The ID of the row (swimlane) to update.'),
  newName: z.string().describe('The new name for the row.'),
});

export type UpdateBoardRowArgs = z.infer<typeof UpdateBoardRowSchema>;
