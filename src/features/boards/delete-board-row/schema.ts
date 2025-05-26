import { z } from 'zod';
import {
  defaultOrg,
  defaultProject,
  defaultTeam,
} from '../../../utils/environment';

export const DeleteBoardRowSchema = z.object({
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
  rowId: z.string().describe('The ID of the row (swimlane) to delete.'),
});

export type DeleteBoardRowArgs = z.infer<typeof DeleteBoardRowSchema>;
