import { z } from 'zod';
import {
  defaultOrg,
  defaultProject,
  defaultTeam,
} from '../../../utils/environment';

export const CreateBoardRowSchema = z.object({
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
  rowName: z.string().describe('The name for the new row (swimlane).'),
});

export type CreateBoardRowArgs = z.infer<typeof CreateBoardRowSchema>;
