import { WebApi } from 'azure-devops-node-api';
import { TeamContext } from 'azure-devops-node-api/interfaces/CoreInterfaces';
import { Board } from './types';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
} from '../../shared/errors';

/**
 * Resolves a board name to its ID by searching through available boards.
 * If the input is already a valid board ID, it returns the ID as-is.
 *
 * @param connection The Azure DevOps WebApi connection
 * @param teamContext The team context containing project and team info
 * @param boardNameOrId The board name or ID to resolve
 * @returns Promise<string> The board ID
 * @throws AzureDevOpsResourceNotFoundError if board is not found
 */
export async function resolveBoardNameToId(
  connection: WebApi,
  teamContext: TeamContext,
  boardNameOrId: string,
): Promise<string> {
  try {
    const workApi = await connection.getWorkApi();

    // First, try to get the board directly by ID (in case it's already an ID)
    try {
      const directBoard = await workApi.getBoard(teamContext, boardNameOrId);
      if (directBoard && directBoard.id) {
        return directBoard.id;
      }
    } catch {
      // If direct lookup fails, continue with name resolution
    }

    // Get all boards for the team
    const boards = await workApi.getBoards(teamContext);

    if (!boards || boards.length === 0) {
      throw new AzureDevOpsResourceNotFoundError(
        `No boards found for project/team ${teamContext.project}/${teamContext.team || 'undefined'}`,
      );
    }

    // Cast to Board[] since we know the structure (same as listBoards does)
    const boardList = boards as unknown as Board[];

    // Look for a board with matching name (case-insensitive)
    const matchingBoard = boardList.find(
      (board: Board) =>
        board.name.toLowerCase() === boardNameOrId.toLowerCase(),
    );

    if (!matchingBoard) {
      // Provide helpful error message with available board names
      const availableBoards = boardList
        .map((board: Board) => board.name)
        .join(', ');
      throw new AzureDevOpsResourceNotFoundError(
        `Board '${boardNameOrId}' not found. Available boards: ${availableBoards}`,
      );
    }

    return matchingBoard.id;
  } catch (error: unknown) {
    if (error instanceof AzureDevOpsError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new AzureDevOpsError(`Failed to resolve board name: ${message}`);
  }
}

/**
 * Helper function to create team context from common parameters
 */
export function createTeamContext(project: string, team?: string): TeamContext {
  return {
    project,
    team,
  };
}
