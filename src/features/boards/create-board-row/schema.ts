import { z } from 'zod';

export const CreateBoardRowSchema = z.object({
  organization: z
    .string()
    .describe(
      'The Azure DevOps organization. This is used to initialize the BoardClient.',
    ),
  project: z.string().describe('The project name or ID.'),
  team: z.string().describe('The team name or ID.'),
  boardId: z.string().describe('The ID of the board.'),
  rowName: z.string().describe('The name for the new row (swimlane).'),
});

export type CreateBoardRowArgs = z.infer<typeof CreateBoardRowSchema>;
