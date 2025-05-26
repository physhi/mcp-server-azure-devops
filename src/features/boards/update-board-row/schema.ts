import { z } from 'zod';
import {
  defaultOrg,
  defaultProject,
  defaultTeam,
} from '../../../utils/environment';

export const UpdateBoardRowSchema = z.object({
  organization: z
    .string()
    .optional()
    .describe(
      `The Azure DevOps organization (Default: ${defaultOrg}). This is used to initialize the BoardClient.`,
    ),
  project: z
    .string()
    .optional()
    .describe(`The project name or ID (Default: ${defaultProject}).`),
  team: z
    .string()
    .optional()
    .describe(`The team name or ID (Default: ${defaultTeam}).`),
  boardId: z.string().describe('The ID of the board.'),
  rowId: z.string().describe('The ID of the row (swimlane) to update.'),
  newName: z.string().describe('The new name for the row.'),
});

export type UpdateBoardRowArgs = z.infer<typeof UpdateBoardRowSchema>;
